// const express = require('express');
// const { authMiddleware } = require('../middleware/auth'); // Added restrictTo
// const financeService = require('../services/financeService');
// const identityService = require('../services/identityService');
// const PaystackService = require('../services/paystackService');
// const walletService = require('../services/walletService'); // Added walletService

// const router = express.Router();
// const catchAsync = require('../utils/catchAsync');
// const AppError = require('../utils/appError');

// // --- CLIENT WALLET ROUTES (New) ---
// // Must come before generic routes if paths overlap, though here they are distinct.

// router.get('/wallet/balance', authMiddleware, catchAsync(async (req, res, next) => {
//     const balance = await walletService.getClientWalletBalance(req.dbClient, req.user.id);
//     res.status(200).json({ 
//         status: 'success', 
//         data: { balance } 
//     });
// }));

// router.post('/wallet/withdraw', authMiddleware, catchAsync(async (req, res, next) => {
//     const result = await walletService.requestWithdrawal(req.dbClient, req.user.id, req.body.amount);
//     res.status(200).json({ 
//         status: 'success', 
//         ...result 
//     });
// }));

// // --- GET USER BALANCES ---
// router.get('/balance', authMiddleware, catchAsync(async (req, res, next) => {
//     const userId = req.user.id;
//     const userRole = req.user.role;
//     const client = req.dbClient;

//     try {
//         if (userRole === 'artisan') {
//             const sql = `
//                 SELECT 
//                     a.name as account_name,
//                     a.balance_pesewas,
//                     a.type as account_type
//                 FROM accounts a
//                 WHERE a.name = 'Payable_Artisan_Net'
//             `;
            
//             const result = await client.query(sql);
            
//             const pendingSql = `
//                 SELECT 
//                     SUM(CASE WHEN current_state = 'COMPLETED_PENDING' THEN artisan_payout_pesewas ELSE 0 END) as pending_payouts,
//                     SUM(CASE WHEN current_state = 'PAYOUT_SUCCESS' THEN artisan_payout_pesewas ELSE 0 END) as total_earned
//                 FROM job_transactions 
//                 WHERE artisan_id = $1
//             `;
            
//             const pendingResult = await client.query(pendingSql, [userId]);
            
//             res.status(200).json({
//                 message: "Artisan balance information retrieved.",
//                 balances: {
//                     payable_account_balance: result.rows[0]?.balance_pesewas || 0,
//                     pending_job_payouts: parseInt(pendingResult.rows[0]?.pending_payouts) || 0,
//                     total_earned: parseInt(pendingResult.rows[0]?.total_earned) || 0
//                 }
//             });
            
//         } else if (userRole === 'client') {
//             const sql = `
//                 SELECT 
//                     COUNT(*) as total_jobs_posted,
//                     SUM(CASE WHEN current_state = 'ESCROW_HELD' THEN gross_fee_pesewas ELSE 0 END) as funds_in_escrow,
//                     SUM(CASE WHEN current_state = 'PAYOUT_SUCCESS' THEN gross_fee_pesewas ELSE 0 END) as total_spent,
//                     SUM(CASE WHEN current_state = 'DRAFT' THEN gross_fee_pesewas ELSE 0 END) as pending_payment
//                 FROM job_transactions 
//                 WHERE client_id = $1
//             `;
            
//             const result = await client.query(sql, [userId]);
            
//             res.status(200).json({
//                 message: "Client financial summary retrieved.",
//                 summary: {
//                     total_jobs_posted: parseInt(result.rows[0]?.total_jobs_posted) || 0,
//                     funds_in_escrow: parseInt(result.rows[0]?.funds_in_escrow) || 0,
//                     total_spent: parseInt(result.rows[0]?.total_spent) || 0,
//                     pending_payment: parseInt(result.rows[0]?.pending_payment) || 0
//                 }
//             });
//         }
        
//     } catch (e) {
//         console.error("Balance retrieval error:", e.message);
//         return next(e);
//     }
// }));

