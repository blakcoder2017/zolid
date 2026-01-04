const db = require('../db/db');
const AppError = require('../utils/appError');
const LedgerService = require('./ledgerService');

class DisputeService {
    
    /**
     * Raises a dispute for a specific job.
     */
    static async raiseDispute(user, job_id, data) {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            const jobRes = await client.query(
                `SELECT * FROM job_transactions WHERE id = $1`, 
                [job_id]
            );
            
            if (jobRes.rows.length === 0) {
                throw new AppError("Job not found", 404);
            }
            
            const job = jobRes.rows[0];

            const validStates = ['IN_PROGRESS', 'COMPLETED_PENDING', 'ESCROW_HELD', 'STARTED'];
            if (!validStates.includes(job.current_state)) {
                throw new AppError(`Disputes cannot be raised when job is in ${job.current_state} state.`, 400);
            }

            if (user.id !== job.client_id && user.id !== job.artisan_id) {
                throw new AppError("You are not authorized to dispute this job.", 403);
            }

            let disputeRes;
            if (user.id === job.client_id) {
                disputeRes = await client.query(
                    `INSERT INTO disputes
                    (job_id, raised_by_client_id, category, description, evidence_urls, status)
                    VALUES ($1, $2, $3, $4, $5, 'OPEN')
                    RETURNING id, status, created_at`,
                    [job_id, user.id, data.category, data.description, data.evidence_urls || []]
                );
            } else if (user.id === job.artisan_id) {
                disputeRes = await client.query(
                    `INSERT INTO disputes
                    (job_id, raised_by_artisan_id, category, description, evidence_urls, status)
                    VALUES ($1, $2, $3, $4, $5, 'OPEN')
                    RETURNING id, status, created_at`,
                    [job_id, user.id, data.category, data.description, data.evidence_urls || []]
                );
            } else {
                throw new AppError("You are not authorized to dispute this job.", 403);
            }

            await client.query(
                `UPDATE job_transactions 
                 SET current_state = 'DISPUTED', updated_at = NOW() 
                 WHERE id = $1`,
                [job_id]
            );

            await client.query('COMMIT');
            return disputeRes.rows[0];

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    static async getDisputeByJob(job_id) {
        const res = await db.query(`
            SELECT d.*,
                   CASE
                       WHEN d.raised_by_client_id IS NOT NULL THEN 'CLIENT'
                       WHEN d.raised_by_artisan_id IS NOT NULL THEN 'ARTISAN'
                       ELSE NULL
                   END AS raised_by_type,
                   CASE
                       WHEN d.raised_by_client_id IS NOT NULL THEN d.raised_by_client_id
                       WHEN d.raised_by_artisan_id IS NOT NULL THEN d.raised_by_artisan_id
                       ELSE NULL
                   END AS raised_by_id
            FROM disputes d
            WHERE d.job_id = $1`, [job_id]);
        return res.rows[0];
    }

    static async acceptProposal(client, userId, disputeId) {
        const disputeRes = await client.query('SELECT * FROM disputes WHERE id = $1', [disputeId]);
        const dispute = disputeRes.rows[0];
        const jobRes = await client.query('SELECT * FROM job_transactions WHERE id = $1', [dispute.job_id]);
        const job = jobRes.rows[0];
        
        const refundAmount = dispute.proposed_refund_amount;
        const artisanPayout = job.gross_fee_pesewas - refundAmount;
        const txRef = `AUTO_RESOLVE_${disputeId}`;
        
        await LedgerService.postWithClient(client, txRef, 'Liability_MoMo_Escrow', job.gross_fee_pesewas, 'DEBIT');
        
        if (refundAmount > 0) {
            await LedgerService.postWithClient(client, txRef, 'Liability_Client_Wallet', refundAmount, 'CREDIT');
        }
        
        if (artisanPayout > 0) {
            const commission = artisanPayout * 0.20; 
            const finalArtisanShare = artisanPayout - commission;
            
            await LedgerService.postWithClient(client, txRef, 'Liability_Artisan_Wallet', finalArtisanShare, 'CREDIT');
            await LedgerService.postWithClient(client, txRef, 'Revenue_Commissions', commission, 'CREDIT');
        }
        
        await client.query("UPDATE job_transactions SET current_state = 'COMPLETED_DISPUTE_RESOLVED' WHERE id = $1", [job.id]);
        await client.query("UPDATE disputes SET status = 'RESOLVED_AUTOMATED' WHERE id = $1", [disputeId]);
        
        return { success: true, message: "Dispute resolved automatically. Funds distributed." };
    }

    // --- STATIC METHODS ADDED HERE ---

    static async getMessages(client, disputeId) {
        const res = await client.query(`
            SELECT * FROM dispute_messages 
            WHERE dispute_id = $1 
            ORDER BY created_at ASC
        `, [disputeId]);
        return res.rows;
    }

    static async sendMessage(client, { disputeId, senderId, senderRole, message }) {
        // 1. Check Dispute Status
        const disputeCheck = await client.query(
            `SELECT status FROM disputes WHERE id = $1`, 
            [disputeId]
        );

        if (disputeCheck.rows.length === 0) {
            throw new AppError("Dispute not found.", 404);
        }

        if (disputeCheck.rows[0].status !== 'OPEN') {
            throw new AppError("This dispute is resolved. No further messages can be sent.", 400);
        }

        // 2. Send Message
        const res = await client.query(`
            INSERT INTO dispute_messages (dispute_id, sender_id, sender_role, message)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [disputeId, senderId, senderRole, message]);
        
        return res.rows[0];
    }

    static async getUserDisputes(client, userId, role) {
        // Find disputes where the user is involved (either as client or artisan)
        const query = `
            SELECT d.*, jt.job_description, jt.gross_fee_pesewas, jt.current_state as job_status
            FROM disputes d
            JOIN job_transactions jt ON d.job_id = jt.id
            WHERE (jt.client_id = $1 AND $2 = 'client') 
               OR (jt.artisan_id = $1 AND $2 = 'artisan')
            ORDER BY d.created_at DESC
        `;
        // Note: Ensure role is normalized to 'client' or 'artisan' if needed, 
        // but typically your auth middleware provides it correctly.
        const res = await client.query(query, [userId, role]);
        return res.rows;
    }

    static async getUserDisputes(client, userId, role) {
        // Find disputes where the user is involved (either as client or artisan)
        const query = `
            SELECT d.*, jt.job_description, jt.gross_fee_pesewas, jt.current_state as job_status
            FROM disputes d
            JOIN job_transactions jt ON d.job_id = jt.id
            WHERE (jt.client_id = $1 AND $2 = 'client') 
               OR (jt.artisan_id = $1 AND $2 = 'artisan')
            ORDER BY d.created_at DESC
        `;
        const res = await client.query(query, [userId, role]);
        return res.rows;
    }
}

module.exports = DisputeService;