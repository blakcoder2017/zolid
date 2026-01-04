const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const catchAsync = require('../utils/catchAsync');

// --- ARTISAN DASHBOARD STATS ---
router.get('/artisan/stats', authMiddleware, catchAsync(async (req, res, next) => {
    const client = req.dbClient;
    const artisanId = req.user.id;

    // Fetch Rating and Completed Jobs count
    const sql = `
        SELECT 
            ap.reputation_score as rating,
            COUNT(jt.id) as completed_jobs,
            ap.tier_level
        FROM artisan_profiles ap
        LEFT JOIN job_transactions jt ON ap.id = jt.artisan_id AND jt.current_state = 'PAYOUT_SUCCESS'
        WHERE ap.id = $1
        GROUP BY ap.id
    `;

    const result = await client.query(sql, [artisanId]);
    const data = result.rows[0] || { rating: 0, completed_jobs: 0, tier_level: 1 };

    // Get Wallet Balance separately (if needed, or use 0 for now)
    // We assume the frontend fetches wallet balance from /finance/balance separately usually
    
    res.status(200).json({
        status: 'success',
        stats: {
            rating: parseFloat(data.rating || 5.0).toFixed(1),
            completed_jobs: parseInt(data.completed_jobs || 0),
            tier_level: parseInt(data.tier_level || 1)
        }
    });
}));

// --- CLIENT DASHBOARD STATS (Optional placeholder) ---
router.get('/client/stats', authMiddleware, catchAsync(async (req, res, next) => {
    res.status(200).json({ status: 'success', stats: {} });
}));

module.exports = router;