const { notificationQueue, analyticsQueue } = require('../services/queueService');
const notificationService = require('../services/notificationService');
const analyticsService = require('../services/analyticsService');
const { pool } = require('../db/db');

console.log('👷 Background Workers Started');

/**
 * 🔔 Notification Worker
 * Handles sending Push Notifications (FCM)
 */
notificationQueue.process(async (job) => {
    const { userId, userType, type, data } = job.data;
    const client = await pool.connect();

    try {
        console.log(`Processing notification for ${userType} ${userId}`);
        
        await notificationService.notifyUser(
            client,
            userId,
            userType,
            type,
            data
        );
        
    } catch (error) {
        console.error(`Notification Job Failed:`, error.message);
        throw error; // Triggers Bull retry logic
    } finally {
        client.release();
    }
});

/**
 * 📊 Analytics Worker
 * Handles tracking metrics without blocking the main thread
 */
analyticsQueue.process(async (job) => {
    const { action, ...payload } = job.data;
    const client = await pool.connect();

    try {
        switch (action) {
            case 'TRACK_QUOTE_ACCEPTED':
                await analyticsService.trackQuoteAccepted(client, payload.quoteId, payload.jobId);
                break;
            case 'TRACK_QUOTE_SUBMITTED':
                await analyticsService.trackQuoteSubmitted(client, payload.quoteId, payload.jobId);
                break;
            case 'TRACK_QUOTE_REJECTED':
                await analyticsService.trackQuoteRejected(client, payload.quoteId, payload.jobId);
                break;
            default:
                console.warn(`Unknown analytics action: ${action}`);
        }
    } catch (error) {
        console.error(`Analytics Job Failed:`, error.message);
        throw error;
    } finally {
        client.release();
    }
});