const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const db = require('../db/db');

/**
 * Middleware: Verify Admin Token & Attach User
 * Checks the 'admin_users' table, NOT the regular users table.
 */
const adminAuth = async (req, res, next) => {
    try {
        // 1. Get token from header
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next(new AppError('Not authorized. Please log in as admin.', 401));
        }

        // 2. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3. Check if admin exists in dedicated table
        // Querying directly ensures we catch disabled accounts immediately
        const result = await db.query(
            'SELECT * FROM admin_users WHERE id = $1 AND is_active = TRUE', 
            [decoded.id]
        );
        
        const admin = result.rows[0];
        if (!admin) {
            return next(new AppError('Admin user no longer exists or is inactive.', 401));
        }

        // 4. Attach admin to request object for use in routes
        req.admin = admin;
        next();
    } catch (error) {
        return next(new AppError('Invalid token or authorization failed', 401));
    }
};

/**
 * Middleware: Check for Specific Permissions
 * Usage: router.get('/finance', adminAuth, checkPermission('finance'), ...)
 */
const checkPermission = (requiredPermission) => {
    return (req, res, next) => {
        // Safety check: ensure adminAuth ran first
        if (!req.admin) {
            return next(new AppError('User not authenticated.', 401));
        }

        // 1. Super Admins bypass all checks
        if (req.admin.role === 'SUPER_ADMIN') {
            return next();
        }

        // 2. Check specific permission flag
        // Assumes permissions is stored as JSONB: { "finance": true, "users": false }
        if (req.admin.permissions && req.admin.permissions[requiredPermission]) {
            return next();
        }

        return next(new AppError(`Access Denied: You need '${requiredPermission}' permission.`, 403));
    };
};

/**
 * Middleware: Restrict to Super Admins Only
 */
const superAdminOnly = (req, res, next) => {
    if (!req.admin || req.admin.role !== 'SUPER_ADMIN') {
        return next(new AppError('Access Denied: Super Admin privileges required.', 403));
    }
    next();
};

/**
 * Middleware: Audit Logging Helper
 * This is a pass-through that allows you to tag routes for logging.
 * The actual DB insertion happens in the Service layer to ensure consistency.
 */
const logAdminAction = (action, entityType, entityIdExtractor) => {
    return (req, res, next) => {
        // We attach metadata to the request so the controller/service knows what to log
        req.auditMeta = {
            action,
            entityType,
            // If entityIdExtractor is a function, call it with req, else use it directly
            entityId: typeof entityIdExtractor === 'function' ? entityIdExtractor(req) : entityIdExtractor
        };
        next();
    };
};

module.exports = {
    adminAuth,
    checkPermission,
    superAdminOnly,
    logAdminAction
};