// // --- GET TRANSACTION HISTORY ---
// router.get('/transactions', authMiddleware, catchAsync(async (req, res, next) => {
//     const userId = req.user.id;
//     const userRole = req.user.role;
//     const client = req.dbClient;
//     const { limit = 50, offset = 0 } = req.query;

//     try {
//         let sql;
        
//         if (userRole === 'artisan') {
//             sql = `
//                 SELECT 
//                     t.id,
//                     t.reference_id,
//                     t.description,
//                     t.metadata,
//                     t.created_at,
//                     json_agg(
//                         json_build_object(
//                             'account_name', a.name,
//                             'amount_pesewas', p.amount_pesewas,
//                             'direction', p.direction
//                         )
//                     ) as postings
//                 FROM transactions t
//                 JOIN postings p ON t.id = p.transaction_id
//                 JOIN accounts a ON p.account_id = a.id
//                 WHERE t.metadata->>'job_id' IN (
//                     SELECT id FROM job_transactions WHERE artisan_id = $1
//                 )
//                 GROUP BY t.id, t.reference_id, t.description, t.metadata, t.created_at
//                 ORDER BY t.created_at DESC
//                 LIMIT $2 OFFSET $3
//             `;
//         } else if (userRole === 'client') {
//             sql = `
//                 SELECT 
//                     t.id,
//                     t.reference_id,
//                     t.description,
//                     t.metadata,
//                     t.created_at,
//                     json_agg(
//                         json_build_object(
//                             'account_name', a.name,
//                             'amount_pesewas', p.amount_pesewas,
//                             'direction', p.direction
//                         )
//                     ) as postings
//                 FROM transactions t
//                 JOIN postings p ON t.id = p.transaction_id
//                 JOIN accounts a ON p.account_id = a.id
//                 WHERE t.metadata->>'job_id' IN (
//                     SELECT id FROM job_transactions WHERE client_id = $1
//                 )
//                 GROUP BY t.id, t.reference_id, t.description, t.metadata, t.created_at
//                 ORDER BY t.created_at DESC
//                 LIMIT $2 OFFSET $3
//             `;
//         }
        
//         const result = await client.query(sql, [userId, limit, offset]);
        
//         res.status(200).json({
//             message: "Transaction history retrieved.",
//             transactions: result.rows,
//             pagination: {
//                 limit: parseInt(limit),
//                 offset: parseInt(offset),
//                 count: result.rows.length
//             }
//         });
        
//     } catch (e) {
//         console.error("Transaction history error:", e.message);
//         return next(e);
//     }
// }));

// // --- GET ARTISAN PAYOUT HISTORY ---
// router.get('/payout-history', authMiddleware, catchAsync(async (req, res, next) => {
//     if (req.user.role !== 'artisan') {
//         return next(new AppError("This endpoint is only available for artisans.", 403));
//     }
    
//     const artisanId = req.user.id;
//     const client = req.dbClient;
//     const { limit = 20, offset = 0 } = req.query;

//     try {
//         const sql = `
//             SELECT 
//                 jt.id as job_id,
//                 jt.artisan_payout_pesewas,
//                 jt.current_state,
//                 jt.updated_at as payout_date,
//                 cp.full_name as client_name,
//                 jt.location_gps_address
//             FROM job_transactions jt
//             JOIN client_profiles cp ON jt.client_id = cp.id
//             WHERE jt.artisan_id = $1 
//             AND jt.current_state = 'PAYOUT_SUCCESS'
//             ORDER BY jt.updated_at DESC
//             LIMIT $2 OFFSET $3
//         `;
        
//         const result = await client.query(sql, [artisanId, limit, offset]);
        
//         const totalSql = `
//             SELECT 
//                 COUNT(*) as total_payouts,
//                 SUM(artisan_payout_pesewas) as total_amount_pesewas
//             FROM job_transactions 
//             WHERE artisan_id = $1 AND current_state = 'PAYOUT_SUCCESS'
//         `;
        
//         const totalResult = await client.query(totalSql, [artisanId]);
        
