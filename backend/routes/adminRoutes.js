// // backend/routes/adminRoutes.js
// const express = require('express');
// const router = express.Router();
// const AppError = require('../utils/appError');
// const DisputeService = require('../services/disputeService');
// const adminService = require('../services/adminService');
// const { adminAuth, checkPermission, superAdminOnly } = require('../middleware/adminMiddleware');
// // ============================================================================
// // AUTHENTICATION ROUTES (Public)
// // ============================================================================

// router.post('/login', async (req, res, next) => {
//     try {
//         const { email, password } = req.body;
//         if (!email || !password) throw new AppError('Email and password are required', 400);
        
//         // Pass IP and UserAgent for logging
//         const ip = req.ip || req.connection.remoteAddress;
//         const userAgent = req.headers['user-agent'];
        
//         const result = await adminService.login(req.dbClient, email, password, ip, userAgent);
        
//         res.status(200).json({
//             status: 'success',
//             message: 'Admin login successful',
//             ...result
//         });
//     } catch (error) { next(error); }
// });

// // ============================================================================
// // PROTECTED ROUTES (Require Admin Token)
// // ============================================================================
// router.use(adminAuth);

// // --- PROFILE MANAGEMENT ---

// router.get('/me', async (req, res, next) => {
//     try {
//         // We already have the admin in req.admin from middleware, 
//         // but fetching fresh data is safer
//         const admin = await adminService.getAdminById(req.dbClient, req.admin.id);
//         res.json({ status: 'success', admin });
//     } catch (error) { next(error); }
// });

// // --- DASHBOARD & ANALYTICS ---

// router.get('/dashboard', checkPermission('dashboard'), async (req, res, next) => {
//     try {
//         // Fetches GMV, Revenue, MRR, Active Jobs
//         const metrics = await adminService.getInvestorMetrics(req.dbClient);
//         const systemHealth = await adminService.getGlobalLedgerBalance(req.dbClient);
        
//         res.json({
//             status: 'success',
//             data: { metrics, systemHealth }
//         });
//     } catch (error) { next(error); }
// });

// // Platform Overview Metrics
// router.get('/platform-metrics', checkPermission('dashboard'), async (req, res, next) => {
//     try {
//         // Get the new platform metrics
//         const takeRate = await adminService.getPlatformTakeRate(req.dbClient);
//         const escrowHealth = await adminService.getEscrowPoolHealth(req.dbClient);
        
//         res.json({
//             status: 'success',
//             data: {
//                 takeRate,
//                 escrowHealth
//             }
//         });
//     } catch (error) { next(error); }
// });

// router.get('/analytics', checkPermission('analytics'), async (req, res, next) => {
//     try {
//         // Get comprehensive platform analytics
//         const financial = await adminService.getInvestorMetrics(req.dbClient);
//         const geoStats = await adminService.getGeoStats(req.dbClient);
//         const retention = await adminService.getClientRetention(req.dbClient);
        
//         res.json({
//             status: 'success',
//             analytics: { financial, geoStats, retention }
//         });
//     } catch (error) { next(error); }
// });


// router.get('/marketplace-operations', checkPermission('analytics'), async (req, res, next) => {
//     try {
//         const data = await adminService.getMarketplaceOperations(req.dbClient);
//         res.json({ status: 'success', data });
//     } catch (error) { 
//         // This log will show us the EXACT SQL error in your terminal if it fails
//         console.error("Marketplace Ops Error:", error); 
//         next(error); 
//     }
// });

// // Investor Metrics with time range comparison
// router.get('/investor-metrics', checkPermission('analytics'), async (req, res, next) => {
//     try {
//         // Extract filters from query parameters
//         const { timeRange, startDate, endDate } = req.query;
        
//         // Pass them all to the service
//         const metrics = await adminService.getInvestorMetricsWithComparison(
//             req.dbClient, 
//             { timeRange, startDate, endDate }
//         );
        
//         res.json({ status: 'success', data: metrics });
//     } catch (error) { next(error); }
// });

// // --- USER MANAGEMENT (Clients & Artisans) ---

