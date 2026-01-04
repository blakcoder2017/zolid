const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

// Configure Winston logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'zolid-backend' },
    transports: [
        // Write all logs with level 'error' and below to error.log
        new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Write all logs to combined.log
        new winston.transports.File({ 
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
});

// Add console transport in non-production environments
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// Request logging middleware
const requestLogger = (req, res, next) => {
    const start = Date.now();
    const requestId = uuidv4();
    
    // Add request ID to request object
    req.request_id = requestId;
    
    // Log request
    logger.info('Incoming request', {
        request_id: requestId,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        user_agent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });
    
    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(...args) {
        const duration = Date.now() - start;
        
        logger.info('Request completed', {
            request_id: requestId,
            method: req.method,
            url: req.originalUrl,
            status_code: res.statusCode,
            duration_ms: duration,
            timestamp: new Date().toISOString()
        });
        
        originalEnd.apply(this, args);
    };
    
    next();
};

module.exports = {
    logger,
    requestLogger
};