//         res.status(200).json({
//             message: "Payout history retrieved.",
//             payouts: result.rows,
//             summary: {
//                 total_payouts: parseInt(totalResult.rows[0]?.total_payouts) || 0,
//                 total_amount_pesewas: parseInt(totalResult.rows[0]?.total_amount_pesewas) || 0
//             },
//             pagination: {
//                 limit: parseInt(limit),
//                 offset: parseInt(offset),
//                 count: result.rows.length
//             }
//         });
        
//     } catch (e) {
//         console.error("Payout history error:", e.message);
//         return next(e);
//     }
// }));

// // --- MANUAL PAYMENT VERIFICATION (Frontend Callback) ---
// router.get('/payment/verify/:reference', catchAsync(async (req, res, next) => {
//     const { reference } = req.params;
//     const client = req.dbClient;

//     if (!reference) {
//         return next(new AppError('No payment reference provided', 400));
//     }

//     try {
//         const checkSql = `
//             SELECT id, current_state 
//             FROM job_transactions 
//             WHERE paystack_reference_id = $1
//             AND current_state IN ('ESCROW_HELD', 'IN_PROGRESS', 'PAYOUT_SUCCESS')
//         `;
//         const checkResult = await client.query(checkSql, [reference]);

//         if (checkResult.rows.length > 0) {
//             return res.status(200).json({
//                 status: 'success',
//                 message: 'Payment already verified',
//                 data: { job_id: checkResult.rows[0].id }
//             });
//         }

//         const verifyData = await PaystackService.request('GET', `/transaction/verify/${reference}`);
        
//         if (verifyData.status !== 'success') {
//              return next(new AppError('Transaction was not successful on Paystack', 400));
//         }

//         const chargeData = {
//             reference: verifyData.reference,
//             amount: verifyData.amount, // in pesewas
//             metadata: verifyData.metadata
//         };

//         const jobProcessed = await handleChargeSuccess(client, chargeData);

//         if (!jobProcessed) {
//             return next(new AppError('Payment verified but no matching job found to update', 404));
//         }

//         res.status(200).json({
//             status: 'success',
//             message: 'Payment verified successfully',
//             data: { job_id: jobProcessed.id }
//         });

//     } catch (e) {
//         console.error("Manual verification error:", e.message);
//         return next(new AppError(e.message || 'Payment verification failed', 500));
//     }
// }));

// // --- PAYSTACK WEBHOOK RECONCILIATION ---
// router.post('/webhook/paystack', catchAsync(async (req, res, next) => {
//     const webhookData = req.body;
//     const client = req.dbClient;

//     try {
//         const event = webhookData.event;
//         const data = webhookData.data;

//         switch (event) {
//             case 'charge.success':
//                 await handleChargeSuccess(client, data);
//                 break;
//             case 'transfer.success':
//                 await handleTransferSuccess(client, data);
//                 break;
//             case 'transfer.failed':
//                 await handleTransferFailed(client, data);
//                 break;
//             default:
//                 console.log(`Unhandled webhook event: ${event}`);
//         }

//         res.status(200).json({ received: true });

//     } catch (e) {
//         console.error('Webhook processing error:', e.message);
//         res.status(200).json({ received: true, error: e.message });
//     }
// }));

// /**
//  * Shared Logic: Handles successful charge (payment collection).
//  */
// async function handleChargeSuccess(client, chargeData) {
//     const paystackReference = chargeData.reference;
    
//     let jobSql = `
//         SELECT id, current_state, gross_fee_pesewas, warranty_fee_pesewas, 
//                selected_quote_id, artisan_id, client_id
//         FROM job_transactions
//         WHERE paystack_reference_id = $1
//     `;
//     let params = [paystackReference];

//     if (chargeData.metadata && chargeData.metadata.job_id) {
//          jobSql = `
//             SELECT id, current_state, gross_fee_pesewas, warranty_fee_pesewas, 
//                    selected_quote_id, artisan_id, client_id
//             FROM job_transactions
//             WHERE id = $1
//          `;
//          params = [chargeData.metadata.job_id];
//     }
    
//     const jobResult = await client.query(jobSql, params);
    
//     if (jobResult.rows.length === 0) {
//         console.warn(`No job found for Paystack reference: ${paystackReference}`);
//         return null;
//     }