// router.get('/artisans', checkPermission('users'), async (req, res, next) => {
//     try {
//         const result = await adminService.listArtisans(req.dbClient, req.query);
//         res.json({ status: 'success', ...result });
//     } catch (error) { next(error); }
// });

// router.get('/artisans/statistics', checkPermission('analytics'), async (req, res, next) => {
//     try {
//         console.log('Fetching artisan statistics...');
//         const statistics = await adminService.getArtisanStatistics(req.dbClient);
//         res.json({ status: 'success', data: statistics });
//     } catch (error) { next(error); }
// });

// // Artisan Governance
// router.get('/artisans/governance', checkPermission('analytics'), async (req, res, next) => {
//     try {
//         const governanceData = await adminService.getArtisanGovernance(req.dbClient);
//         res.json({
//             status: 'success',
//             data: governanceData
//         });
//     } catch (error) { next(error); }
// });

// router.get('/artisans/:id', checkPermission('users'), async (req, res, next) => {
//     try {
//         const data = await adminService.getArtisanDeepDive(req.dbClient, req.params.id);
//         res.json({ status: 'success', data });
//     } catch (error) { next(error); }
// });

// router.patch('/artisans/:id/tier', checkPermission('users'), async (req, res, next) => {
//     try {
//         const result = await adminService.updateArtisanTier(req.dbClient, req.admin.id, req.params.id, req.body.tier);
//         res.json({ status: 'success', message: 'Tier updated', data: result });
//     } catch (error) { next(error); }
// });

// // --- SUSPEND ARTISAN ---
// router.patch('/artisans/:id/suspend', checkPermission('users'), async (req, res, next) => {
//     try {
//         const result = await adminService.suspendArtisan(req.dbClient, req.admin.id, req.params.id);
//         res.json({ status: 'success', message: 'Artisan suspended successfully', data: result });
//     } catch (error) { next(error); }
// });

// // --- LIFT SUSPENSION ---
// router.patch('/artisans/:id/lift-suspension', checkPermission('users'), async (req, res, next) => {
//     try {
//         const result = await adminService.liftArtisanSuspension(req.dbClient, req.admin.id, req.params.id);
//         res.json({ status: 'success', message: 'Artisan suspension lifted successfully', data: result });
//     } catch (error) { next(error); }
// });

// // --- VERIFY ARTISAN GUARANTOR ---
// router.patch('/artisans/:artisanId/guarantors/:guarantorId/verify', checkPermission('users'), async (req, res, next) => {
//     try {
//         const result = await adminService.verifyArtisanGuarantor(req.dbClient, req.admin.id, req.params.artisanId, req.params.guarantorId);
//         res.json({ status: 'success', message: 'Guarantor verified', data: result });
//     } catch (error) { next(error); }
// });

// router.post('/clients/:id/credit', checkPermission('finance'), async (req, res, next) => {
//     try {
//         const { amount, reason } = req.body;
//         const result = await adminService.issueClientCredit(req.dbClient, req.admin.id, req.params.id, amount, reason);
//         res.json({ status: 'success', data: result });
//     } catch (error) { next(error); }
// });

// // --- JOB & DISPUTE MANAGEMENT ---

// router.get('/disputes', checkPermission('jobs'), async (req, res, next) => {
//     try {
//         const disputes = await adminService.getAllDisputes(req.dbClient);
//         res.json({ status: 'success', count: disputes.length, data: disputes });
//     } catch (error) { next(error); }
// });

// // Get dispute details with job and user information
// router.get('/disputes/:disputeId', checkPermission('jobs'), async (req, res, next) => {
//     try {
//         const dispute = await adminService.getDisputeDetails(req.dbClient, req.params.disputeId);
//         res.json({ status: 'success', data: dispute });
//     } catch (error) { next(error); }
// });

