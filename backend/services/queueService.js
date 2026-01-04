const Bull = require('bull');
require('dotenv').config();

// Use the REDIS_URL from .env
const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
    console.warn('⚠️ REDIS_URL not found in .env. Queues may not work.');
}

// 1. Define Queues
const notificationQueue = new Bull('notifications', redisUrl);
const analyticsQueue = new Bull('analytics', redisUrl);

// 2. Global Error Listeners
const queues = [notificationQueue, analyticsQueue];

queues.forEach(queue => {
    queue.on('error', (error) => {
        // Handles connection errors (e.g., wrong password)
        console.error(`🔴 Redis Queue (${queue.name}) Error:`, error.message);
    });

    queue.on('failed', (job, err) => {
        // Handles job execution errors
        console.warn(`⚠️ Job ${job.id} in ${queue.name} failed:`, err.message);
    });
    
    queue.on('ready', () => {
        console.log(`✅ Queue ${queue.name} connected to Redis`);
    });
});

module.exports = {
    notificationQueue,
    analyticsQueue
};