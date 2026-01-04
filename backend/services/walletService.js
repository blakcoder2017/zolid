const db = require('../db/db');
const AppError = require('../utils/appError');
const PaystackService = require('./paystackService');

class WalletService {
    /**
     * Get Client Wallet Balance (Credits - Debits)
     */
    async getClientWalletBalance(client, clientId) {
        const res = await client.query(`
            SELECT 
                SUM(CASE WHEN p.direction = 'CREDIT' THEN p.amount_pesewas ELSE -p.amount_pesewas END) as balance
            FROM postings p
            JOIN accounts a ON p.account_id = a.id
            JOIN transactions t ON p.transaction_id = t.id
            WHERE a.name = 'Liability_Client_Wallet'
            AND t.metadata->>'client_id' = $1
        `, [clientId]);

        return parseInt(res.rows[0].balance || 0);
    }

    /**
     * Request Manual Withdrawal
     * Logic: 
     * 1. Verify/Create Paystack Recipient
     * 2. Start DB Transaction
     * 3. Debit Wallet & Credit Pending Liability
     * 4. Save Withdrawal Request with Recipient Code
     */
    async requestWithdrawal(client, userId, userRole, amountPesewas, paymentDetails) {
        const { momo_number, bank_code, account_name } = paymentDetails;

        // 1. Validation
        if (!momo_number || !bank_code || !account_name) {
            throw new AppError("MoMo number, bank code, and account name are required.", 400);
        }

        const balance = await this.getClientWalletBalance(client, userId);
        if (balance < amountPesewas) {
            throw new AppError('Insufficient wallet balance.', 400);
        }

        // 2. Create Paystack Recipient (External API Call)
        // We do this BEFORE the transaction to ensure the payment details are valid.
        let recipientCode;
        try {
            console.log(`[Wallet] Creating Paystack Recipient for ${userId}...`);
            const recipientData = await PaystackService.createTransferRecipient(
                account_name, 
                momo_number, 
                bank_code
            );
            recipientCode = recipientData.recipient_code;
            console.log(`[Wallet] Recipient Created: ${recipientCode}`);
        } catch (error) {
            console.error('[Wallet] Paystack Recipient Error:', error.message);
            throw new AppError(`Payment Verification Failed: ${error.message}`, 400);
        }

        // 3. Process Database Transaction
        try {
            await client.query('BEGIN');

            // A. Create Transaction Header
            const txRef = `WD_REQ_${Date.now()}`;
            const txRes = await client.query(`
                INSERT INTO transactions (reference_id, description, metadata)
                VALUES ($1, $2, $3) RETURNING id
            `, [
                txRef, 
                `Withdrawal Request by ${userRole}`, 
                JSON.stringify({ 
                    client_id: userId, 
                    type: 'MANUAL_WITHDRAWAL',
                    recipient_code: recipientCode,
                    account_name,
                    momo_number,
                    bank_code
                })
            ]);
            const txId = txRes.rows[0].id;

            // B. Ledger: Debit Client Wallet (Reduce Available Balance)
            await client.query(`
                INSERT INTO postings (transaction_id, account_id, amount_pesewas, direction)
                VALUES ($1, (SELECT id FROM accounts WHERE name = 'Liability_Client_Wallet'), $2, 'DEBIT')
            `, [txId, amountPesewas]);

            // C. Ledger: Credit Pending Withdrawals (Lock funds)
            await client.query(`
                INSERT INTO postings (transaction_id, account_id, amount_pesewas, direction)
                VALUES ($1, (SELECT id FROM accounts WHERE name = 'Liability_Pending_Withdrawals'), $2, 'CREDIT')
            `, [txId, amountPesewas]);

            // D. Save Withdrawal Request (With Recipient Details)
            const reqRes = await client.query(`
                INSERT INTO withdrawal_requests (
                    user_id, user_role, amount_pesewas, status, transaction_id,
                    paystack_recipient_code, resolved_account_name, momo_number, bank_code
                )
                VALUES ($1, $2, $3, 'PENDING', $4, $5, $6, $7, $8)
                RETURNING id, status, created_at
            `, [
                userId, 
                userRole, 
                amountPesewas, 
                txId, 
                recipientCode, 
                account_name, 
                momo_number, 
                bank_code
            ]);

            await client.query('COMMIT');

            return { 
                success: true, 
                message: "Withdrawal request submitted successfully.",
                data: reqRes.rows[0]
            };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('[Wallet] DB Transaction Error:', error.message);
            throw new AppError("Failed to save withdrawal request.", 500);
        }
    }

    /**
     * Get Withdrawal History
     */
    async getWithdrawalHistory(client, userId) {
        const res = await client.query(`
            SELECT * FROM withdrawal_requests 
            WHERE user_id = $1 
            ORDER BY created_at DESC
        `, [userId]);
        return res.rows;
    }
}

module.exports = new WalletService();