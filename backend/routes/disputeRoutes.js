const express = require('express');
const router = express.Router();
const DisputeService = require('../services/disputeService');
const { authMiddleware } = require('../middleware/auth');
const catchAsync = require('../utils/catchAsync');
const db = require('../db/db');

router.get('/', authMiddleware, catchAsync(async (req, res) => {
    // req.user is populated by authMiddleware
    const disputes = await DisputeService.getUserDisputes(req.dbClient, req.user.id, req.user.role);
    
    res.status(200).json({ 
        status: 'success', 
        data: disputes 
    });
}));

// Raise a dispute
router.post('/raise', authMiddleware, catchAsync(async (req, res) => {
    const { job_id, category, description, evidence_urls } = req.body;
    
    const result = await DisputeService.raiseDispute(req.user, job_id, {
        category, description, evidence_urls
    });

    res.status(201).json({
        status: 'success',
        message: 'Dispute raised. An admin will review the case.',
        data: result
    });
}));

// Get dispute details
router.get('/:job_id', authMiddleware, catchAsync(async (req, res) => {
    const result = await DisputeService.getDisputeByJob(req.params.job_id);
    res.status(200).json({ status: 'success', data: result });
}));

// Accept a dispute proposal
router.post('/:dispute_id/accept', authMiddleware, catchAsync(async (req, res) => {
    const { dispute_id } = req.params;
    const client = await db.getClient();
    
    try {
        const result = await DisputeService.acceptProposal(client, req.user.id, dispute_id);
        res.status(200).json({ status: 'success', data: result });
    } finally {
        client.release();
    }
}));

// Propose a counter-offer
router.post('/:dispute_id/counter', authMiddleware, catchAsync(async (req, res) => {
    const { dispute_id } = req.params;
    const { counter_offer_amount } = req.body;
    
    const client = await db.getClient();
    
    try {
        await client.query(
            `UPDATE disputes SET artisan_counter_offer = $1, current_turn = 'CLIENT' WHERE id = $2`,
            [counter_offer_amount, dispute_id]
        );
        
        res.status(200).json({ status: 'success', message: 'Counter-offer submitted.' });
    } finally {
        client.release();
    }
}));

// --- MESSAGE ROUTES ---

// Get Messages
router.get('/:dispute_id/messages', authMiddleware, catchAsync(async (req, res, next) => {
    try {
        const messages = await DisputeService.getMessages(req.dbClient, req.params.dispute_id);
        res.json({ status: 'success', data: messages });
    } catch (error) { next(error); }
}));

// Send Message
router.post('/:dispute_id/messages', authMiddleware, catchAsync(async (req, res, next) => {
    try {
        const message = await DisputeService.sendMessage(req.dbClient, {
            disputeId: req.params.dispute_id,
            senderId: req.user.id,
            senderRole: req.user.role === 'client' ? 'CLIENT' : 'ARTISAN', 
            message: req.body.message
        });
        res.json({ status: 'success', data: message });
    } catch (error) { next(error); }
}));

module.exports = router;