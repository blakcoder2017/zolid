/**
 * Background Task Routes
 * Internal API endpoints for processing background tasks
 * These should be called internally or via a job queue
 */

const express = require('express');
const router = express.Router();
const backgroundTaskService = require('../services/backgroundTaskService');
const catchAsync = require('../utils/catchAsync');

// Internal route to process quote acceptance background tasks
router.post('/quote-acceptance', catchAsync(async (req, res) => {
    const { quote_id, job_id, artisan_id, amount } = req.body;
    
    // Fire and forget - don't wait for completion
    setImmediate(() => {
        backgroundTaskService.processQuoteAcceptance(quote_id, job_id, artisan_id, amount)
            .catch(err => console.error('Background task error:', err.message));
    });
    
    res.status(202).json({
        message: 'Background task queued',
        task: 'quote_acceptance'
    });
}));

// Internal route to process quote submission analytics
router.post('/quote-submission', catchAsync(async (req, res) => {
    const { quote_id, job_id, artisan_id } = req.body;
    
    setImmediate(() => {
        backgroundTaskService.processQuoteSubmission(quote_id, job_id, artisan_id)
            .catch(err => console.error('Background task error:', err.message));
    });
    
    res.status(202).json({
        message: 'Background task queued',
        task: 'quote_submission'
    });
}));

module.exports = router;
