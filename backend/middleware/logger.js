// backend/middleware/logger.js
const winston = require('winston');
const path = require('path');

// Determine if we are in a read-only environment (Vercel)
const isVercel = process.env.IS_VERCEL === 'true' || process.env.VERCEL === '1';

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
);

// Configure Transports
const transports = [
    // 1. ALWAYS Log to Console (Required for Vercel/Cloud logs)
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    })
];

// 2. ONLY Log to File if running Locally (Not Vercel)
if (!isVercel) {
    // Ensure we don't crash if folder creation fails locally (optional safety)
    try {
        transports.push(
            new winston.transports.File({ 
                filename: 'logs/error.log', 
                level: 'error' 
            })
        );
        transports.push(
            new winston.transports.File({ 
                filename: 'logs/combined.log' 
            })
        );
    } catch (e) {
        console.warn("⚠️ Could not initialize file logging (ignoring):", e.message);
    }
}

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: transports
});

// Request Logger Middleware
const requestLogger = (req, res, next) => {
    // Skip logging for health checks to reduce noise
    if (req.originalUrl === '/health') return next();

    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info({
            message: 'Request completed',
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent')
        });
    });
    next();
};

module.exports = { logger, requestLogger };