//     const job = jobResult.rows[0];

//     if (job.current_state === 'AWAITING_PAYMENT' || 
//         job.current_state === 'MATCHED_PENDING_PAYMENT' || 
//         job.current_state === 'ESCROW_PENDING' ||
//         job.current_state === 'MATCHED') {
            
//         const chargedAmount = parseInt(chargeData.amount, 10); 
//         const expectedAmount = parseInt(job.gross_fee_pesewas, 10) + parseInt(job.warranty_fee_pesewas, 10);
        
//         if (chargedAmount < expectedAmount) {
//             console.error(`Amount mismatch for job ${job.id}: Expected ${expectedAmount}, Got ${chargedAmount}`);
//             return null;
//         }

//         const newState = job.selected_quote_id ? 'IN_PROGRESS' : 'ESCROW_HELD';
        
//         await client.query(
//             `UPDATE job_transactions 
//              SET current_state = $1, 
//                  paystack_reference_id = $2, 
//                  updated_at = NOW()
//              WHERE id = $3`,
//             [newState, paystackReference, job.id]
//         );

//         const totalEscrowAmount = expectedAmount;
//         const txPostings = [
//             { account_name: "Asset_Paystack_Holding", amount_pesewas: totalEscrowAmount, direction: 'DEBIT' },
//             { account_name: "MoMo_Escrow_Liability", amount_pesewas: totalEscrowAmount, direction: 'CREDIT' }
//         ];

//         const txData = {
//             reference_id: `PAYSTACK_${paystackReference}`,
//             description: `Escrow deposit for Job ${job.id} (Payment secured)`,
//             metadata: { job_id: job.id, paystack_ref: paystackReference, event: 'charge.success' },
//             postings: txPostings
//         };

//         await financeService.postAtomicTransaction(client, txData);
//         console.log(`Job ${job.id} moved to ${newState} after payment confirmation.`);
        
//         return job;
//     } 
    
//     return job;
// }

// async function handleTransferSuccess(client, transferData) {
//     const transferReference = transferData.reference;
    
//     const txSql = `
//         SELECT id, reference_id, metadata
//         FROM transactions
//         WHERE reference_id = $1 OR metadata->>'paystack_transfer_ref' = $2;
//     `;
    
//     const txResult = await client.query(txSql, [transferReference, transferReference]);
    
//     if (txResult.rows.length === 0) {
//         console.warn(`No transaction found for transfer reference: ${transferReference}`);
//         return;
//     }

//     console.log(`Transfer ${transferReference} confirmed successful.`);
    
//     const metadata = txResult.rows[0].metadata;
//     if (metadata && metadata.job_id) {
//         await client.query(
//             `UPDATE job_transactions 
//              SET paystack_reference_id = COALESCE(paystack_reference_id, $1), updated_at = NOW()
//              WHERE id = $2 AND current_state = 'PAYOUT_SUCCESS'`,
//             [transferReference, metadata.job_id]
//         );
//     }
// }

// async function handleTransferFailed(client, transferData) {
//     const transferReference = transferData.reference;
//     const failureReason = transferData.failure_reason || 'Unknown reason';
//     console.error(`Transfer ${transferReference} failed: ${failureReason}`);
// }

// // --- DEV ONLY: PAYSTACK CALLBACK BRIDGE ---
// router.get('/callback-bridge', (req, res) => {
//     const { reference, trxref } = req.query;
//     const finalRef = reference || trxref;
//     const frontendUrl = `http://localhost:3002/paystack/verify-transaction?reference=${finalRef}`;
//     console.log(`🔀 Bridging Paystack callback to: ${frontendUrl}`);
//     res.redirect(frontendUrl);
// });

// // --- CLIENT WALLET ROUTES ---

// // 1. Get Balance
// router.get('/wallet/balance', authMiddleware, catchAsync(async (req, res, next) => {
//     // Note: restrictTo('client') is good practice here if exclusively for clients
//     const balance = await walletService.getClientWalletBalance(req.dbClient, req.user.id);
//     res.status(200).json({ status: 'success', data: { balance } });
// }));