// // Resolve dispute with detailed options
// router.post('/disputes/:disputeId/resolve', checkPermission('jobs'), async (req, res, next) => {
//     try {
//         // Body: { decision: 'REFUND_CLIENT' | 'PAY_ARTISAN' | 'PARTIAL_REFUND',
//         //         notes: '...',
//         //         partialAmount: number (for partial refunds) }
//         const result = await adminService.resolveDispute(req.dbClient, req.admin.id, req.params.disputeId, req.body);
//         res.json({ status: 'success', message: 'Dispute resolved', data: result });
//     } catch (error) { next(error); }
// });

// // Add admin notes to dispute
// router.post('/disputes/:disputeId/notes', checkPermission('jobs'), async (req, res, next) => {
//     try {
//         const { notes } = req.body;
//         const result = await adminService.addDisputeNotes(req.dbClient, req.admin.id, req.params.disputeId, notes);
//         res.json({ status: 'success', message: 'Notes added', data: result });
//     } catch (error) { next(error); }
// });

// // Get dispute history for a specific dispute
// router.get('/disputes/:disputeId/history', checkPermission('jobs'), async (req, res, next) => {
//     try {
//         const history = await adminService.getDisputeHistory(req.dbClient, req.params.disputeId);
//         res.json({ status: 'success', data: history });
//     } catch (error) { next(error); }
// });

// // --- FINANCIAL MANAGEMENT ---

// router.get('/finance/ledger', checkPermission('finance'), async (req, res, next) => {
//     try {
//         const data = await adminService.getGlobalLedgerBalance(req.dbClient);
//         // Alert if imbalance exists
//         if (data.status === 'CRITICAL_IMBALANCE') {
//             console.error('CRITICAL: LEDGER IMBALANCE DETECTED');
//         }
//         res.json({ status: 'success', data });
//     } catch (error) { next(error); }
// });

// router.post('/finance/remit-riviaco', checkPermission('finance'), superAdminOnly, async (req, res, next) => {
//     try {
//         const result = await adminService.remitRiviaCo(req.dbClient, req.admin.id);
//         res.json({ status: 'success', message: 'Remittance processed', data: result });
//     } catch (error) { next(error); }
// });

// // --- ADMIN USER MANAGEMENT (Super Admin Only) ---

// router.post('/admins', superAdminOnly, async (req, res, next) => {
//     try {
//         const newAdmin = await adminService.createAdmin(req.dbClient, req.body);
//         res.status(201).json({ status: 'success', data: newAdmin });
//     } catch (error) { next(error); }
// });

// // --- CLIENT MANAGEMENT ---

// router.get('/clients', checkPermission('users'), async (req, res, next) => {
//     try {
//         const result = await adminService.listClients(req.dbClient, req.query);
//         res.json({ status: 'success', ...result });
//     } catch (error) { next(error); }
// });

// router.get('/clients/statistics', checkPermission('analytics'), async (req, res, next) => {
//     try {
//         const stats = await adminService.getClientStatistics(req.dbClient);
//         res.json({ status: 'success', data: stats });
//     } catch (error) { next(error); }
// });

// // Client Insights
// router.get('/clients/insights', checkPermission('analytics'), async (req, res, next) => {
//     try {
//         const insightsData = await adminService.getClientInsights(req.dbClient);
//         res.json({
//             status: 'success',
//             data: insightsData
//         });
//     } catch (error) { next(error); }
// });

// router.get('/clients/:id', checkPermission('users'), async (req, res, next) => {
//     try {
//         const data = await adminService.getClientDeepDive(req.dbClient, req.params.id);
//         res.json({ status: 'success', data });
//     } catch (error) { next(error); }
// });

// router.get('/investor-metrics', checkPermission('analytics'), async (req, res, next) => {
//     try {
//         const timeRange = req.query.timeRange || 'month';
//         const metrics = await adminService.getInvestorMetricsWithComparison(req.dbClient, timeRange);
//         res.json({ status: 'success', data: metrics });
//     } catch (error) { next(error); }
// });

// // --- DISPUTE MANAGEMENT ROUTES ---

// // Get messages for a specific dispute (Admin View)
// router.get('/disputes/:id/messages', async (req, res, next) => {
//     // We reuse the static method from DisputeService
//     const messages = await DisputeService.getMessages(req.dbClient, req.params.id);
//     res.status(200).json({ 
//         status: 'success', 
//         data: messages 
//     });
// });

