
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const PaystackService = require('./paystackService');
const identityService = require('./identityService');
const db = require('../db/db');

class AdminService {
    
    // =========================================================================
    // SECTION A: ADMIN AUTHENTICATION & USER MANAGEMENT
    // =========================================================================

    async createAdmin(client, adminData) {
        const { email, password, full_name, phone, role = 'admin', permissions = {} } = adminData;
        
        if (!email || !email.includes('@')) throw new AppError('Valid email is required', 400);
        
        const existingAdmin = await client.query('SELECT id FROM admin_users WHERE email = $1', [email]);
        if (existingAdmin.rows.length > 0) throw new AppError('Admin with this email already exists', 409);
        
        const passwordHash = await bcrypt.hash(password, 10);
        
        const defaultPermissions = {
            dashboard: true, users: true, jobs: true, 
            finance: true, analytics: true, settings: true
        };
        const finalPermissions = Object.assign(defaultPermissions, permissions);
        
        const result = await client.query(
            `INSERT INTO admin_users (email, password_hash, full_name, phone, role, permissions, is_active) 
             VALUES ($1, $2, $3, $4, $5, $6, TRUE) RETURNING *`,
            [email, passwordHash, full_name, phone, role, finalPermissions]
        );
        
        await this.logAdminAction(client, result.rows[0].id, 'create_admin', 'admin_user', result.rows[0].id, null, result.rows[0], 'system', 'initial_setup');
        return this.sanitizeAdminData(result.rows[0]);
    }

    async login(client, email, password, ip, userAgent) {
        const result = await client.query('SELECT * FROM admin_users WHERE email = $1', [email]);
        if (result.rows.length === 0) throw new AppError('Invalid email or password', 401);
        
        const admin = result.rows[0];
        if (!admin.is_active) throw new AppError('Admin account is inactive', 403);
        
        const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
        if (!isPasswordValid) throw new AppError('Invalid email or password', 401);
        
        const token = this.generateAdminToken(admin);
        
        await client.query('UPDATE admin_users SET last_login = NOW() WHERE id = $1', [admin.id]);
        await this.logAdminAction(client, admin.id, 'login', 'admin_user', admin.id, null, null, ip, userAgent);
        
        return { token, admin: this.sanitizeAdminData(admin) };
    }

    generateAdminToken(admin) {
        const secret = process.env.JWT_SECRET;
        const expiresIn = '12h';
        return jwt.sign({ 
            id: admin.id, email: admin.email, role: admin.role, permissions: admin.permissions 
        }, secret, { expiresIn });
    }

    sanitizeAdminData(admin) {
        const { password_hash, ...sanitized } = admin;
        return sanitized;
    }

