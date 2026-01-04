const redis = require('redis');
const { logger } = require('../middleware/logger');

class CacheService {
    constructor() {
        this.client = redis.createClient({
            url: process.env.REDIS_URL,
            retry_strategy: (options) => {
                if (options.error && options.error.code === 'ECONNREFUSED') {
                    logger.error('Redis server refused connection');
                    return new Error('The Redis server refused connection');
                }
                if (options.total_retry_time > 1000 * 60 * 60) {
                    logger.error('Redis retry time exhausted');
                    return new Error('Retry time exhausted');
                }
                if (options.attempt > 10) {
                    logger.error('Redis max attempts reached');
                    return undefined;
                }
                return Math.min(options.attempt * 100, 3000);
            }
        });
        
        this.client.on('error', (err) => {
            logger.error('Redis Client Error:', err);
        });
        
        this.client.on('connect', () => {
            logger.info('Redis client connected');
        });
    }
    
    async get(key) {
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            logger.error('Cache get error:', error);
            return null;
        }
    }
    
    async set(key, value, ttl = 300) { // Default 5 minutes
        try {
            await this.client.setex(key, ttl, JSON.stringify(value));
            return true;
        } catch (error) {
            logger.error('Cache set error:', error);
            return false;
        }
    }
    
    async del(key) {
        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            logger.error('Cache delete error:', error);
            return false;
        }
    }
    
    async flush() {
        try {
            await this.client.flushall();
            return true;
        } catch (error) {
            logger.error('Cache flush error:', error);
            return false;
        }
    }
}

module.exports = new CacheService();