// // Send a message as Admin (Intervention)
// router.post('/disputes/:id/messages', checkPermission('jobs'), async (req, res, next) => {
//     try {
//         const message = await DisputeService.sendMessage(req.dbClient, {
//             disputeId: req.params.id,
//             // FIX: Change req.user.id to req.admin.id
//             senderId: req.admin.id, 
//             senderRole: 'ADMIN', 
//             message: req.body.message
//         });
//         res.status(201).json({ 
//             status: 'success', 
//             data: message 
//         });
//     } catch (error) { next(error); }
// });

// router.post('/change-password', async (req, res, next) => {
//     try {
//         const { old_password, new_password } = req.body;
//         if (!old_password || !new_password) throw new AppError('Both passwords required', 400);
        
//         await adminService.changePassword(req.dbClient, req.admin.id, old_password, new_password);
        
//         res.status(200).json({ status: 'success', message: 'Password updated successfully' });
//     } catch (error) { next(error); }
// });

// router.get('/riviaco/stats', checkPermission('finance'), async (req, res, next) => {
//     try {
//         const data = await adminService.getRiviaCoStats(req.dbClient);
//         res.json({ status: 'success', data });
//     } catch (error) { next(error); }
// });

// router.post('/riviaco/enroll/:id', checkPermission('users'), async (req, res, next) => {
//     try {
//         const result = await adminService.enrollArtisanRiviaFree(req.dbClient, req.admin.id, req.params.id);
//         res.json({ status: 'success', message: 'Artisan enrolled in Free Plan', data: result });
//     } catch (error) { next(error); }
// });

// router.post('/riviaco/upgrade/:id', checkPermission('users'), async (req, res, next) => {
//     try {
//         const result = await adminService.upgradeArtisanRiviaStandard(req.dbClient, req.admin.id, req.params.id);
//         res.json({ status: 'success', message: 'Artisan upgraded to Standard Plan', data: result });
//     } catch (error) { next(error); }
// });

// // --- ADVANCED ANALYTICS ---

// router.get('/analytics/credit-risk', checkPermission('analytics'), async (req, res, next) => {
//     try {
//         const data = await adminService.getCreditRiskMetrics(req.dbClient);
//         res.json({ status: 'success', data });
//     } catch (error) { next(error); }
// });

// router.get('/analytics/data-products', checkPermission('analytics'), async (req, res, next) => {
//     try {
//         const data = await adminService.getDataProducts(req.dbClient);
//         res.json({ status: 'success', data });
//     } catch (error) { next(error); }
// });

// // --- WITHDRAWAL MANAGEMENT ---

// router.get('/withdrawals', checkPermission('finance'), async (req, res, next) => {
//     try {
//         const { status } = req.query;
//         const data = await adminService.getWithdrawalRequests(req.dbClient, status || 'PENDING');
//         res.json({ status: 'success', data });
//     } catch (error) { next(error); }
// });

// router.post('/withdrawals/:id/approve', checkPermission('finance'), async (req, res, next) => {
//     try {
//         const result = await adminService.approveWithdrawal(req.dbClient, req.user.id, req.params.id);
//         res.json({ status: 'success', data: result });
//     } catch (error) { next(error); }
// });

// router.post('/withdrawals/:id/reject', checkPermission('finance'), async (req, res, next) => {
//     try {
//         const { reason } = req.body;
//         const result = await adminService.rejectWithdrawal(req.dbClient, req.user.id, req.params.id, reason);
//         res.json({ status: 'success', data: result });
//     } catch (error) { next(error); }
// });


// module.exports = router;

// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const AppError = require('../utils/appError');
const DisputeService = require('../services/disputeService');
const adminService = require('../services/adminService');
const PaystackService = require('../services/paystackService');
const momoProviderService = require('../services/momoProviderService');
const { normalizePhoneToE164 } = require('../utils/phoneUtils');
const { adminAuth, checkPermission, superAdminOnly } = require('../middleware/adminMiddleware');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. Configure Local Storage
const isVercel = process.env.IS_VERCEL === 'true';
const uploadDir = isVercel ? '/tmp/uploads' : 'uploads/';
// Ensure directory exists
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); 
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // Limit to 5MB
});