    async logAdminAction(client, adminId, action, entityType, entityId, oldValue, newValue, ipAddress, userAgent, metadata = {}) {
        try {
            await client.query(
                `INSERT INTO admin_audit_log 
                 (admin_id, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent, metadata) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [adminId, action, entityType, entityId, 
                 oldValue ? JSON.stringify(oldValue) : null, 
                 newValue ? JSON.stringify(newValue) : null, 
                 ipAddress, userAgent, metadata ? JSON.stringify(metadata) : null]
            );
        } catch (error) {
            console.error('Failed to log admin action:', error.message);
        }
    }

    // =========================================================================
    // SECTION B: MODULE 1 - ARTISAN GOVERNANCE & KYC
    // =========================================================================

    async listArtisans(client, { page = 1, limit = 20, tier, trade, status, search }) {
        const offset = (page - 1) * limit;
        const params = [limit, offset];
        let query = `
            SELECT
                ap.id,
                ap.full_name,
                ap.phone_primary as phone_number,
                ap.primary_trade as trade,
                ap.is_identity_verified as status,
                ap.tier_level,
                ap.reputation_score as rating,
                ap.profile_picture_url as picture_url,
                ap.total_review_count,
                ap.gender,
                ap.dob,
                ap.email,
                ap.created_at,
                COUNT(jt.id) as jobs_completed
            FROM artisan_profiles ap
            LEFT JOIN job_transactions jt ON ap.id = jt.artisan_id
                AND jt.current_state = 'PAYOUT_SUCCESS'
        `;

        let paramIdx = 3;
        if (tier) { query += ` AND ap.tier_level = $${paramIdx++}`; params.push(tier); }
        if (trade) { query += ` AND ap.primary_trade = $${paramIdx++}`; params.push(trade); }
        if (status) { query += ` AND ap.verification_status = $${paramIdx++}`; params.push(status); }
        if (search) {
            query += ` AND (ap.full_name ILIKE $${paramIdx} OR ap.phone_primary ILIKE $${paramIdx})`;
            params.push(`%${search}%`); paramIdx++;
        }

        query += ` GROUP BY ap.id ORDER BY ap.created_at DESC LIMIT $1 OFFSET $2`;
        const countQuery = `SELECT COUNT(*) FROM artisan_profiles`;
        
        const [rows, countRes] = await Promise.all([
            client.query(query, params),
            client.query(countQuery)
        ]);

        return {
            artisans: rows.rows,
            total: parseInt(countRes.rows[0].count),
            page: parseInt(page),
            pages: Math.ceil(parseInt(countRes.rows[0].count) / limit)
        };
    }

    async getArtisanDeepDive(client, id) {
        const profileRes = await client.query(`SELECT 
            ap.*, 
            COUNT(jt.id) as jobs_completed
        FROM artisan_profiles ap
        LEFT JOIN job_transactions jt 
            ON ap.id = jt.artisan_id 
            AND jt.current_state = 'PAYOUT_SUCCESS'
        WHERE ap.id = $1
        GROUP BY ap.id`, [id]);
        
        if (profileRes.rows.length === 0) throw new AppError("Artisan not found", 404);
        const profile = profileRes.rows[0];

        const statsRes = await client.query(`
            SELECT COUNT(*) as total_jobs,
                   SUM(CASE WHEN current_state = 'PAYOUT_SUCCESS' THEN 1 ELSE 0 END) as successful_jobs,
                   SUM(CASE WHEN current_state = 'DISPUTED' THEN 1 ELSE 0 END) as disputed_jobs,
                   SUM(artisan_payout_pesewas) as total_earnings
            FROM job_transactions WHERE artisan_id = $1
        `, [id]);

        const guarantorsRes = await client.query(`
            SELECT id, name, phone, relationship, is_verified, created_at
            FROM artisan_guarantors WHERE artisan_id = $1 ORDER BY created_at DESC
        `, [id]);

        const pastJobsRes = await client.query(`
            SELECT id, job_description, gross_fee_pesewas, artisan_payout_pesewas,
                   current_state, created_at, updated_at
            FROM job_transactions WHERE artisan_id = $1 ORDER BY created_at DESC LIMIT 20
        `, [id]);

        const disputesRes = await client.query(`
            SELECT d.id, d.job_id, d.category, d.description, d.status,
                   d.created_at, d.resolution_notes,
                   jt.job_description as job_description
            FROM disputes d
            JOIN job_transactions jt ON d.job_id = jt.id
            WHERE jt.artisan_id = $1 ORDER BY d.created_at DESC
        `, [id]);

        const earningsRes = await client.query(`
            SELECT
                SUM(CASE WHEN p.direction = 'CREDIT' AND a.name = 'Liability_Artisan_Wallet' THEN p.amount_pesewas ELSE 0 END) as total_earnings,
                SUM(CASE WHEN p.direction = 'DEBIT' AND a.name = 'Liability_Artisan_Wallet' THEN p.amount_pesewas ELSE 0 END) as total_withdrawals
            FROM postings p
            JOIN accounts a ON p.account_id = a.id
            JOIN transactions t ON p.transaction_id = t.id
            WHERE t.metadata->>'artisan_id' = $1
        `, [id]);

        const reviewsRes = await client.query(`
            SELECT id, job_transaction_id, client_id, rating, review_text, created_at
            FROM artisan_reviews WHERE artisan_id = $1 ORDER BY created_at DESC LIMIT 10
        `, [id]);

        return {
            profile: profile,
            performance: statsRes.rows[0],
            guarantors: guarantorsRes.rows,
            pastJobs: pastJobsRes.rows,
            disputes: disputesRes.rows,
            financials: {
                total_earnings: earningsRes.rows[0]?.total_earnings || 0,
                total_withdrawals: earningsRes.rows[0]?.total_withdrawals || 0,
                net_balance: (earningsRes.rows[0]?.total_earnings || 0) - (earningsRes.rows[0]?.total_withdrawals || 0)
            },
            reviews: reviewsRes.rows
        };
    }

    async updateArtisanTier(client, adminId, artisanId, newTier) {
        const res = await client.query(
            `UPDATE artisan_profiles SET tier_level = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
            [newTier, artisanId]
        );
        if (res.rows.length === 0) throw new AppError("Artisan not found", 404);
        await this.logAdminAction(client, adminId, 'update_tier', 'artisan', artisanId, null, { tier: newTier }, 'system', 'admin_update');
        return res.rows[0];
    }

    async suspendArtisan(client, adminId, artisanId) {
        const res = await client.query(
            `UPDATE artisan_profiles SET is_identity_verified = FALSE, updated_at = NOW() WHERE id = $1 RETURNING *`,
            [artisanId]
        );
        if (res.rows.length === 0) throw new AppError("Artisan not found", 404);
        await this.logAdminAction(client, adminId, 'suspend_artisan', 'artisan', artisanId, { was_verified: res.rows[0].is_identity_verified }, { is_identity_verified: false }, 'system', 'suspension');
        return res.rows[0];
    }

    async liftArtisanSuspension(client, adminId, artisanId) {
        const res = await client.query(
            `UPDATE artisan_profiles SET is_identity_verified = TRUE, updated_at = NOW() WHERE id = $1 RETURNING *`,
            [artisanId]
        );
        if (res.rows.length === 0) throw new AppError("Artisan not found", 404);
        await this.logAdminAction(client, adminId, 'lift_suspension', 'artisan', artisanId, { was_verified: res.rows[0].is_identity_verified }, { is_identity_verified: true }, 'system', 'suspension_lifted');
        return res.rows[0];
    }

    async verifyArtisanGuarantor(client, adminId, artisanId, guarantorId) {
        await client.query('BEGIN');
        try {
            const guarantorRes = await client.query(
                `SELECT * FROM artisan_guarantors WHERE id = $1 AND artisan_id = $2`,
                [guarantorId, artisanId]
            );
            if (guarantorRes.rows.length === 0) {
                await client.query('ROLLBACK');
                throw new AppError("Guarantor not found for this artisan", 404);
            }

            const updateGuarantorRes = await client.query(
                `UPDATE artisan_guarantors SET is_verified = TRUE WHERE id = $1 RETURNING *`,
                [guarantorId]
            );

            const verifiedCountRes = await client.query(
                `SELECT COUNT(*) as verified_count FROM artisan_guarantors WHERE artisan_id = $1 AND is_verified = TRUE`,
                [artisanId]
            );
            
            const verifiedCount = parseInt(verifiedCountRes.rows[0].verified_count);

            if (verifiedCount === 1) {
                const artisanRes = await client.query(
                    `UPDATE artisan_profiles SET tier_level = 2, updated_at = NOW() WHERE id = $1 RETURNING *`,
                    [artisanId]
                );
                if (artisanRes.rows.length > 0) {
                    await this.logAdminAction(client, adminId, 'update_tier', 'artisan', artisanId,
                        { old_tier: artisanRes.rows[0].tier_level },
                        { new_tier: 2 }, 'system', 'guarantor_verification');
                }
            }

            await client.query('COMMIT');
            await this.logAdminAction(client, adminId, 'verify_guarantor', 'artisan_guarantor', guarantorId,
                { was_verified: false }, { is_verified: true }, 'system', 'verification');

            return {
                guarantor: updateGuarantorRes.rows[0],
                tier_updated: verifiedCount === 1
            };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
    }

    async getGeoStats(client) {
        const res = await client.query(`
            SELECT ROUND(location_lat::numeric, 2) as lat, ROUND(location_lon::numeric, 2) as lon, COUNT(*) as count, trade
            FROM artisan_profiles WHERE location_lat IS NOT NULL
            GROUP BY 1, 2, trade
        `);
        return res.rows;
    }

    // =========================================================================
    // SECTION C: MODULE 2 - CLIENT MANAGEMENT & RETENTION
    // =========================================================================

    async issueClientCredit(client, adminId, clientId, amountPesewas, reason) {
        const txRef = `CREDIT_${Date.now()}`;
        const txResult = await client.query(`
            INSERT INTO transactions (reference_id, description, metadata)
            VALUES ($1, $2, $3) RETURNING id
        `, [txRef, `Credit: ${reason}`, JSON.stringify({ client_id: clientId })]);
        const transactionId = txResult.rows[0].id;

        // Debit Marketing (Expense)
        await client.query(`
            INSERT INTO postings (transaction_id, account_id, amount_pesewas, direction, description)
            VALUES ($1, (SELECT id FROM accounts WHERE code = 'MARKETING_EXPENSE'), $2, 'DEBIT', $3)
        `, [transactionId, amountPesewas, `Credit to Client ${clientId}`]);

        // Credit Client Wallet (Liability)
        await client.query(`
            INSERT INTO postings (transaction_id, account_id, amount_pesewas, direction)
            VALUES ($1, (SELECT id FROM accounts WHERE name = 'Liability_Client_Wallet'), $2, 'CREDIT')
        `, [transactionId, amountPesewas]);

        await this.logAdminAction(client, adminId, 'issue_credit', 'client', clientId, null, { amount: amountPesewas }, 'system', 'finance');
        return { success: true, transaction_ref: txRef };
    }

    async getClientRetention(client) {
        const query = `
            WITH first_job AS (
                SELECT client_id, DATE_TRUNC('month', MIN(created_at)) as cohort_month
                FROM job_transactions WHERE current_state = 'PAYOUT_SUCCESS' GROUP BY client_id
            )
            SELECT to_char(fj.cohort_month, 'YYYY-MM') as cohort,
                   to_char(DATE_TRUNC('month', jt.created_at), 'YYYY-MM') as activity_month,
                   COUNT(DISTINCT jt.client_id) as active_clients
            FROM job_transactions jt
            JOIN first_job fj ON jt.client_id = fj.client_id
            WHERE jt.current_state = 'PAYOUT_SUCCESS'
            GROUP BY 1, 2 ORDER BY 1, 2
        `;
        const result = await client.query(query);
        return result.rows;
    }

    // =========================================================================
    // SECTION D: FINANCIAL LEDGER
    // =========================================================================

    async getGlobalLedgerBalance(client) {
        const result = await client.query(`
            SELECT
                SUM(CASE WHEN direction = 'DEBIT' THEN amount_pesewas ELSE -amount_pesewas END) as net_balance,
                SUM(amount_pesewas) as total_volume
            FROM postings
        `);
 
        const net = parseInt(result.rows[0].net_balance || 0);
 
        const breakdown = await client.query(`
            SELECT a.type as account_type,
                   SUM(CASE WHEN p.direction = 'DEBIT' THEN p.amount_pesewas ELSE -p.amount_pesewas END) as balance
            FROM postings p
            JOIN accounts a ON p.account_id = a.id
            GROUP BY a.type
        `);

        return {
            status: net === 0 ? 'HEALTHY' : 'CRITICAL_IMBALANCE',
            net_discrepancy: net, 
            volume: result.rows[0].total_volume,
            accounts: breakdown.rows
        };
    }

    async remitRiviaCo(client, adminId) {
        const balanceRes = await client.query(`
            SELECT SUM(CASE WHEN p.direction = 'DEBIT' THEN p.amount_pesewas ELSE -p.amount_pesewas END) as balance
            FROM postings p
            JOIN accounts a ON p.account_id = a.id
            WHERE a.name = 'Liability_Warranty_Escrow'
        `);
        const remitAmount = Math.abs(parseInt(balanceRes.rows[0].balance || 0));
        if (remitAmount < 100) throw new AppError("Balance too low to remit", 400);
 
        const txRef = `REMIT_${Date.now()}`;
        const txResult = await client.query(`
            INSERT INTO transactions (reference_id, description)
            VALUES ($1, $2) RETURNING id
        `, [txRef, 'Weekly Remittance to RiviaCo']);
        const transactionId = txResult.rows[0].id;
 
        await client.query(`
            INSERT INTO postings (transaction_id, account_id, amount_pesewas, direction)
            VALUES ($1, (SELECT id FROM accounts WHERE name = 'Liability_Warranty_Escrow'), $2, 'DEBIT')
        `, [transactionId, remitAmount]);
 
        await client.query(`
            INSERT INTO postings (transaction_id, account_id, amount_pesewas, direction)
            VALUES ($1, (SELECT id FROM accounts WHERE name = 'Asset_Platform_Cash'), $2, 'CREDIT')
        `, [transactionId, remitAmount]);

        await this.logAdminAction(client, adminId, 'remit_riviaco', 'finance', null, null, { amount: remitAmount }, 'system', 'finance');
        return { remitted_amount: remitAmount, reference: txRef };
    }

    // =========================================================================
    // SECTION E: DISPUTE TRIBUNAL & WALLET REFUNDS
    // =========================================================================

    async getAllDisputes(client) {
        const res = await client.query(`
            SELECT 
                d.*, 
                jt.job_description, 
                jt.gross_fee_pesewas,
                COALESCE(cp.full_name, ap.full_name) as raised_by_name,
                COALESCE(cp.phone_primary, ap.phone_primary) as raised_by_phone,
                CASE 
                    WHEN d.raised_by_client_id IS NOT NULL THEN 'Client'
                    WHEN d.raised_by_artisan_id IS NOT NULL THEN 'Artisan'
                    ELSE 'Unknown'
                END as raised_by_type
            FROM disputes d
            JOIN job_transactions jt ON d.job_id = jt.id
            LEFT JOIN client_profiles cp ON d.raised_by_client_id = cp.id
            LEFT JOIN artisan_profiles ap ON d.raised_by_artisan_id = ap.id
            ORDER BY d.created_at DESC
        `);
        return res.rows;
    }

    async getDisputeDetails(client, disputeId) {
        const disputeRes = await client.query(`
            SELECT
                d.*,
                jt.job_description,
                jt.gross_fee_pesewas,
                jt.current_state as job_state,
                cp.full_name as client_name,
                cp.phone_primary as client_phone,
                ap.full_name as artisan_name,
                ap.phone_primary as artisan_phone,
                COALESCE(raiser_client.full_name, raiser_artisan.full_name) as raised_by_name,
                COALESCE(raiser_client.phone_primary, raiser_artisan.phone_primary) as raised_by_phone
            FROM disputes d
            JOIN job_transactions jt ON d.job_id = jt.id
            JOIN client_profiles cp ON jt.client_id = cp.id
            JOIN artisan_profiles ap ON jt.artisan_id = ap.id
            LEFT JOIN client_profiles raiser_client ON d.raised_by_client_id = raiser_client.id
            LEFT JOIN artisan_profiles raiser_artisan ON d.raised_by_artisan_id = raiser_artisan.id
            WHERE d.id = $1
        `, [disputeId]);

        if (disputeRes.rows.length === 0) throw new AppError('Dispute not found', 404);
        return disputeRes.rows[0];
    }

    async resolveDispute(client, adminId, disputeId, { decision, notes, partialAmount }) {
        try {
            await client.query('BEGIN');

            // 1. Get Dispute & Job Details
            const disputeRes = await client.query('SELECT * FROM disputes WHERE id = $1', [disputeId]);
            if (disputeRes.rows.length === 0) throw new AppError('Dispute not found', 404);
            const dispute = disputeRes.rows[0];
            const jobId = dispute.job_id;

            const jobRes = await client.query(`SELECT * FROM job_transactions WHERE id = $1`, [jobId]);
            if (jobRes.rows.length === 0) throw new AppError('Job not found', 404);
            const job = jobRes.rows[0];

            if (decision === 'REFUND_CLIENT') {
                // --- CASE A: REFUND TO CLIENT WALLET ---
                const txRef = `REFUND_WALLET_${jobId}`;
                
                // Idempotency Check
                const existingTx = await client.query('SELECT id FROM transactions WHERE reference_id = $1', [txRef]);

                if (existingTx.rows.length === 0) {
                    // Create Transaction Header
                    const txResult = await client.query(`
                        INSERT INTO transactions (reference_id, description, metadata) 
                        VALUES ($1, $2, $3) RETURNING id
                    `, [txRef, 'Dispute Refund to Wallet', JSON.stringify({ client_id: job.client_id })]);
                    const transactionId = txResult.rows[0].id;
                    
                    // Debit Escrow (Release liability)
                    await client.query(`
                        INSERT INTO postings (transaction_id, account_id, amount_pesewas, direction) 
                        VALUES ($1, (SELECT id FROM accounts WHERE name = 'Liability_MoMo_Escrow'), $2, 'DEBIT')
                    `, [transactionId, job.gross_fee_pesewas]);
                    
                    // Credit Client Wallet (Increase liability)
                    await client.query(`
                        INSERT INTO postings (transaction_id, account_id, amount_pesewas, direction) 
                        VALUES ($1, (SELECT id FROM accounts WHERE name = 'Liability_Client_Wallet'), $2, 'CREDIT')
                    `, [transactionId, job.gross_fee_pesewas]);
                }
                
                await client.query(`UPDATE job_transactions SET current_state = 'CANCELLED_REFUNDED' WHERE id = $1`, [jobId]);

            } else if (decision === 'PAY_ARTISAN') {
                // --- CASE B: PAY ARTISAN (DIRECT MOMO TRANSFER) ---
                
                // 1. Check if Payout Transaction already exists
                const txRef = `DISPUTE_PAYOUT_${jobId}`;
                const existingTx = await client.query('SELECT id FROM transactions WHERE reference_id = $1', [txRef]);

                if (existingTx.rows.length === 0) {
                    // 2. Get Artisan's Paystack Recipient Code
                    const artisanRes = await client.query(`SELECT paystack_recipient_code FROM artisan_profiles WHERE id = $1`, [job.artisan_id]);
                    if (artisanRes.rows.length === 0 || !artisanRes.rows[0].paystack_recipient_code) {
                        throw new AppError("Artisan does not have a registered Paystack recipient code.", 400);
                    }
                    const recipientCode = artisanRes.rows[0].paystack_recipient_code;

                    // 3. Initiate Transfer via Paystack (Real Money Move)
                    // Note: PaystackService must be imported at the top
                    const transfer = await PaystackService.initializeTransfer(
                        txRef, // Use unique ref
                        recipientCode,
                        job.artisan_payout_pesewas,
                        `Dispute Resolved: Job #${jobId.substring(0,8)}`
                    );

                    if (!transfer.status) {
                        throw new AppError("Paystack Transfer Failed: " + transfer.message, 502);
                    }

                    // 4. Create Transaction Record
                    const txResult = await client.query(`
                        INSERT INTO transactions (reference_id, description, metadata) 
                        VALUES ($1, $2, $3) RETURNING id
                    `, [txRef, 'Dispute Resolution Payout', JSON.stringify({ 
                        artisan_id: job.artisan_id, 
                        transfer_code: transfer.transfer_code 
                    })]);
                    const transactionId = txResult.rows[0].id;

                    // 5. Ledger Postings
                    // A. Debit Escrow (Release Full Gross Amount held)
                    await client.query(`
                        INSERT INTO postings (transaction_id, account_id, amount_pesewas, direction) 
                        VALUES ($1, (SELECT id FROM accounts WHERE name = 'Liability_MoMo_Escrow'), $2, 'DEBIT')
                    `, [transactionId, job.gross_fee_pesewas]);

                    // B. Credit Payout (Money leaving system -> Asset Credit)
                    await client.query(`
                        INSERT INTO postings (transaction_id, account_id, amount_pesewas, direction) 
                        VALUES ($1, (SELECT id FROM accounts WHERE name = 'Asset_Paystack_Holding'), $2, 'CREDIT')
                    `, [transactionId, job.artisan_payout_pesewas]);

                    // C. Credit Commission (Revenue)
                    if (job.platform_commission_pesewas > 0) {
                        await client.query(`
                            INSERT INTO postings (transaction_id, account_id, amount_pesewas, direction) 
                            VALUES ($1, (SELECT id FROM accounts WHERE name = 'Revenue_Commissions'), $2, 'CREDIT')
                        `, [transactionId, job.platform_commission_pesewas]);
                    }

                    // D. Credit Warranty Pool (Liability)
                    if (job.warranty_fee_pesewas > 0) {
                        await client.query(`
                            INSERT INTO postings (transaction_id, account_id, amount_pesewas, direction) 
                            VALUES ($1, (SELECT id FROM accounts WHERE name = 'Liability_Warranty_Escrow'), $2, 'CREDIT')
                        `, [transactionId, job.warranty_fee_pesewas]);
                    }
                }

                // 6. Update Job State
                await client.query(`UPDATE job_transactions SET current_state = 'PAYOUT_SUCCESS' WHERE id = $1`, [jobId]);
            }

            // 3. Close Dispute Ticket
            await client.query(
                `UPDATE disputes SET status = 'RESOLVED', resolution_notes = $1, updated_at = NOW() WHERE id = $2`, 
                [notes, disputeId]
            );

            await client.query('COMMIT');
            await this.logAdminAction(client, adminId, 'resolve_dispute', 'job', jobId, { old_status: job.current_state }, { decision }, 'system', 'dispute');
            
            return { success: true };

        } catch (error) {
            await client.query('ROLLBACK');
            if (error.code === '23505') throw new AppError("This dispute has already been processed.", 409);
            throw error;
        }
    }

    async addDisputeNotes(client, adminId, disputeId, notes) {
        const disputeRes = await client.query(
            `UPDATE disputes SET resolution_notes = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
            [notes, disputeId]
        );
        if (disputeRes.rows.length === 0) throw new AppError('Dispute not found', 404);
        await this.logAdminAction(client, adminId, 'add_notes', 'dispute', disputeId, { old_notes: null }, { new_notes: notes }, 'system', 'dispute_update');
        return disputeRes.rows[0];
    }

    async getDisputeHistory(client, disputeId) {
        const historyRes = await client.query(`
            SELECT aal.id, aal.action, aal.old_value, aal.new_value, aal.created_at, admin_user.full_name as admin_name
            FROM admin_audit_log aal
            JOIN admin_users admin_user ON aal.admin_id = admin_user.id
            WHERE aal.entity_type = 'dispute' AND aal.entity_id = $1
            ORDER BY aal.created_at DESC
        `, [disputeId]);
        return historyRes.rows;
    }

    // =========================================================================
    // SECTION Q: ROBUST ANALYTICS (Matched to Schema)
    // =========================================================================

    async getInvestorMetrics(client) {
        // 1. GMV & Revenue (All time)
        // Calculated only from jobs that reached PAYOUT_SUCCESS (Money actually moved)
        // Using job_transactions table with gross_fee_pesewas column
        const financialRes = await client.query(`
            SELECT
                COALESCE(SUM(gross_fee_pesewas), 0) as gmv,
                COALESCE(SUM(warranty_fee_pesewas), 0) + COALESCE(SUM(platform_commission_pesewas), 0) as est_revenue
            FROM job_transactions
            WHERE current_state = 'PAYOUT_SUCCESS'
        `);

        // 2. Active Jobs
        // Definition: Funds locked (ESCROW_HELD) OR Work started (STARTED)
        const activeJobsRes = await client.query(`
            SELECT COUNT(*) as count
            FROM job_transactions
            WHERE current_state IN ('ESCROW_HELD', 'STARTED', 'COMPLETED_PENDING', 'DISPUTED')
        `);

        // 3. Completed Jobs
        // Definition: Client signed off, artisan paid.
        const completedJobsRes = await client.query(`
            SELECT COUNT(*) as count
            FROM job_transactions
            WHERE current_state = 'PAYOUT_SUCCESS'
        `);

        // 4. Active Artisans (Last 30 Days)
        // Artisans who have handled a job that is currently active or finished recently
        const activeArtisansRes = await client.query(`
            SELECT COUNT(DISTINCT artisan_id) as count
            FROM job_transactions
            WHERE current_state IN ('ESCROW_HELD', 'STARTED', 'PAYOUT_SUCCESS')
            AND created_at >= NOW() - INTERVAL '30 days'
        `);
         
        // 5. Total Verified Artisans (Fallback metric if Active is low)
        const totalArtisansRes = await client.query(`
            SELECT COUNT(*) as count FROM artisan_profiles WHERE is_identity_verified = true
        `);

        return {
            gmv_pesewas: parseInt(financialRes.rows[0].gmv || 0),
            revenue_pesewas: parseInt(financialRes.rows[0].est_revenue || 0),
            active_jobs: parseInt(activeJobsRes.rows[0].count),
            completed_jobs: parseInt(completedJobsRes.rows[0].count),
            // Show Total Verified Artisans if Active count is 0 (Better for UI)
            active_artisans_30d: parseInt(activeArtisansRes.rows[0].count) || parseInt(totalArtisansRes.rows[0].count),
            total_artisans: parseInt(totalArtisansRes.rows[0].count)
        };
    }

    /**
     * Detailed Investor Metrics (Filtered)
     */
    async getInvestorMetricsWithComparison(client, filters = {}) {
        const timeRange = typeof filters === 'string' ? filters : filters.timeRange || 'month';
        const startDate = filters.startDate;
        const endDate = filters.endDate;
        
        let currentStart, currentEnd, previousStart, previousEnd;

        if (startDate && endDate) {
            currentStart = `'${startDate}'`;
            currentEnd = `'${endDate}'`;
            const start = new Date(startDate);
            const end = new Date(endDate);
            const duration = end - start;
            const prevEndObj = new Date(start); 
            const prevStartObj = new Date(prevEndObj.getTime() - duration);
            const fmt = (d) => d.toISOString().split('T')[0];
            previousEnd = `'${startDate}'`;
            previousStart = `'${fmt(prevStartObj)}'`;
        } else {
            if (timeRange === 'quarter') {
                currentEnd = 'NOW()';
                currentStart = `NOW() - INTERVAL '90 days'`;
                previousEnd = `NOW() - INTERVAL '90 days'`;
                previousStart = `NOW() - INTERVAL '180 days'`;
            } else if (timeRange === 'year') {
                currentEnd = 'NOW()';
                currentStart = `NOW() - INTERVAL '365 days'`;
                previousEnd = `NOW() - INTERVAL '365 days'`;
                previousStart = `NOW() - INTERVAL '730 days'`;
            } else {
                currentEnd = 'NOW()';
                currentStart = `NOW() - INTERVAL '30 days'`;
                previousEnd = `NOW() - INTERVAL '30 days'`;
                previousStart = `NOW() - INTERVAL '60 days'`;
            }
        }

        try {
            const [currentMetrics, previousMetrics, topCities, topCategories] = await Promise.all([
                this.getPeriodMetrics(client, currentStart, currentEnd),
                this.getPeriodMetrics(client, previousStart, previousEnd),
                this.getTopGrowingCities(client, currentStart, currentEnd),
                this.getTopGrowingCategories(client, currentStart, currentEnd)
            ]);

            const calcGrowth = (curr, prev) => {
                if (prev === 0) return curr > 0 ? 100 : 0;
                return ((curr - prev) / prev) * 100;
            };

            return {
                gmv: { current: currentMetrics.gmv, previous: previousMetrics.gmv, growthRate: calcGrowth(currentMetrics.gmv, previousMetrics.gmv) },
                revenue: { current: currentMetrics.revenue, previous: previousMetrics.revenue, growthRate: calcGrowth(currentMetrics.revenue, previousMetrics.revenue) },
                activeArtisans: { current: currentMetrics.activeArtisans, previous: previousMetrics.activeArtisans, growthRate: calcGrowth(currentMetrics.activeArtisans, previousMetrics.activeArtisans) },
                activeClients: { current: currentMetrics.activeClients, previous: previousMetrics.activeClients, growthRate: calcGrowth(currentMetrics.activeClients, previousMetrics.activeClients) },
                burnRate: { current: 0, previous: 0, growthRate: 0 }, 
                marketShareGrowth: 0,
                customerRetention: currentMetrics.customerRetention,
                platformEfficiency: currentMetrics.platformEfficiency,
                topGrowingCities: topCities,
                topGrowingCategories: topCategories,
                meta: { period: startDate && endDate ? 'custom' : (timeRange || 'month') }
            };
        } catch (error) {
            console.error("Investor Metrics Error:", error);
            throw new AppError("Failed to calculate investor metrics", 500);
        }
    }

    async getPeriodMetrics(client, startDate, endDate) {
        const gmvRes = await client.query(`
            SELECT SUM(gross_fee_pesewas) as val 
            FROM job_transactions 
            WHERE current_state = 'PAYOUT_SUCCESS' 
            AND created_at BETWEEN ${startDate} AND ${endDate}
        `);

        const revenueRes = await client.query(`
            SELECT SUM(COALESCE(warranty_fee_pesewas, 0) + COALESCE(platform_commission_pesewas, 0)) as val 
            FROM job_transactions 
            WHERE current_state = 'PAYOUT_SUCCESS' 
            AND created_at BETWEEN ${startDate} AND ${endDate}
        `);

        const activeArtisansRes = await client.query(`SELECT COUNT(DISTINCT artisan_id) as val FROM job_transactions WHERE current_state = 'PAYOUT_SUCCESS' AND created_at BETWEEN ${startDate} AND ${endDate}`);
        const activeClientsRes = await client.query(`SELECT COUNT(DISTINCT client_id) as val FROM job_transactions WHERE current_state = 'PAYOUT_SUCCESS' AND created_at BETWEEN ${startDate} AND ${endDate}`);
        
        const efficiencyRes = await client.query(`
            SELECT count(*) as total, count(case when current_state = 'PAYOUT_SUCCESS' then 1 end) as completed
            FROM job_transactions WHERE created_at BETWEEN ${startDate} AND ${endDate}
        `);
        const totalJobs = parseInt(efficiencyRes.rows[0].total || 0);
        const completed = parseInt(efficiencyRes.rows[0].completed || 0);

        return {
            gmv: parseInt(gmvRes.rows[0].val || 0),
            revenue: parseInt(revenueRes.rows[0].val || 0), 
            activeArtisans: parseInt(activeArtisansRes.rows[0].val || 0),
            activeClients: parseInt(activeClientsRes.rows[0].val || 0),
            burnRate: 0,
            marketShareGrowth: 0,
            customerRetention: 0,
            platformEfficiency: totalJobs > 0 ? parseFloat(((completed/totalJobs)*100).toFixed(1)) : 0
        };
    }

    async getTopGrowingCities(client, currentStart, currentEnd) {
        const result = await client.query(`
            SELECT 
                CASE 
                    WHEN location_lat BETWEEN 5.5 AND 5.9 AND location_lon BETWEEN -0.5 AND 0.1 THEN 'Accra'
                    WHEN location_lat BETWEEN 5.6 AND 5.8 AND location_lon BETWEEN -0.1 AND 0.1 THEN 'Tema'
                    WHEN location_lat BETWEEN 6.4 AND 7.0 AND location_lon BETWEEN -1.9 AND -1.3 THEN 'Kumasi'
                    WHEN location_lat BETWEEN 4.8 AND 5.1 AND location_lon BETWEEN -2.0 AND -1.5 THEN 'Takoradi'
                    WHEN location_lat BETWEEN 5.0 AND 5.3 AND location_lon BETWEEN -1.4 AND -1.1 THEN 'Cape Coast'
                    WHEN location_lat BETWEEN 5.9 AND 6.3 AND location_lon BETWEEN -0.4 AND -0.1 THEN 'Koforidua'
                    WHEN location_lat BETWEEN 6.3 AND 6.9 AND location_lon BETWEEN 0.2 AND 0.7 THEN 'Ho'
                    WHEN location_lat BETWEEN 9.1 AND 9.7 AND location_lon BETWEEN -1.0 AND -0.6 THEN 'Tamale'
                    WHEN location_lat BETWEEN 10.6 AND 11.0 AND location_lon BETWEEN -1.0 AND -0.7 THEN 'Bolgatanga'
                    WHEN location_lat BETWEEN 9.8 AND 10.3 AND location_lon BETWEEN -2.7 AND -2.3 THEN 'Wa'
                    WHEN location_lat BETWEEN 7.1 AND 7.5 AND location_lon BETWEEN -2.5 AND -2.1 THEN 'Sunyani'
                    WHEN location_lat BETWEEN 7.4 AND 7.8 AND location_lon BETWEEN -2.1 AND -1.8 THEN 'Techiman'
                    WHEN location_lat BETWEEN 6.6 AND 7.0 AND location_lon BETWEEN -2.7 AND -2.4 THEN 'Goaso'
                    WHEN location_lat BETWEEN 6.0 AND 6.4 AND location_lon BETWEEN -2.6 AND -2.3 THEN 'Sefwi Wiawso'
                    WHEN location_lat BETWEEN 7.4 AND 7.9 AND location_lon BETWEEN 0.1 AND 0.5 THEN 'Dambai'
                    WHEN location_lat BETWEEN 8.9 AND 9.3 AND location_lon BETWEEN -2.0 AND -1.6 THEN 'Damongo'
                    WHEN location_lat BETWEEN 10.3 AND 10.7 AND location_lon BETWEEN -0.5 AND -0.2 THEN 'Nalerigu'
                    ELSE 'Other Region'
                END as name,
                COUNT(*) as job_count
            FROM job_transactions
            WHERE current_state = 'PAYOUT_SUCCESS'
            AND location_lat IS NOT NULL
            AND created_at BETWEEN ${currentStart} AND ${currentEnd}
            GROUP BY 1
            ORDER BY 2 DESC
            LIMIT 5
        `);

        return result.rows.map(row => ({
            name: row.name,
            region: this.inferRegion(row.name),
            current_jobs: parseInt(row.job_count),
            growthRate: 0 
        }));
    }

    async getTopGrowingCategories(client, currentStart, currentEnd) {
        const result = await client.query(`
            SELECT 
                ap.primary_trade as name,
                COUNT(*) as job_count
            FROM job_transactions jt
            JOIN artisan_profiles ap ON jt.artisan_id = ap.id
            WHERE jt.current_state = 'PAYOUT_SUCCESS'
            AND jt.created_at BETWEEN ${currentStart} AND ${currentEnd}
            GROUP BY 1
            ORDER BY 2 DESC
            LIMIT 5
        `);

        return result.rows.map(row => ({
            name: row.name,
            jobCount: parseInt(row.job_count),
            growthRate: 0 
        }));
    }

    inferRegion(city) {
        if (!city) return 'Unknown';
        const c = city.toLowerCase();
        if (c.includes('accra') || c.includes('tema')) return 'Greater Accra';
        if (c.includes('kumasi')) return 'Ashanti';
        if (c.includes('tamale')) return 'Northern';
        if (c.includes('takoradi')) return 'Western';
        return 'Ghana';
    }

    // =========================================================================
    // SECTION G: PLATFORM OVERVIEW & DASHBOARD HELPERS
    // =========================================================================

    async getEscrowPoolHealth(client) {
        const escrowBalanceRes = await client.query(`
            SELECT SUM(CASE WHEN p.direction = 'DEBIT' THEN p.amount_pesewas ELSE -p.amount_pesewas END) as balance
            FROM postings p
            JOIN accounts a ON p.account_id = a.id
            WHERE a.name = 'Liability_MoMo_Escrow'
        `);

        const activeJobsRes = await client.query(`
            SELECT SUM(gross_fee_pesewas) as total_active_value
            FROM job_transactions
            WHERE current_state IN ('MATCHED_PENDING_PAYMENT', 'ESCROW_HELD', 'STARTED', 'COMPLETED_PENDING', 'DISPUTED')
        `);

        const activeJobsCountRes = await client.query(`
            SELECT COUNT(*) as active_jobs_count
            FROM job_transactions
            WHERE current_state IN ('MATCHED_PENDING_PAYMENT', 'ESCROW_HELD', 'STARTED', 'COMPLETED_PENDING', 'DISPUTED')
        `);

        const escrowBalance = Math.abs(parseInt(escrowBalanceRes.rows[0].balance || 0)); 
        const totalActiveValue = parseInt(activeJobsRes.rows[0].total_active_value || 0);
        const activeJobsCount = parseInt(activeJobsCountRes.rows[0].active_jobs_count || 0);

        const coverageRatio = totalActiveValue > 0 ? (escrowBalance / totalActiveValue) * 100 : 100;
        const healthStatus = coverageRatio >= 95 ? 'HEALTHY' : coverageRatio >= 80 ? 'WARNING' : 'CRITICAL';

        return {
            escrow_balance_pesewas: escrowBalance,
            total_active_jobs_value_pesewas: totalActiveValue,
            active_jobs_count: activeJobsCount,
            coverage_ratio_percent: coverageRatio.toFixed(2),
            health_status: healthStatus
        };
    }

    async getJobVolumeTrend(client) {
        const res = await client.query(`
            WITH months AS (
                SELECT generate_series(
                    DATE_TRUNC('month', NOW()) - INTERVAL '5 months',
                    DATE_TRUNC('month', NOW()),
                    '1 month'::interval
                ) as month
            )
            SELECT 
                TO_CHAR(m.month, 'Mon') as name, 
                COUNT(jt.id) as jobs
            FROM months m
            LEFT JOIN job_transactions jt 
                ON DATE_TRUNC('month', jt.created_at) = m.month 
                AND jt.current_state != 'DRAFT'
            GROUP BY m.month
            ORDER BY m.month ASC
        `);
        return res.rows;
    }

    async getPlatformTakeRate(client) {
        const res = await client.query(`
            SELECT
                COALESCE(SUM(gross_fee_pesewas), 0) as total_gmv,
                COALESCE(SUM(warranty_fee_pesewas), 0) + COALESCE(SUM(platform_commission_pesewas), 0) as total_revenue,
                COUNT(*) as tx_count
            FROM job_transactions
            WHERE current_state = 'PAYOUT_SUCCESS'
        `);

        const totalGMV = parseInt(res.rows[0].total_gmv);
        const totalRevenue = parseInt(res.rows[0].total_revenue);
        const txCount = parseInt(res.rows[0].tx_count);
        
        const currentTakeRate = totalGMV > 0 ? ((totalRevenue / totalGMV) * 100) : 0;

        return {
            current_take_rate_percent: currentTakeRate.toFixed(2),
            average_take_rate_percent: currentTakeRate.toFixed(2),
            net_revenue_pesewas: totalRevenue,
            total_revenue_pesewas: totalRevenue,
            total_gmv_pesewas: totalGMV,
            transaction_count: txCount,
            target_range: "15% - 23%" 
        };
    }

    // =========================================================================
    // SECTION H: ARTISAN STATISTICS (REAL DATA)
    // =========================================================================

    async getArtisanStatistics(client) {
        const [
            totalArtisansRes,
            activeWorkforceRes,
            totalGMVRes,
            signUpTrendRes,
            verificationFunnelRes,
            jobCompletionRateRes,
            disputeRateRes,
            averageRatingRes,
            artisansByCategoryRes,
            revenueByCategoryRes,
            totalPayoutsRes,
            pendingClearancesRes,
            topEarnersRes
        ] = await Promise.all([
            client.query(`SELECT COUNT(*) as total, COUNT(CASE WHEN is_identity_verified = TRUE THEN 1 END) as active, COUNT(CASE WHEN is_identity_verified = FALSE THEN 1 END) as pending FROM artisan_profiles`),
            client.query(`SELECT COUNT(DISTINCT artisan_id) as count FROM job_transactions WHERE current_state = 'PAYOUT_SUCCESS' AND created_at > NOW() - INTERVAL '30 days'`),
            client.query(`SELECT SUM(gross_fee_pesewas) as val FROM job_transactions WHERE current_state = 'PAYOUT_SUCCESS'`),
            client.query(`SELECT DATE_TRUNC('week', created_at) as week, COUNT(*) as count FROM artisan_profiles GROUP BY 1 ORDER BY 1`),
            client.query(`SELECT COUNT(*) as registered, COUNT(CASE WHEN profile_picture_url IS NOT NULL THEN 1 END) as documents_uploaded, COUNT(CASE WHEN is_identity_verified = TRUE THEN 1 END) as id_verified FROM artisan_profiles`),
            client.query(`SELECT SUM(CASE WHEN current_state = 'PAYOUT_SUCCESS' THEN 1 ELSE 0 END) as successful, COUNT(*) as total FROM job_transactions`),
            client.query(`SELECT COUNT(*) as disputed FROM disputes`),
            client.query(`SELECT AVG(rating) as val FROM artisan_reviews`),
            client.query(`SELECT primary_trade as category, COUNT(*) as count FROM artisan_profiles GROUP BY 1`),
            client.query(`SELECT ap.primary_trade as category, SUM(jt.gross_fee_pesewas) as revenue FROM artisan_profiles ap JOIN job_transactions jt ON ap.id = jt.artisan_id WHERE jt.current_state = 'PAYOUT_SUCCESS' GROUP BY 1`),
            client.query(`SELECT SUM(artisan_payout_pesewas) as val FROM job_transactions WHERE current_state = 'PAYOUT_SUCCESS'`),
            client.query(`SELECT SUM(gross_fee_pesewas) as val FROM job_transactions WHERE current_state = 'MATCHED_PENDING_PAYMENT'`),
            client.query(`SELECT ap.id, ap.full_name, SUM(jt.artisan_payout_pesewas) as earnings FROM artisan_profiles ap JOIN job_transactions jt ON ap.id = jt.artisan_id WHERE jt.current_state = 'PAYOUT_SUCCESS' GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 10`)
        ]);

        const toInt = (val) => parseInt(val || 0);
        const toFloat = (val) => parseFloat(val || 0);
        const gmv = toInt(totalGMVRes.rows[0].val);
        const payouts = toInt(totalPayoutsRes.rows[0].val);
        const successfulJobs = toInt(jobCompletionRateRes.rows[0].successful);
        const estimatedAvgCommission = successfulJobs > 0 ? (gmv - payouts) / successfulJobs : 0;

        return {
            kpis: {
                totalArtisans: { total: toInt(totalArtisansRes.rows[0].total), active: toInt(totalArtisansRes.rows[0].active), pending: toInt(totalArtisansRes.rows[0].pending) },
                activeWorkforce: toInt(activeWorkforceRes.rows[0].count),
                totalGMV: gmv,
                averageCommission: estimatedAvgCommission
            },
            acquisition: {
                signUpTrend: signUpTrendRes.rows,
                verificationFunnel: { registered: toInt(verificationFunnelRes.rows[0].registered), documentsUploaded: toInt(verificationFunnelRes.rows[0].documents_uploaded), idVerified: toInt(verificationFunnelRes.rows[0].id_verified) }
            },
            serviceQuality: {
                jobCompletionRate: { successful: successfulJobs, total: toInt(jobCompletionRateRes.rows[0].total) },
                disputeRate: { disputed: toInt(disputeRateRes.rows[0].disputed), total: toInt(jobCompletionRateRes.rows[0].total) },
                averageRating: toFloat(averageRatingRes.rows[0].val),
                responseTime: { avgSeconds: 0 }
            },
            categoryAnalysis: { artisansByCategory: artisansByCategoryRes.rows, revenueByCategory: revenueByCategoryRes.rows, geographicHeatmap: [] },
            financials: { totalPayouts: payouts, pendingClearances: toInt(pendingClearancesRes.rows[0].val), topEarners: topEarnersRes.rows }
        };
    }

    // =========================================================================
    // SECTION J: MODULE 9 - MARKETPLACE OPERATIONS (REAL DATA)
    // =========================================================================

    async getMarketplaceOperations(client) {
        const [fillRateRes, zeroQuoteJobsRes, bidToJobRatioRes] = await Promise.all([
            client.query(`SELECT (SELECT COUNT(*) FROM job_transactions WHERE current_state = 'PAYOUT_SUCCESS') * 100.0 / NULLIF((SELECT COUNT(*) FROM job_transactions), 0) as fill_rate`),
            client.query(`SELECT COUNT(*) as zero_quote_jobs FROM job_transactions jt LEFT JOIN job_quotes jq ON jt.id = jq.job_id WHERE jt.created_at < NOW() - INTERVAL '24 hours' AND jq.id IS NULL`),
            client.query(`SELECT COUNT(jq.id)::float / NULLIF(COUNT(DISTINCT jq.job_id), 0) as bid_to_job_ratio FROM job_quotes jq`)
        ]);

        const [funnelDataRes, avgTimeToHireRes] = await Promise.all([
            client.query(`SELECT COUNT(DISTINCT jt.id) as posted, COUNT(DISTINCT jq.job_id) as quoted, COUNT(DISTINCT CASE WHEN jt.current_state IN ('MATCHED_PENDING_PAYMENT', 'PAYOUT_SUCCESS') THEN jt.id END) as negotiated, COUNT(DISTINCT CASE WHEN jt.current_state IN ('STARTED', 'COMPLETED_PENDING', 'PAYOUT_SUCCESS') THEN jt.id END) as started, COUNT(DISTINCT CASE WHEN jt.current_state = 'PAYOUT_SUCCESS' THEN jt.id END) as completed FROM job_transactions jt LEFT JOIN job_quotes jq ON jt.id = jq.job_id`),
            client.query(`SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) / 3600 as avg_hours_to_hire FROM job_transactions WHERE current_state IN ('MATCHED_PENDING_PAYMENT', 'PAYOUT_SUCCESS')`)
        ]);

        const [demandByTradeRes, supplyGapsRes] = await Promise.all([
            client.query(`SELECT ap.primary_trade as trade, COUNT(DISTINCT jt.id) as job_count FROM job_transactions jt JOIN artisan_profiles ap ON jt.artisan_id = ap.id WHERE jt.current_state = 'PAYOUT_SUCCESS' GROUP BY 1 ORDER BY 2 DESC LIMIT 5`),
            client.query(`SELECT ap.primary_trade as trade, COUNT(DISTINCT jt.id) as job_count, COUNT(jq.id) as quote_count, COUNT(jq.id)::float / NULLIF(COUNT(DISTINCT jt.id), 0) as quote_rate FROM job_transactions jt JOIN artisan_profiles ap ON jt.artisan_id = ap.id LEFT JOIN job_quotes jq ON jt.id = jq.job_id GROUP BY 1 HAVING COUNT(DISTINCT jt.id) > 2 ORDER BY quote_rate ASC LIMIT 3`)
        ]);

        return {
            liquidityMetrics: {
                fillRate: parseFloat(fillRateRes.rows[0].fill_rate || 0),
                zeroQuoteJobs: parseInt(zeroQuoteJobsRes.rows[0].zero_quote_jobs || 0),
                bidToJobRatio: parseFloat(bidToJobRatioRes.rows[0].bid_to_job_ratio || 0)
            },
            gigMonitoring: {
                funnel: {
                    posted: parseInt(funnelDataRes.rows[0].posted || 0),
                    quoted: parseInt(funnelDataRes.rows[0].quoted || 0),
                    negotiated: parseInt(funnelDataRes.rows[0].negotiated || 0),
                    started: parseInt(funnelDataRes.rows[0].started || 0),
                    completed: parseInt(funnelDataRes.rows[0].completed || 0)
                },
                avgTimeToHire: parseFloat(avgTimeToHireRes.rows[0]?.avg_hours_to_hire || 0),
                avgTimeToQuote: 0 
            },
            categoryAnalysis: { demandByTrade: demandByTradeRes.rows, supplyGaps: supplyGapsRes.rows }
        };
    }

    // =========================================================================
    // SECTION I: CLIENT MANAGEMENT
    // =========================================================================

    async listClients(client, { page = 1, limit = 20, search }) {
        const offset = (page - 1) * limit;
        const params = [limit, offset];
        let query = `
            SELECT cp.id, cp.full_name, cp.phone_primary as phone, cp.email, cp.created_at, COUNT(jt.id) as jobs_posted, COALESCE(SUM(jt.gross_fee_pesewas), 0) as total_spent_pesewas
            FROM client_profiles cp LEFT JOIN job_transactions jt ON cp.id = jt.client_id AND jt.current_state IN ('PAYOUT_SUCCESS', 'MATCHED_PENDING_PAYMENT')
        `;
        let paramIdx = 3;
        if (search) { query += ` WHERE (cp.full_name ILIKE $${paramIdx} OR cp.phone_primary ILIKE $${paramIdx})`; params.push(`%${search}%`); }
        query += ` GROUP BY cp.id ORDER BY cp.created_at DESC LIMIT $1 OFFSET $2`;
        const [rows, countRes] = await Promise.all([client.query(query, params), client.query(`SELECT COUNT(*) FROM client_profiles`)]);
        return { clients: rows.rows, total: parseInt(countRes.rows[0].count), page: parseInt(page), pages: Math.ceil(parseInt(countRes.rows[0].count) / limit) };
    }

    async getClientDeepDive(client, id) {
        const profileRes = await client.query(`SELECT cp.*, COUNT(jt.id) as total_jobs, COALESCE(SUM(jt.gross_fee_pesewas), 0) as total_spent FROM client_profiles cp LEFT JOIN job_transactions jt ON cp.id = jt.client_id WHERE cp.id = $1 GROUP BY cp.id`, [id]);
        if (profileRes.rows.length === 0) throw new AppError("Client not found", 404);
        const recentJobsRes = await client.query(`SELECT id, job_description, gross_fee_pesewas, current_state, created_at FROM job_transactions WHERE client_id = $1 ORDER BY created_at DESC LIMIT 10`, [id]);
        return { profile: profileRes.rows[0], recentJobs: recentJobsRes.rows };
    }

    async getClientStatistics(client) {
        const [kpiRes, growthRes, topSpendersRes] = await Promise.all([
            client.query(`SELECT COUNT(*) as total_clients, (SELECT COUNT(DISTINCT client_id) FROM job_transactions WHERE created_at > NOW() - INTERVAL '30 days') as active_clients FROM client_profiles`),
            client.query(`SELECT DATE_TRUNC('week', created_at) as week, COUNT(*) as count FROM client_profiles GROUP BY 1 ORDER BY 1 DESC LIMIT 12`),
            client.query(`SELECT cp.id, cp.full_name, SUM(jt.gross_fee_pesewas) as total_spent FROM client_profiles cp JOIN job_transactions jt ON cp.id = jt.client_id WHERE jt.current_state = 'PAYOUT_SUCCESS' GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 10`)
        ]);
        return { kpis: { total: parseInt(kpiRes.rows[0].total_clients || 0), active: parseInt(kpiRes.rows[0].active_clients || 0) }, growth: growthRes.rows, topSpenders: topSpendersRes.rows };
    }

    async changePassword(client, adminId, oldPassword, newPassword) {
        const res = await client.query('SELECT password_hash FROM admin_users WHERE id = $1', [adminId]);
        if (res.rows.length === 0) throw new AppError('Admin not found', 404);
        
        const valid = await bcrypt.compare(oldPassword, res.rows[0].password_hash);
        if (!valid) throw new AppError('Incorrect current password', 401);
        
        const newHash = await bcrypt.hash(newPassword, 10);
        await client.query('UPDATE admin_users SET password_hash = $1 WHERE id = $2', [newHash, adminId]);
        
        return true;
    }

    // =========================================================================
    // SECTION K: RIVIACO HEALTH INSURANCE MANAGEMENT
    // =========================================================================

    async getRiviaCoStats(client) {
        // 1. Counts
        const countsRes = await client.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN riviaco_plan = 'FREE' THEN 1 END) as free_plan,
                COUNT(CASE WHEN riviaco_plan = 'STANDARD' THEN 1 END) as standard_plan,
                COUNT(CASE WHEN riviaco_plan IS NULL THEN 1 END) as not_enrolled,
                SUM(riviaco_standard_plan_contribution_pesewas) as total_contributions
            FROM artisan_profiles
        `);

        // 2. List of Artisans with Rivia Status
        const listRes = await client.query(`
            SELECT 
                id, full_name, phone_primary, 
                riviaco_plan, 
                riviaco_enrollment_date,
                COALESCE(riviaco_standard_plan_contribution_pesewas, 0) as contribution,
                is_identity_verified
            FROM artisan_profiles
            ORDER BY 
                CASE WHEN riviaco_plan IS NULL THEN 0 ELSE 1 END, -- Show unenrolled first
                created_at DESC
            LIMIT 50
        `);

        return {
            stats: {
                total_artisans: parseInt(countsRes.rows[0].total),
                enrolled_free: parseInt(countsRes.rows[0].free_plan),
                enrolled_standard: parseInt(countsRes.rows[0].standard_plan),
                pending_enrollment: parseInt(countsRes.rows[0].not_enrolled),
                total_pot_pesewas: parseInt(countsRes.rows[0].total_contributions || 0),
                channel: "Zolid Marketplace Channel"
            },
            artisans: listRes.rows
        };
    }

    async enrollArtisanRiviaFree(client, adminId, artisanId) {
        const artisanRes = await client.query('SELECT * FROM artisan_profiles WHERE id = $1', [artisanId]);
        if (artisanRes.rows.length === 0) throw new AppError('Artisan not found', 404);
        const artisan = artisanRes.rows[0];

        // Call External Service
        const riviaMember = await require('./riviacoService').registerMember(artisan);

        // Update DB
        const updateRes = await client.query(`
            UPDATE artisan_profiles 
            SET riviaco_plan = 'FREE', 
                riviaco_member_id = $1,
                riviaco_enrollment_date = NOW(),
                updated_at = NOW()
            WHERE id = $2
            RETURNING *
        `, [riviaMember.id, artisanId]);

        await this.logAdminAction(client, adminId, 'enroll_rivia_free', 'artisan', artisanId, null, { plan: 'FREE' }, 'system', 'benefits');
        return updateRes.rows[0];
    }

    async upgradeArtisanRiviaStandard(client, adminId, artisanId) {
        const artisanRes = await client.query('SELECT * FROM artisan_profiles WHERE id = $1', [artisanId]);
        if (artisanRes.rows.length === 0) throw new AppError('Artisan not found', 404);
        const artisan = artisanRes.rows[0];

        // Generate or use existing card code
        const cardCode = artisan.rivia_card_code || `ZOLID-${artisan.id.substring(0,8).toUpperCase()}`;

        // Call External Service to Activate/Upgrade
        await require('./riviacoService').activateCard(cardCode, {
            firstName: artisan.full_name.split(' ')[0],
            lastName: artisan.full_name.split(' ').slice(1).join(' '),
            phone: artisan.phone_primary
        });

        // Update DB
        const updateRes = await client.query(`
            UPDATE artisan_profiles 
            SET riviaco_plan = 'STANDARD', 
                rivia_card_code = $1,
                updated_at = NOW()
            WHERE id = $2
            RETURNING *
        `, [cardCode, artisanId]);

        // Remittance logic is handled by batch scheduler normally, but we log the manual upgrade here
        await this.logAdminAction(client, adminId, 'upgrade_rivia_standard', 'artisan', artisanId, { old_plan: artisan.riviaco_plan }, { plan: 'STANDARD' }, 'system', 'benefits');
        return updateRes.rows[0];
    }

    // =========================================================================
    // SECTION L: ADVANCED ANALYTICS (CREDIT RISK & DATA PRODUCTS)
    // =========================================================================

    async getCreditRiskMetrics(client) {
        // 1. Default Probability Index (DPI)
        const riskQuery = `
            WITH artisan_stats AS (
                SELECT 
                    ap.id, 
                    ap.full_name,
                    ap.tier_level,
                    COUNT(jt.id) as total_jobs,
                    COUNT(CASE WHEN jt.current_state IN ('DISPUTED', 'CANCELLED_REFUNDED') THEN 1 END) as failed_jobs,
                    AVG(ap.reputation_score) as trust_score
                FROM artisan_profiles ap
                LEFT JOIN job_transactions jt ON ap.id = jt.artisan_id
                GROUP BY ap.id
            )
            SELECT 
                id, full_name, tier_level,
                CASE 
                    WHEN total_jobs = 0 THEN 0 
                    ELSE Round((failed_jobs::numeric / total_jobs::numeric) * 100, 2) 
                END as dpi_score,
                Round(trust_score::numeric, 2) as reputation,
                total_jobs
            FROM artisan_stats
            ORDER BY dpi_score DESC
            LIMIT 100;
        `;

        // 2. Income Predictability Score (IPS)
        const incomeQuery = `
            WITH monthly_income AS (
                SELECT 
                    artisan_id,
                    DATE_TRUNC('month', created_at) as month,
                    SUM(artisan_payout_pesewas) as income
                FROM job_transactions 
                WHERE current_state = 'PAYOUT_SUCCESS'
                GROUP BY artisan_id, month
            ),
            stats AS (
                SELECT 
                    artisan_id,
                    STDDEV(income) as income_stddev,
                    AVG(income) as income_avg
                FROM monthly_income
                GROUP BY artisan_id
            )
            SELECT 
                ap.full_name,
                s.income_avg,
                CASE 
                    WHEN s.income_avg = 0 THEN 0
                    WHEN s.income_stddev IS NULL THEN 100 
                    ELSE GREATEST(0, 100 - (s.income_stddev / s.income_avg * 100)) 
                END as ips_score
            FROM stats s
            JOIN artisan_profiles ap ON s.artisan_id = ap.id
            ORDER BY ips_score DESC
            LIMIT 50;
        `;

        // 3. Shock Absorption Capacity (SAC)
        const sacQuery = `
            WITH artisan_balances AS (
                SELECT 
                    t.metadata->>'artisan_id' as artisan_id,
                    SUM(CASE WHEN p.direction = 'CREDIT' THEN p.amount_pesewas ELSE -p.amount_pesewas END) as balance_pesewas
                FROM postings p
                JOIN accounts a ON p.account_id = a.id
                JOIN transactions t ON p.transaction_id = t.id
                WHERE a.name = 'Liability_Artisan_Wallet'
                AND t.metadata->>'artisan_id' IS NOT NULL
                GROUP BY t.metadata->>'artisan_id'
            ),
            job_avgs AS (
                SELECT artisan_id, AVG(gross_fee_pesewas) as avg_job_val 
                FROM job_transactions 
                GROUP BY artisan_id
            )
            SELECT 
                ap.full_name,
                COALESCE(ab.balance_pesewas, 0) as balance_pesewas,
                ja.avg_job_val,
                CASE 
                    WHEN ja.avg_job_val > 0 THEN Round((COALESCE(ab.balance_pesewas, 0) / ja.avg_job_val)::numeric, 1)
                    ELSE 0 
                END as sac_ratio
            FROM artisan_profiles ap
            LEFT JOIN artisan_balances ab ON ap.id::text = ab.artisan_id
            JOIN job_avgs ja ON ap.id = ja.artisan_id
            ORDER BY sac_ratio DESC
            LIMIT 50;
        `;

        const [riskRes, incomeRes, sacRes] = await Promise.all([
            client.query(riskQuery),
            client.query(incomeQuery),
            client.query(sacQuery)
        ]);

        return {
            default_probability: riskRes.rows,
            income_predictability: incomeRes.rows,
            shock_absorption: sacRes.rows
        };
    }

    async getDataProducts(client) {
        // 1. ZOLID Trust Index (ZTI) Distribution
        const ztiQuery = `
            WITH metrics AS (
                SELECT 
                    ap.id,
                    ap.reputation_score,
                    COUNT(jt.id) as total,
                    COUNT(CASE WHEN jt.current_state = 'PAYOUT_SUCCESS' THEN 1 END) as success
                FROM artisan_profiles ap
                LEFT JOIN job_transactions jt ON ap.id = jt.artisan_id
                GROUP BY ap.id
            )
            SELECT 
                id,
                (
                    (COALESCE(reputation_score, 0) * 20) * 0.4 + 
                    (CASE WHEN total > 0 THEN (success::float/total::float)*100 ELSE 0 END) * 0.4 + 
                    (LEAST(total, 50)::float / 50 * 100) * 0.2
                ) as zti_score
            FROM metrics
        `;

        // 2. Labor Risk Feed
        const riskFeedQuery = `
            SELECT 
                ap.primary_trade,
                COUNT(*) as total_jobs,
                COUNT(CASE WHEN jt.current_state = 'DISPUTED' THEN 1 END) as disputes,
                Round((COUNT(CASE WHEN jt.current_state = 'DISPUTED' THEN 1 END)::numeric / NULLIF(COUNT(*),0)::numeric * 100), 2) as risk_rate
            FROM job_transactions jt
            JOIN artisan_profiles ap ON jt.artisan_id = ap.id
            GROUP BY ap.primary_trade
            HAVING COUNT(*) > 5
            ORDER BY risk_rate DESC;
        `;

        // 3. Informal Labor Intelligence
        const marketIntelQuery = `
            SELECT 
                CASE 
                    WHEN ap.home_lat BETWEEN 5.5 AND 5.7 THEN 'Greater Accra'
                    WHEN ap.home_lat BETWEEN 6.6 AND 6.8 THEN 'Ashanti'
                    ELSE 'Other Regions'
                END as region,
                ap.primary_trade,
                COUNT(DISTINCT ap.id) as artisan_supply,
                COUNT(DISTINCT jt.id) as job_demand,
                ROUND(AVG(jt.gross_fee_pesewas)/100, 2) as avg_job_value_ghs
            FROM artisan_profiles ap
            LEFT JOIN job_transactions jt ON ap.id = jt.artisan_id
            WHERE ap.home_lat IS NOT NULL
            GROUP BY 1, 2
            ORDER BY job_demand DESC;
        `;

        const [ztiRes, riskFeedRes, intelRes] = await Promise.all([
            client.query(ztiQuery),
            client.query(riskFeedQuery),
            client.query(marketIntelQuery)
        ]);

        const ztiScores = ztiRes.rows.map(r => r.zti_score);
        const ztiDistribution = {
            'Elite (80-100)': ztiScores.filter(s => s >= 80).length,
            'High (60-79)': ztiScores.filter(s => s >= 60 && s < 80).length,
            'Moderate (40-59)': ztiScores.filter(s => s >= 40 && s < 60).length,
            'Low (0-39)': ztiScores.filter(s => s < 40).length
        };

        return {
            zti_distribution: ztiDistribution,
            labor_risk_feed: riskFeedRes.rows,
            market_intelligence: intelRes.rows
        };
    }

    // =========================================================================
    // SECTION M: WITHDRAWAL MANAGEMENT
    // =========================================================================

    async getWithdrawalRequests(client, status = 'PENDING') {
        const sql = `
            SELECT 
                wr.*,
                CASE 
                    WHEN wr.user_role = 'CLIENT' THEN cp.full_name 
                    WHEN wr.user_role = 'ARTISAN' THEN ap.full_name 
                END as user_name,
                CASE 
                    WHEN wr.user_role = 'CLIENT' THEN cp.phone_primary 
                    WHEN wr.user_role = 'ARTISAN' THEN ap.phone_primary 
                END as user_phone
            FROM withdrawal_requests wr
            LEFT JOIN client_profiles cp ON wr.user_id = cp.id AND wr.user_role = 'CLIENT'
            LEFT JOIN artisan_profiles ap ON wr.user_id = ap.id AND wr.user_role = 'ARTISAN'
            WHERE wr.status = $1
            ORDER BY wr.created_at ASC
        `;
        const res = await client.query(sql, [status]);
        return res.rows;
    }

    async approveWithdrawal(client, adminId, requestId) {
        try {
            await client.query('BEGIN');

            // 1. Get Request Details
            const res = await client.query('SELECT * FROM withdrawal_requests WHERE id = $1 FOR UPDATE', [requestId]);
            if (res.rows.length === 0) throw new AppError("Request not found", 404);
            const request = res.rows[0];

            if (request.status !== 'PENDING') throw new AppError("Request is not pending", 400);
            if (!request.paystack_recipient_code) throw new AppError("Missing Paystack Recipient Code", 400);

            // 2. Initiate Paystack Transfer (Real Money Movement)
            // Note: In Dev mode without keys, PaystackService mocks this success
            const transfer = await PaystackService.initializeTransfer(
                `PAYOUT_${requestId}`,
                request.paystack_recipient_code,
                request.amount_pesewas,
                `Withdrawal: ${request.user_role} ${request.user_id.substring(0,8)}`
            );

            if (!transfer.status) throw new AppError("Paystack Transfer Failed: " + transfer.message, 502);

            // 3. Create Transaction Header
            const txRef = `PAYOUT_CONFIRM_${requestId}`;
            const txRes = await client.query(`
                INSERT INTO transactions (reference_id, description, metadata) 
                VALUES ($1, $2, $3) RETURNING id
            `, [txRef, 'Withdrawal Approval & Payout', JSON.stringify({ request_id: requestId, transfer_code: transfer.transfer_code })]);
            const txId = txRes.rows[0].id;

            // 4. Update Ledger: Release Liability -> Reduce Asset (Money Leaving)
            // Debit Liability_Pending_Withdrawals (Decrease Liability)
            await client.query(`
                INSERT INTO postings (transaction_id, account_id, amount_pesewas, direction) 
                VALUES ($1, (SELECT id FROM accounts WHERE name = 'Liability_Pending_Withdrawals'), $2, 'DEBIT')
            `, [txId, request.amount_pesewas]);

            // Credit Asset_Paystack_Holding (Decrease Asset - Money sent out)
            await client.query(`
                INSERT INTO postings (transaction_id, account_id, amount_pesewas, direction) 
                VALUES ($1, (SELECT id FROM accounts WHERE name = 'Asset_Paystack_Holding'), $2, 'CREDIT')
            `, [txId, request.amount_pesewas]);

            // 5. Update Request Status
            await client.query(`
                UPDATE withdrawal_requests 
                SET status = 'APPROVED', updated_at = NOW() 
                WHERE id = $1
            `, [requestId]);

            await client.query('COMMIT');
            return { success: true, transfer_code: transfer.transfer_code };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
    }

    async rejectWithdrawal(client, adminId, requestId, reason) {
        try {
            await client.query('BEGIN');

            const res = await client.query('SELECT * FROM withdrawal_requests WHERE id = $1 FOR UPDATE', [requestId]);
            if (res.rows.length === 0) throw new AppError("Request not found", 404);
            const request = res.rows[0];

            if (request.status !== 'PENDING') throw new AppError("Request is not pending", 400);

            // 1. Create Transaction Header (Refund)
            const txRef = `PAYOUT_REJECT_${requestId}`;
            const txRes = await client.query(`
                INSERT INTO transactions (reference_id, description, metadata) 
                VALUES ($1, $2, $3) RETURNING id
            `, [txRef, `Withdrawal Rejected: ${reason}`, JSON.stringify({ request_id: requestId })]);
            const txId = txRes.rows[0].id;

            // 2. Update Ledger: Return funds to Client Wallet
            // Debit Liability_Pending_Withdrawals (Decrease Liability)
            await client.query(`
                INSERT INTO postings (transaction_id, account_id, amount_pesewas, direction) 
                VALUES ($1, (SELECT id FROM accounts WHERE name = 'Liability_Pending_Withdrawals'), $2, 'DEBIT')
            `, [txId, request.amount_pesewas]);

            // Credit Liability_Client_Wallet (Increase Liability/User Balance)
            await client.query(`
                INSERT INTO postings (transaction_id, account_id, amount_pesewas, direction) 
                VALUES ($1, (SELECT id FROM accounts WHERE name = 'Liability_Client_Wallet'), $2, 'CREDIT')
            `, [txId, request.amount_pesewas]);

            // 3. Update Request Status
            await client.query(`
                UPDATE withdrawal_requests 
                SET status = 'REJECTED', updated_at = NOW() 
                WHERE id = $1
            `, [requestId]);

            await client.query('COMMIT');
            return { success: true };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
    }

    // =========================================================================
    // SECTION O: MANUAL ONBOARDING (Single - Full Profile)
    // =========================================================================

    async createArtisanManually(client, adminId, data) {
        const { 
            full_name, phone_primary, primary_trade, 
            home_gps_address, gh_card_number, tier_level,
            email, dob, gender, momo_network, primary_language,
            profile_picture_url, gh_card_image_url,
            paystack_resolved_name,
            password // <--- Accept custom password
        } = data;

        // 1. Basic Validation
        if (!full_name || !phone_primary || !primary_trade || !momo_network) {
            throw new AppError("Name, Phone, Trade, and MoMo Network are required.", 400);
        }

        // 2. Check Duplicate
        const check = await client.query("SELECT id FROM artisan_profiles WHERE phone_primary = $1", [phone_primary]);
        if (check.rows.length > 0) {
            throw new AppError("Phone number already registered.", 409);
        }

        // 3. Handle Password (Custom or Default)
        let finalPassword = password;
        if (!finalPassword) {
            finalPassword = "ZolidUser123!"; // Fallback if none provided
        }
        const passwordHash = await identityService.hashPassword(finalPassword);

        // 4. Insert Full Profile
        const isMomoVerified = !!paystack_resolved_name;

        const sql = `
            INSERT INTO artisan_profiles (
                full_name, phone_primary, primary_trade, 
                home_gps_address, gh_card_number, tier_level,
                email, dob, gender, momo_network, primary_language,
                profile_picture_url, gh_card_image_url,
                paystack_resolved_name,
                password_hash, is_identity_verified, is_momo_verified,
                created_at, updated_at
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 
                $12, $13, $14, $15, 
                true, $16, 
                NOW(), NOW()
            )
            RETURNING id, full_name, phone_primary
        `;

        const res = await client.query(sql, [
            full_name,
            phone_primary, 
            primary_trade,
            home_gps_address || null,
            gh_card_number || null,
            tier_level || 1,
            email || null,
            dob || null,
            gender || 'MALE',
            momo_network,
            primary_language || 'ENGLISH',
            profile_picture_url || null,
            gh_card_image_url || null,
            paystack_resolved_name || null,
            passwordHash,
            isMomoVerified
        ]);

        return {
            artisan: res.rows[0],
            // Return the password actually used so admin can share it
            temp_password: finalPassword 
        };
    }

    // =========================================================================
    // SECTION P: FINANCIAL METRICS (MRR, ARR, REVENUE)
    // =========================================================================

    async getRevenueMetrics(client) {
        // 1. Get ID of the Revenue Account
        const accountRes = await client.query("SELECT id FROM accounts WHERE name = 'Revenue_Service_Fees'");
        const revenueAccountId = accountRes.rows[0]?.id;

        if (!revenueAccountId) {
            return { pure_revenue: 0, mrr: 0, arr: 0 };
        }

        // 2. Calculate All-Time Pure Revenue (Total Service Fees Collected)
        const allTimeRes = await client.query(`
            SELECT SUM(amount_pesewas) as total 
            FROM postings 
            WHERE account_id = $1 AND direction = 'CREDIT'
        `, [revenueAccountId]);
        
        const pureRevenue = parseInt(allTimeRes.rows[0]?.total || 0);

        // 3. Calculate MRR (Revenue in last 30 days)
        // This is a simplified "Run Rate" MRR based on actual last 30 days performance
        const last30Res = await client.query(`
            SELECT SUM(p.amount_pesewas) as total 
            FROM postings p
            JOIN transactions t ON p.transaction_id = t.id
            WHERE p.account_id = $1 
            AND p.direction = 'CREDIT'
            AND t.created_at >= NOW() - INTERVAL '30 days'
        `, [revenueAccountId]);

        const mrr = parseInt(last30Res.rows[0]?.total || 0);

        // 4. Calculate ARR (MRR * 12)
        const arr = mrr * 12;

        return {
            pure_revenue: pureRevenue,
            mrr: mrr,
            arr: arr
        };
    }

}

module.exports = new AdminService();