// // 2. Request Withdrawal
// router.post('/wallet/withdraw', authMiddleware, catchAsync(async (req, res, next) => {
//     const result = await walletService.requestWithdrawal(
//         req.dbClient, 
//         req.user.id, 
//         'CLIENT', 
//         req.body.amount
//     );
//     res.status(200).json({ status: 'success', ...result });
// }));

// // 3. Get Withdrawal Requests History (NEW)
// router.get('/wallet/requests', authMiddleware, catchAsync(async (req, res, next) => {
//     const history = await walletService.getWithdrawalHistory(req.dbClient, req.user.id);
//     res.status(200).json({ status: 'success', data: history });
// }));

// module.exports = router;

const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const financeService = require('../services/financeService');
const PaystackService = require('../services/paystackService');
const walletService = require('../services/walletService'); // Ensure this is imported

const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// ==============================================================================
// CLIENT WALLET & WITHDRAWAL ROUTES
// ==============================================================================

// 1. Get Wallet Balance
router.get('/wallet/balance', authMiddleware, catchAsync(async (req, res, next) => {
    const balance = await walletService.getClientWalletBalance(req.dbClient, req.user.id);
    res.status(200).json({ 
        status: 'success', 
        data: { balance } 
    });
}));

// 2. Resolve MoMo Name (Frontend Helper)
router.post('/wallet/resolve-momo', authMiddleware, catchAsync(async (req, res, next) => {
    const { momo_number, bank_code } = req.body;

    if (!momo_number || !bank_code) {
        return next(new AppError("MoMo number and bank code are required.", 400));
    }

    try {
        const result = await PaystackService.resolveMoMoNumber(momo_number, bank_code);
        res.status(200).json({
            status: 'success',
            data: {
                account_name: result.resolved_account_name,
                account_number: result.resolved_account_number
            }
        });
    } catch (error) {
        return next(new AppError("Could not resolve account name.", 400));
    }
}));

// 3. Request Manual Withdrawal (UPDATED)
router.post('/wallet/withdraw', authMiddleware, catchAsync(async (req, res, next) => {
    const { amount, momo_number, bank_code, account_name } = req.body;

    const result = await walletService.requestWithdrawal(
        req.dbClient, 
        req.user.id, 
        'CLIENT', 
        amount, 
        { momo_number, bank_code, account_name } // Pass payment details object
    );

    res.status(200).json({ 
        status: 'success', 
        ...result 
    });
}));

// 4. Get Withdrawal History
router.get('/wallet/requests', authMiddleware, catchAsync(async (req, res, next) => {
    const history = await walletService.getWithdrawalHistory(req.dbClient, req.user.id);
    res.status(200).json({ 
        status: 'success', 
        data: history 
    });
}));

// ==============================================================================
// EXISTING FINANCE ROUTES
// ==============================================================================