// ============================================================================
// AUTHENTICATION ROUTES (Public)
// ============================================================================

router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) throw new AppError('Email and password are required', 400);
        
        // Pass IP and UserAgent for logging
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];
        
        const result = await adminService.login(req.dbClient, email, password, ip, userAgent);
        
        res.status(200).json({
            status: 'success',
            message: 'Admin login successful',
            ...result
        });
    } catch (error) { next(error); }
});

// ============================================================================
// PROTECTED ROUTES (Require Admin Token)
// ============================================================================
router.use(adminAuth);

// --- PROFILE MANAGEMENT ---

router.get('/me', async (req, res, next) => {
    try {
        const admin = await adminService.getAdminById(req.dbClient, req.admin.id);
        res.json({ status: 'success', admin });
    } catch (error) { next(error); }
});

router.post('/change-password', async (req, res, next) => {
    try {
        const { old_password, new_password } = req.body;
        if (!old_password || !new_password) throw new AppError('Both passwords required', 400);
        
        await adminService.changePassword(req.dbClient, req.admin.id, old_password, new_password);
        
        res.status(200).json({ status: 'success', message: 'Password updated successfully' });
    } catch (error) { next(error); }
});

// --- ADMIN USER MANAGEMENT (Super Admin Only) ---

router.post('/admins', superAdminOnly, async (req, res, next) => {
    try {
        const newAdmin = await adminService.createAdmin(req.dbClient, req.body);
        res.status(201).json({ status: 'success', data: newAdmin });
    } catch (error) { next(error); }
});

// ============================================================================
// DASHBOARD & ANALYTICS
// ============================================================================

router.get('/dashboard', checkPermission('dashboard'), async (req, res, next) => {
    try {
        // Run all calculations in parallel to speed up the dashboard load time
        const [metrics, financials, systemHealth] = await Promise.all([
            adminService.getInvestorMetrics(req.dbClient),      // Existing: GMV, Active Users, etc.
            adminService.getRevenueMetrics(req.dbClient),       // NEW: Pure Revenue, MRR, ARR
            adminService.getGlobalLedgerBalance(req.dbClient)   // Existing: Ledger Integrity Check
        ]);
        
        res.json({
            status: 'success',
            data: { 
                metrics,        // Operational counts
                financials,     // Financial performance (MRR, ARR)
                systemHealth    // Technical health
            }
        });
    } catch (error) { next(error); }
});

router.get('/platform-metrics', checkPermission('dashboard'), async (req, res, next) => {
    try {
        const takeRate = await adminService.getPlatformTakeRate(req.dbClient);
        const escrowHealth = await adminService.getEscrowPoolHealth(req.dbClient);
        
        res.json({
            status: 'success',
            data: { takeRate, escrowHealth }
        });
    } catch (error) { next(error); }
});

router.get('/analytics', checkPermission('analytics'), async (req, res, next) => {
    try {
        const financial = await adminService.getInvestorMetrics(req.dbClient);
        const geoStats = await adminService.getGeoStats(req.dbClient);
        const retention = await adminService.getClientRetention(req.dbClient);
        
        res.json({
            status: 'success',
            analytics: { financial, geoStats, retention }
        });
    } catch (error) { next(error); }
});

router.get('/marketplace-operations', checkPermission('analytics'), async (req, res, next) => {
    try {
        const data = await adminService.getMarketplaceOperations(req.dbClient);
        res.json({ status: 'success', data });
    } catch (error) { 
        console.error("Marketplace Ops Error:", error); 
        next(error); 
    }
});

router.get('/investor-metrics', checkPermission('analytics'), async (req, res, next) => {
    try {
        const { timeRange, startDate, endDate } = req.query;
        const metrics = await adminService.getInvestorMetricsWithComparison(
            req.dbClient, 
            { timeRange, startDate, endDate }
        );
        res.json({ status: 'success', data: metrics });
    } catch (error) { next(error); }
});

