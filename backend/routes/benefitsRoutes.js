const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const benefitsService = require('../services/benefitsService');
const batchRemittanceScheduler = require('../services/batchRemittanceScheduler');

const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// --- GET ARTISAN BENEFITS SUMMARY (F.A.6) ---
router.get('/artisan/summary', authMiddleware, catchAsync(async (req, res, next) => {
    if (req.user.role !== 'artisan') {
        return next(new AppError("This endpoint is only available for artisans.", 403));
    }

    const artisanId = req.user.id;
    const client = req.dbClient;

    try {
        const summary = await benefitsService.getArtisanBenefitsSummary(client, artisanId);
        
        res.status(200).json({
            message: "Benefits summary retrieved successfully.",
            summary: summary
        });
    } catch (e) {
        console.error("Benefits summary error:", e.message);
        return next(e);
    }
}));

// --- GET ARTISAN PENDING PREMIUMS ---
router.get('/artisan/pending-premiums', authMiddleware, catchAsync(async (req, res, next) => {
    if (req.user.role !== 'artisan') {
        return next(new AppError("This endpoint is only available for artisans.", 403));
    }

    const artisanId = req.user.id;
    const client = req.dbClient;

    try {
        const pendingPremiums = await benefitsService.getPendingPremiums(client, artisanId);
        
        const totalPending = pendingPremiums.reduce((sum, p) => {
            return sum + parseInt(p.premium_amount_pesewas, 10);
        }, 0);
        
        res.status(200).json({
            message: "Pending premiums retrieved successfully.",
            premiums: pendingPremiums,
            total_pending_pesewas: totalPending
        });
    } catch (e) {
        console.error("Pending premiums error:", e.message);
        return next(e);
    }
}));

// --- ADMIN ENDPOINTS (For future admin authentication) ---

// GET /benefits/remittance-batches (Admin only)
router.get('/remittance-batches', authMiddleware, catchAsync(async (req, res, next) => {
    // TODO: Add admin role check
    const client = req.dbClient;
    const { status, partner_name } = req.query;

    try {
        const batches = await benefitsService.getRemittanceBatches(
            client,
            status || null,
            partner_name || null
        );
        
        res.status(200).json({
            message: "Remittance batches retrieved successfully.",
            batches: batches
        });
    } catch (e) {
        console.error("Remittance batches error:", e.message);
        return next(e);
    }
}));

// GET /benefits/pending-premiums (Admin only)
router.get('/pending-premiums', authMiddleware, catchAsync(async (req, res, next) => {
    // TODO: Add admin role check
    const client = req.dbClient;
    const { partner_name } = req.query;

    try {
        const totalPending = await benefitsService.getTotalPendingPremiums(
            client,
            partner_name || 'RiviaCo'
        );
        
        const allPending = await benefitsService.getAllPendingPremiums(client);
        
        res.status(200).json({
            message: "Pending premiums summary retrieved successfully.",
            total_pending_pesewas: totalPending,
            total_premiums: allPending.length,
            premiums: allPending
        });
    } catch (e) {
        console.error("Pending premiums summary error:", e.message);
        return next(e);
    }
}));
// POST /benefits/process-batch (Admin - Manual trigger)
router.post('/process-batch', authMiddleware, catchAsync(async (req, res, next) => {
    // TODO: Add admin role check
    try {
        const result = await batchRemittanceScheduler.triggerManualRemittance();
        
        res.status(200).json({
            message: "Batch remittance processed successfully.",
            result: result
        });
    } catch (e) {
        console.error("Manual batch processing error:", e.message);
        return next(new AppError(`Batch processing failed: ${e.message}`, 500));
    }
}));

// --- CLAIM RIVIA INSURANCE (NEW ENDPOINT) ---
router.post('/claim-rivia-insurance', authMiddleware, catchAsync(async (req, res, next) => {
    if (req.user.role !== 'artisan') {
        return next(new AppError("This endpoint is only available for artisans.", 403));
    }

    const artisanId = req.user.id;
    const client = req.dbClient;

    let transactionCommitted = false;
    try {
        await client.query('BEGIN');

        const result = await benefitsService.claimRiviaInsurance(client, artisanId);

        await client.query('COMMIT');
        transactionCommitted = true;

        res.status(200).json({
            message: "Rivia insurance successfully claimed and activated.",
            member_id: result.memberId,
            card_code: result.cardCode,
            status: "active"
        });

    } catch (e) {
        // Only attempt rollback if transaction wasn't committed
        if (!transactionCommitted) {
            try {
                await client.query('ROLLBACK');
            } catch (rollbackError) {
                console.error("Error during transaction rollback:", rollbackError.message);
            }
        }
        console.error("Claim insurance error:", e.message);
        return next(new AppError(`Failed to claim insurance: ${e.message}`, 400));
    }
}));


module.exports = router;