// --- GET USER BALANCES ---
router.get('/balance', authMiddleware, catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    const client = req.dbClient;

    try {
        if (userRole === 'artisan') {
            const sql = `
                SELECT 
                    a.name as account_name,
                    a.balance_pesewas,
                    a.type as account_type
                FROM accounts a
                WHERE a.name = 'Payable_Artisan_Net'
            `;
            
            const result = await client.query(sql);
            
            const pendingSql = `
                SELECT 
                    SUM(CASE WHEN current_state = 'COMPLETED_PENDING' THEN artisan_payout_pesewas ELSE 0 END) as pending_payouts,
                    SUM(CASE WHEN current_state = 'PAYOUT_SUCCESS' THEN artisan_payout_pesewas ELSE 0 END) as total_earned
                FROM job_transactions 
                WHERE artisan_id = $1
            `;
            
            const pendingResult = await client.query(pendingSql, [userId]);
            
            res.status(200).json({
                message: "Artisan balance information retrieved.",
                balances: {
                    payable_account_balance: result.rows[0]?.balance_pesewas || 0,
                    pending_job_payouts: parseInt(pendingResult.rows[0]?.pending_payouts) || 0,
                    total_earned: parseInt(pendingResult.rows[0]?.total_earned) || 0
                }
            });
            
        } else if (userRole === 'client') {
            const sql = `
                SELECT 
                    COUNT(*) as total_jobs_posted,
                    SUM(CASE WHEN current_state = 'ESCROW_HELD' THEN gross_fee_pesewas ELSE 0 END) as funds_in_escrow,
                    SUM(CASE WHEN current_state = 'PAYOUT_SUCCESS' THEN gross_fee_pesewas ELSE 0 END) as total_spent,
                    SUM(CASE WHEN current_state = 'DRAFT' THEN gross_fee_pesewas ELSE 0 END) as pending_payment
                FROM job_transactions 
                WHERE client_id = $1
            `;
            
            const result = await client.query(sql, [userId]);
            
            res.status(200).json({
                message: "Client financial summary retrieved.",
                summary: {
                    total_jobs_posted: parseInt(result.rows[0]?.total_jobs_posted) || 0,
                    funds_in_escrow: parseInt(result.rows[0]?.funds_in_escrow) || 0,
                    total_spent: parseInt(result.rows[0]?.total_spent) || 0,
                    pending_payment: parseInt(result.rows[0]?.pending_payment) || 0
                }
            });
        }
        
    } catch (e) {
        console.error("Balance retrieval error:", e.message);
        return next(e);
    }
}));

// --- GET TRANSACTION HISTORY ---
router.get('/transactions', authMiddleware, catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    const client = req.dbClient;
    const { limit = 50, offset = 0 } = req.query;

    try {
        let sql;
        
        if (userRole === 'artisan') {
            sql = `
                SELECT 
                    t.id,
                    t.reference_id,
                    t.description,
                    t.metadata,
                    t.created_at,
                    json_agg(
                        json_build_object(
                            'account_name', a.name,
                            'amount_pesewas', p.amount_pesewas,
                            'direction', p.direction
                        )
                    ) as postings
                FROM transactions t
                JOIN postings p ON t.id = p.transaction_id
                JOIN accounts a ON p.account_id = a.id
                WHERE t.metadata->>'job_id' IN (
                    SELECT id FROM job_transactions WHERE artisan_id = $1
                )
                GROUP BY t.id, t.reference_id, t.description, t.metadata, t.created_at
                ORDER BY t.created_at DESC
                LIMIT $2 OFFSET $3
            `;
        } else if (userRole === 'client') {
            sql = `
                SELECT 
                    t.id,
                    t.reference_id,
                    t.description,
                    t.metadata,
                    t.created_at,
                    json_agg(
                        json_build_object(
                            'account_name', a.name,
                            'amount_pesewas', p.amount_pesewas,
                            'direction', p.direction
                        )
                    ) as postings
                FROM transactions t
                JOIN postings p ON t.id = p.transaction_id
                JOIN accounts a ON p.account_id = a.id
                WHERE t.metadata->>'job_id' IN (
                    SELECT id FROM job_transactions WHERE client_id = $1
                )
                GROUP BY t.id, t.reference_id, t.description, t.metadata, t.created_at
                ORDER BY t.created_at DESC
                LIMIT $2 OFFSET $3
            `;
        }
        
        const result = await client.query(sql, [userId, limit, offset]);
        
        res.status(200).json({
            message: "Transaction history retrieved.",
            transactions: result.rows,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                count: result.rows.length
            }
        });
        
    } catch (e) {
        console.error("Transaction history error:", e.message);
        return next(e);
    }
}));

