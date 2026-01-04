const express = require('express');
const router = express.Router();
const AdminService = require('../services/adminService');
const requireAdmin = require('../middleware/adminMiddleware');
const authMiddleware = require('../middleware/authMiddleware'); // Standard JWT check

// 🔒 Apply Authentication & Admin Authorization to ALL routes below
router.use(authMiddleware);
router.use(requireAdmin);

// --- 1. Artisan Governance ---
router.get('/artisans', async (req, res, next) => {
    try {
        const data = await AdminService.listArtisans(req.query);
        res.json({ status: 'success', data });
    } catch (e) { next(e); }
});

router.get('/artisans/:id', async (req, res, next) => {
    try {
        const data = await AdminService.getArtisanDeepDive(req.params.id);
        res.json({ status: 'success', data });
    } catch (e) { next(e); }
});

router.patch('/artisans/:id/tier', async (req, res, next) => {
    try {
        const { tier } = req.body; // e.g., "TIER_2"
        const data = await AdminService.updateArtisanTier(req.params.id, tier);
        res.json({ status: 'success', message: 'Tier updated', data });
    } catch (e) { next(e); }
});

// --- 2. Financial Integrity (The "Guardian" Endpoints) ---
router.get('/finance/ledger/global', async (req, res, next) => {
    try {
        const data = await AdminService.getGlobalLedgerBalance();
        
        // Critical Alert Header if unbalanced
        if (data.status === 'CRITICAL_IMBALANCE') {
            res.status(500); // 500 status to alert monitoring systems
        }
        
        res.json({ status: 'success', data });
    } catch (e) { next(e); }
});

// --- 3. Business Intelligence (Investor Metrics) ---
router.get('/metrics', async (req, res, next) => {
    try {
        const data = await AdminService.getFinancialMetrics();
        res.json({ status: 'success', data });
    } catch (e) { next(e); }
});

// --- 4. Dispute Tribunal ---
router.get('/disputes/active', async (req, res, next) => {
    try {
        const result = await AdminService.getActiveDisputes();
        res.json({ status: 'success', count: result.rows.length, data: result.rows });
    } catch (e) { next(e); }
});

router.post('/disputes/:jobId/resolve', async (req, res, next) => {
    try {
        const { decision, notes } = req.body; // { decision: 'REFUND_CLIENT', notes: 'Artisan no-show' }
        const result = await AdminService.forceResolveDispute(req.user, req.params.jobId, { decision, notes });
        res.json({ status: 'success', message: 'Dispute resolved', result });
    } catch (e) { next(e); }
});

module.exports = router;