// --- ADVANCED ANALYTICS (Credit & Data Products) ---

router.get('/analytics/credit-risk', checkPermission('analytics'), async (req, res, next) => {
    try {
        const data = await adminService.getCreditRiskMetrics(req.dbClient);
        res.json({ status: 'success', data });
    } catch (error) { next(error); }
});

router.get('/analytics/data-products', checkPermission('analytics'), async (req, res, next) => {
    try {
        const data = await adminService.getDataProducts(req.dbClient);
        res.json({ status: 'success', data });
    } catch (error) { next(error); }
});

// ============================================================================
// USER MANAGEMENT (Artisans & Clients)
// ============================================================================

// --- ARTISANS ---
router.get('/artisans', checkPermission('users'), async (req, res, next) => {
    try {
        const result = await adminService.listArtisans(req.dbClient, req.query);
        res.json({ status: 'success', ...result });
    } catch (error) { next(error); }
});

router.get('/artisans/statistics', checkPermission('analytics'), async (req, res, next) => {
    try {
        const statistics = await adminService.getArtisanStatistics(req.dbClient);
        res.json({ status: 'success', data: statistics });
    } catch (error) { next(error); }
});

router.get('/artisans/governance', checkPermission('analytics'), async (req, res, next) => {
    try {
        const governanceData = await adminService.getArtisanGovernance(req.dbClient);
        res.json({ status: 'success', data: governanceData });
    } catch (error) { next(error); }
});

router.get('/artisans/:id', checkPermission('users'), async (req, res, next) => {
    try {
        const data = await adminService.getArtisanDeepDive(req.dbClient, req.params.id);
        res.json({ status: 'success', data });
    } catch (error) { next(error); }
});

router.patch('/artisans/:id/tier', checkPermission('users'), async (req, res, next) => {
    try {
        const result = await adminService.updateArtisanTier(req.dbClient, req.admin.id, req.params.id, req.body.tier);
        res.json({ status: 'success', message: 'Tier updated', data: result });
    } catch (error) { next(error); }
});

router.patch('/artisans/:id/suspend', checkPermission('users'), async (req, res, next) => {
    try {
        const result = await adminService.suspendArtisan(req.dbClient, req.admin.id, req.params.id);
        res.json({ status: 'success', message: 'Artisan suspended successfully', data: result });
    } catch (error) { next(error); }
});

router.patch('/artisans/:id/lift-suspension', checkPermission('users'), async (req, res, next) => {
    try {
        const result = await adminService.liftArtisanSuspension(req.dbClient, req.admin.id, req.params.id);
        res.json({ status: 'success', message: 'Artisan suspension lifted successfully', data: result });
    } catch (error) { next(error); }
});

router.patch('/artisans/:artisanId/guarantors/:guarantorId/verify', checkPermission('users'), async (req, res, next) => {
    try {
        const result = await adminService.verifyArtisanGuarantor(req.dbClient, req.admin.id, req.params.artisanId, req.params.guarantorId);
        res.json({ status: 'success', message: 'Guarantor verified', data: result });
    } catch (error) { next(error); }
});

// --- CLIENTS ---
router.get('/clients', checkPermission('users'), async (req, res, next) => {
    try {
        const result = await adminService.listClients(req.dbClient, req.query);
        res.json({ status: 'success', ...result });
    } catch (error) { next(error); }
});

router.get('/clients/statistics', checkPermission('analytics'), async (req, res, next) => {
    try {
        const stats = await adminService.getClientStatistics(req.dbClient);
        res.json({ status: 'success', data: stats });
    } catch (error) { next(error); }
});

router.get('/clients/insights', checkPermission('analytics'), async (req, res, next) => {
    try {
        const insightsData = await adminService.getClientInsights(req.dbClient);
        res.json({ status: 'success', data: insightsData });
    } catch (error) { next(error); }
});