// --- GET ARTISAN PAYOUT HISTORY ---
router.get('/payout-history', authMiddleware, catchAsync(async (req, res, next) => {
    if (req.user.role !== 'artisan') {
        return next(new AppError("This endpoint is only available for artisans.", 403));
    }
    
    const artisanId = req.user.id;
    const client = req.dbClient;
    const { limit = 20, offset = 0 } = req.query;

    try {
        const sql = `
            SELECT 
                jt.id as job_id,
                jt.artisan_payout_pesewas,
                jt.current_state,
                jt.updated_at as payout_date,
                cp.full_name as client_name,
                jt.location_gps_address
            FROM job_transactions jt
            JOIN client_profiles cp ON jt.client_id = cp.id
            WHERE jt.artisan_id = $1 
            AND jt.current_state = 'PAYOUT_SUCCESS'
            ORDER BY jt.updated_at DESC
            LIMIT $2 OFFSET $3
        `;
        
        const result = await client.query(sql, [artisanId, limit, offset]);
        
        const totalSql = `
            SELECT 
                COUNT(*) as total_payouts,
                SUM(artisan_payout_pesewas) as total_amount_pesewas
            FROM job_transactions 
            WHERE artisan_id = $1 AND current_state = 'PAYOUT_SUCCESS'
        `;
        
        const totalResult = await client.query(totalSql, [artisanId]);
        
        res.status(200).json({
            message: "Payout history retrieved.",
            payouts: result.rows,
            summary: {
                total_payouts: parseInt(totalResult.rows[0]?.total_payouts) || 0,
                total_amount_pesewas: parseInt(totalResult.rows[0]?.total_amount_pesewas) || 0
            },
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                count: result.rows.length
            }
        });
        
    } catch (e) {
        console.error("Payout history error:", e.message);
        return next(e);
    }
}));

// --- MANUAL PAYMENT VERIFICATION (Frontend Callback) ---
router.get('/payment/verify/:reference', catchAsync(async (req, res, next) => {
    const { reference } = req.params;
    const client = req.dbClient;

    if (!reference) {
        return next(new AppError('No payment reference provided', 400));
    }

    try {
        const checkSql = `
            SELECT id, current_state 
            FROM job_transactions 
            WHERE paystack_reference_id = $1
            AND current_state IN ('ESCROW_HELD', 'IN_PROGRESS', 'PAYOUT_SUCCESS')
        `;
        const checkResult = await client.query(checkSql, [reference]);

        if (checkResult.rows.length > 0) {
            return res.status(200).json({
                status: 'success',
                message: 'Payment already verified',
                data: { job_id: checkResult.rows[0].id }
            });
        }

        const verifyData = await PaystackService.request('GET', `/transaction/verify/${reference}`);
        
        if (verifyData.status !== 'success') {
             return next(new AppError('Transaction was not successful on Paystack', 400));
        }

        const chargeData = {
            reference: verifyData.reference,
            amount: verifyData.amount, // in pesewas
            metadata: verifyData.metadata
        };

        const jobProcessed = await handleChargeSuccess(client, chargeData);

        if (!jobProcessed) {
            return next(new AppError('Payment verified but no matching job found to update', 404));
        }

        res.status(200).json({
            status: 'success',
            message: 'Payment verified successfully',
            data: { job_id: jobProcessed.id }
        });

    } catch (e) {
        console.error("Manual verification error:", e.message);
        return next(new AppError(e.message || 'Payment verification failed', 500));
    }
}));

// --- PAYSTACK WEBHOOK RECONCILIATION ---
router.post('/webhook/paystack', catchAsync(async (req, res, next) => {
    const webhookData = req.body;
    const client = req.dbClient;

    try {
        const event = webhookData.event;
        const data = webhookData.data;

        switch (event) {
            case 'charge.success':
                await handleChargeSuccess(client, data);
                break;
            case 'transfer.success':
                await handleTransferSuccess(client, data);
                break;
            case 'transfer.failed':
                await handleTransferFailed(client, data);
                break;
            default:
                console.log(`Unhandled webhook event: ${event}`);
        }

        res.status(200).json({ received: true });

    } catch (e) {
        console.error('Webhook processing error:', e.message);
        res.status(200).json({ received: true, error: e.message });
    }
}));

/**
 * Shared Logic: Handles successful charge (payment collection).
 */
