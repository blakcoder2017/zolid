const AppError = require('../utils/appError');

// Enhanced operational error handler
const handleOperationalError = (err, req, res) => {
    // Sanitize error message for security
    const sanitizedMessage = err.message.replace(/[\r\n]/g, ' ').substring(0, 500);
    
    const response = {
        status: err.status,
        code: err.statusCode,
        message: sanitizedMessage,
        request_id: req.request_id
    };

    // Add validation errors if present
    if (err.errors) {
        response.errors = err.errors;
    }

    // Add additional context in development
    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
        response.originalError = err.cause;
    }

    res.status(err.statusCode).json(response);
};

// Enhanced programming error handler
const handleProgrammingError = (err, req, res) => {
    // 1. Enhanced logging
    const errorInfo = {
        request_id: req.request_id,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        user_agent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        error_type: err.constructor.name,
        message: err.message,
        stack: err.stack
    };

    console.error('PROGRAMMING ERROR:', JSON.stringify(errorInfo, null, 2));

    // 2. In production, send to external monitoring
    if (process.env.NODE_ENV === 'production') {
        // Example: Sentry.captureException(err, { extra: errorInfo });
        // Example: LogRocket.captureException(err, { extra: errorInfo });
    }

    // 3. Send safe response to client
    res.status(500).json({
        status: 'error',
        message: process.env.NODE_ENV === 'production'
            ? 'Internal Server Error. Please try again later.'
            : err.message,
        code: 500,
        request_id: req.request_id,
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            error_type: err.constructor.name
        })
    });
};

// Global Error Handler Middleware (Enhanced)
module.exports = (err, req, res, next) => {
    // Default error properties
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    err.requestId = req.request_id || 'unknown';

    // Handle specific error types
    if (err.name === 'ValidationError') {
        // Mongoose validation error
        const errors = Object.values(err.errors).map(e => e.message);
        const error = new AppError(`Validation Error: ${errors.join(', ')}`, 400);
        error.errors = errors;
        return handleOperationalError(error, req, res);
    }

    if (err.code === '23505') {
        // PostgreSQL unique constraint violation
        const error = new AppError('Duplicate entry detected. This resource already exists.', 409);
        return handleOperationalError(error, req, res);
    }

    if (err.code === '23503') {
        // PostgreSQL foreign key constraint violation
        const error = new AppError('Related resource not found.', 400);
        return handleOperationalError(error, req, res);
    }

    if (err.name === 'JsonWebTokenError') {
        const error = new AppError('Invalid authentication token.', 401);
        return handleOperationalError(error, req, res);
    }

    if (err.name === 'TokenExpiredError') {
        const error = new AppError('Authentication token has expired.', 401);
        return handleOperationalError(error, req, res);
    }

    // Operational vs Programming errors
    if (err.isOperational) {
        handleOperationalError(err, req, res);
    } else {
        handleProgrammingError(err, req, res);
    }
};