router.get('/clients/:id', checkPermission('users'), async (req, res, next) => {
    try {
        const data = await adminService.getClientDeepDive(req.dbClient, req.params.id);
        res.json({ status: 'success', data });
    } catch (error) { next(error); }
});

router.post('/clients/:id/credit', checkPermission('finance'), async (req, res, next) => {
    try {
        const { amount, reason } = req.body;
        const result = await adminService.issueClientCredit(req.dbClient, req.admin.id, req.params.id, amount, reason);
        res.json({ status: 'success', data: result });
    } catch (error) { next(error); }
});

// ============================================================================
// JOB & DISPUTE MANAGEMENT
// ============================================================================

router.get('/disputes', checkPermission('jobs'), async (req, res, next) => {
    try {
        const disputes = await adminService.getAllDisputes(req.dbClient);
        res.json({ status: 'success', count: disputes.length, data: disputes });
    } catch (error) { next(error); }
});

router.get('/disputes/:disputeId', checkPermission('jobs'), async (req, res, next) => {
    try {
        const dispute = await adminService.getDisputeDetails(req.dbClient, req.params.disputeId);
        res.json({ status: 'success', data: dispute });
    } catch (error) { next(error); }
});

router.post('/disputes/:disputeId/resolve', checkPermission('jobs'), async (req, res, next) => {
    try {
        const result = await adminService.resolveDispute(req.dbClient, req.admin.id, req.params.disputeId, req.body);
        res.json({ status: 'success', message: 'Dispute resolved', data: result });
    } catch (error) { next(error); }
});

router.post('/disputes/:disputeId/notes', checkPermission('jobs'), async (req, res, next) => {
    try {
        const { notes } = req.body;
        const result = await adminService.addDisputeNotes(req.dbClient, req.admin.id, req.params.disputeId, notes);
        res.json({ status: 'success', message: 'Notes added', data: result });
    } catch (error) { next(error); }
});

router.get('/disputes/:disputeId/history', checkPermission('jobs'), async (req, res, next) => {
    try {
        const history = await adminService.getDisputeHistory(req.dbClient, req.params.disputeId);
        res.json({ status: 'success', data: history });
    } catch (error) { next(error); }
});

// Dispute Messages (Admin Intervention)
router.get('/disputes/:id/messages', async (req, res, next) => {
    try {
        const messages = await DisputeService.getMessages(req.dbClient, req.params.id);
        res.status(200).json({ status: 'success', data: messages });
    } catch (error) { next(error); }
});

router.post('/disputes/:id/messages', checkPermission('jobs'), async (req, res, next) => {
    try {
        const message = await DisputeService.sendMessage(req.dbClient, {
            disputeId: req.params.id,
            senderId: req.admin.id, // Using admin ID
            senderRole: 'ADMIN', 
            message: req.body.message
        });
        res.status(201).json({ status: 'success', data: message });
    } catch (error) { next(error); }
});

// ============================================================================
// FINANCIAL MANAGEMENT & RIVIACO
// ============================================================================

router.get('/finance/ledger', checkPermission('finance'), async (req, res, next) => {
    try {
        const data = await adminService.getGlobalLedgerBalance(req.dbClient);
        if (data.status === 'CRITICAL_IMBALANCE') {
            console.error('CRITICAL: LEDGER IMBALANCE DETECTED');
        }
        res.json({ status: 'success', data });
    } catch (error) { next(error); }
});

router.post('/finance/remit-riviaco', checkPermission('finance'), superAdminOnly, async (req, res, next) => {
    try {
        const result = await adminService.remitRiviaCo(req.dbClient, req.admin.id);
        res.json({ status: 'success', message: 'Remittance processed', data: result });
    } catch (error) { next(error); }
});

router.get('/riviaco/stats', checkPermission('finance'), async (req, res, next) => {
    try {
        const data = await adminService.getRiviaCoStats(req.dbClient);
        res.json({ status: 'success', data });
    } catch (error) { next(error); }
});