async function handleChargeSuccess(client, chargeData) {
    const paystackReference = chargeData.reference;
    
    let jobSql = `
        SELECT id, current_state, gross_fee_pesewas, warranty_fee_pesewas, 
               selected_quote_id, artisan_id, client_id
        FROM job_transactions
        WHERE paystack_reference_id = $1
    `;
    let params = [paystackReference];

    if (chargeData.metadata && chargeData.metadata.job_id) {
         jobSql = `
            SELECT id, current_state, gross_fee_pesewas, warranty_fee_pesewas, 
                   selected_quote_id, artisan_id, client_id
            FROM job_transactions
            WHERE id = $1
         `;
         params = [chargeData.metadata.job_id];
    }
    
    const jobResult = await client.query(jobSql, params);
    
    if (jobResult.rows.length === 0) {
        console.warn(`No job found for Paystack reference: ${paystackReference}`);
        return null;
    }

    const job = jobResult.rows[0];

    if (job.current_state === 'AWAITING_PAYMENT' || 
        job.current_state === 'MATCHED_PENDING_PAYMENT' || 
        job.current_state === 'ESCROW_PENDING' ||
        job.current_state === 'MATCHED') {
            
        const chargedAmount = parseInt(chargeData.amount, 10); 
        const expectedAmount = parseInt(job.gross_fee_pesewas, 10) + parseInt(job.warranty_fee_pesewas, 10);
        
        if (chargedAmount < expectedAmount) {
            console.error(`Amount mismatch for job ${job.id}: Expected ${expectedAmount}, Got ${chargedAmount}`);
            return null;
        }

        const newState = job.selected_quote_id ? 'IN_PROGRESS' : 'ESCROW_HELD';
        
        await client.query(
            `UPDATE job_transactions 
             SET current_state = $1, 
                 paystack_reference_id = $2, 
                 updated_at = NOW()
             WHERE id = $3`,
            [newState, paystackReference, job.id]
        );

        const totalEscrowAmount = expectedAmount;
        const txPostings = [
            { account_name: "Asset_Paystack_Holding", amount_pesewas: totalEscrowAmount, direction: 'DEBIT' },
            { account_name: "MoMo_Escrow_Liability", amount_pesewas: totalEscrowAmount, direction: 'CREDIT' }
        ];

        const txData = {
            reference_id: `PAYSTACK_${paystackReference}`,
            description: `Escrow deposit for Job ${job.id} (Payment secured)`,
            metadata: { job_id: job.id, paystack_ref: paystackReference, event: 'charge.success' },
            postings: txPostings
        };

        await financeService.postAtomicTransaction(client, txData);
        console.log(`Job ${job.id} moved to ${newState} after payment confirmation.`);
        
        return job;
    } 
    
    return job;
}

async function handleTransferSuccess(client, transferData) {
    const transferReference = transferData.reference;
    
    const txSql = `
        SELECT id, reference_id, metadata
        FROM transactions
        WHERE reference_id = $1 OR metadata->>'paystack_transfer_ref' = $2;
    `;
    
    const txResult = await client.query(txSql, [transferReference, transferReference]);
    
    if (txResult.rows.length === 0) {
        console.warn(`No transaction found for transfer reference: ${transferReference}`);
        return;
    }

    console.log(`Transfer ${transferReference} confirmed successful.`);
    
    const metadata = txResult.rows[0].metadata;
    if (metadata && metadata.job_id) {
        await client.query(
            `UPDATE job_transactions 
             SET paystack_reference_id = COALESCE(paystack_reference_id, $1), updated_at = NOW()
             WHERE id = $2 AND current_state = 'PAYOUT_SUCCESS'`,
            [transferReference, metadata.job_id]
        );
    }
}

async function handleTransferFailed(client, transferData) {
    const transferReference = transferData.reference;
    const failureReason = transferData.failure_reason || 'Unknown reason';
    console.error(`Transfer ${transferReference} failed: ${failureReason}`);
}

// --- DEV ONLY: PAYSTACK CALLBACK BRIDGE ---
router.get('/callback-bridge', (req, res) => {
    const { reference, trxref } = req.query;
    const finalRef = reference || trxref;
    const frontendUrl = `http://localhost:3002/paystack/verify-transaction?reference=${finalRef}`;
    console.log(`🔀 Bridging Paystack callback to: ${frontendUrl}`);
    res.redirect(frontendUrl);
});

module.exports = router;