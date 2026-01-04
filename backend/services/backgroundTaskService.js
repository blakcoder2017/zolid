/**
 * Background Task Service (Producer)
 * Pushes tasks to Redis Queues for asynchronous processing
 */

const { notificationQueue, analyticsQueue } = require('./queueService');

// Job Options
const JOB_OPTS = {
    attempts: 3, // Retry 3 times if failed
    backoff: {
        type: 'exponential',
        delay: 2000 // Wait 2s, 4s, 8s between retries
    },
    removeOnComplete: true // Don't keep successful jobs in Redis memory
};

/**
 * Process quote acceptance
 */
async function processQuoteAcceptance(quoteId, jobId, artisanId, amount) {
    // 1. Queue Analytics
    analyticsQueue.add({
        action: 'TRACK_QUOTE_ACCEPTED',
        quoteId,
        jobId
    }, JOB_OPTS);

    // 2. Queue Notification
    notificationQueue.add({
        userId: artisanId,
        userType: 'artisan',
        type: 'QUOTE_ACCEPTED',
        data: {
            job_id: jobId,
            quote_id: quoteId,
            amount: amount,
            click_action: `/dashboard`
        }
    }, JOB_OPTS);

    console.log(`📥 Queued Quote Acceptance tasks for Quote ${quoteId}`);
}

/**
 * Process quote submission
 */
async function processQuoteSubmission(quoteId, jobId, artisanId) {
    analyticsQueue.add({
        action: 'TRACK_QUOTE_SUBMITTED',
        quoteId,
        jobId
    }, JOB_OPTS);
}

/**
 * Process quote rejection
 */
async function processQuoteRejection(quoteId, jobId) {
    analyticsQueue.add({
        action: 'TRACK_QUOTE_REJECTED',
        quoteId,
        jobId
    }, JOB_OPTS);
}

module.exports = {
    processQuoteAcceptance,
    processQuoteSubmission,
    processQuoteRejection
};