router.post('/riviaco/enroll/:id', checkPermission('users'), async (req, res, next) => {
    try {
        const result = await adminService.enrollArtisanRiviaFree(req.dbClient, req.admin.id, req.params.id);
        res.json({ status: 'success', message: 'Artisan enrolled in Free Plan', data: result });
    } catch (error) { next(error); }
});

router.post('/riviaco/upgrade/:id', checkPermission('users'), async (req, res, next) => {
    try {
        const result = await adminService.upgradeArtisanRiviaStandard(req.dbClient, req.admin.id, req.params.id);
        res.json({ status: 'success', message: 'Artisan upgraded to Standard Plan', data: result });
    } catch (error) { next(error); }
});

// ============================================================================
// WITHDRAWAL MANAGEMENT
// ============================================================================

router.get('/withdrawals', checkPermission('finance'), async (req, res, next) => {
    try {
        const { status } = req.query;
        const data = await adminService.getWithdrawalRequests(req.dbClient, status || 'PENDING');
        res.json({ status: 'success', data });
    } catch (error) { next(error); }
});

router.post('/withdrawals/:id/approve', checkPermission('finance'), async (req, res, next) => {
    try {
        // Updated to use req.admin.id
        const result = await adminService.approveWithdrawal(req.dbClient, req.admin.id, req.params.id);
        res.json({ status: 'success', data: result });
    } catch (error) { next(error); }
});

router.post('/withdrawals/:id/reject', checkPermission('finance'), async (req, res, next) => {
    try {
        const { reason } = req.body;
        // Updated to use req.admin.id
        const result = await adminService.rejectWithdrawal(req.dbClient, req.admin.id, req.params.id, reason);
        res.json({ status: 'success', data: result });
    } catch (error) { next(error); }
});

router.post('/onboarding/manual', checkPermission('manage_users'), async (req, res, next) => {
    try {
        const payload = req.body;
        const result = await adminService.createArtisanManually(req.dbClient, req.admin.id, payload);
        res.status(201).json({ status: 'success', data: result });
    } catch (error) { next(error); }
});

router.post('/onboarding/resolve-momo', checkPermission('manage_users'), async (req, res, next) => {
    const { phone_primary, momo_network } = req.body;

    if (!phone_primary || !momo_network) {
        return next(new AppError("Phone number and Network are required.", 400));
    }

    try {
        // 1. Normalize Phone
        const e164Phone = normalizePhoneToE164(phone_primary);
        
        // 2. Get Bank Code
        const bankCode = await momoProviderService.getProviderCode(momo_network, 'Ghana');
        if (!bankCode) {
            return next(new AppError("Invalid Network selected.", 400));
        }

        // 3. Resolve Account (Paystack)
        // Convert +233 to 0 for Paystack
        const localNumber = '0' + e164Phone.substring(4);
        
        const result = await PaystackService.resolveMoMoNumber(localNumber, bankCode);

        res.status(200).json({
            status: 'success',
            data: {
                account_name: result.resolved_account_name,
                account_number: result.resolved_account_number,
                bank_code: bankCode
            }
        });

    } catch (error) {
        console.error("Admin MoMo Resolution Error:", error.message);
        return next(new AppError("Could not verify Mobile Money account. Check details.", 400));
    }
});

router.post('/uploads/profile-picture', checkPermission('manage_users'), upload.single('profile_picture'), (req, res) => {
    if (!req.file) return res.status(400).json({ status: 'fail', message: 'No file uploaded' });
    
    // Return relative path (e.g., "uploads/profile_picture-12345.jpg")
    // Frontend or Database logic will prepend base URL if needed, or we store just the path.
    res.json({ 
        status: 'success', 
        profile_picture_url: req.file.path.replace(/\\/g, "/") // Ensure forward slashes for URLs
    });
});

router.post('/uploads/ghana-card', checkPermission('manage_users'), upload.single('ghana_card_image'), (req, res) => {
    if (!req.file) return res.status(400).json({ status: 'fail', message: 'No file uploaded' });
    
    res.json({ 
        status: 'success', 
        image_url: req.file.path.replace(/\\/g, "/") 
    });
});

module.exports = router;