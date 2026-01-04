// backend/middleware/adminAuth.js
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const db = require('../db');

/**
 * Middleware to verify Admin JWT and attach admin user to request
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
        // We use db.query here directly because this runs before the route handler
        const result = await db.query(
            'SELECT * FROM admin_users WHERE id = $1 AND is_active = TRUE', 
            [decoded.id]
        );
        
        const admin = result.rows[0];
        if (!admin) {
            return next(new AppError('Admin user no longer exists or is inactive.', 401));
        }

        // 4. Attach to request
        req.admin = admin;
        next();
    } catch (error) {
        return next(new AppError('Invalid token or authorization failed', 401));
    }
};

/**
 * Middleware to check specific permissions
 * Usage: router.get('/path', adminAuth, checkPermission('finance'), controller)
 */
const checkPermission = (requiredPermission) => {
    return (req, res, next) => {
        // Super Admins bypass permission checks
        if (req.admin.role === 'SUPER_ADMIN') {
            return next();
        }

        // Check if permissions object exists and has the flag
        if (req.admin.permissions && req.admin.permissions[requiredPermission]) {
            return next();
        }

        return next(new AppError(`Access Denied: You need '${requiredPermission}' permission.`, 403));
    };
};

/**
 * Middleware to restrict access to Super Admins only
 */
const superAdminOnly = (req, res, next) => {
    if (req.admin.role !== 'SUPER_ADMIN') {
        return next(new AppError('Access Denied: Super Admin privileges required.', 403));
    }
    next();
};

/**
 * Middleware stub for logging actions.
 * (Actual DB logging is handled inside adminService to ensure atomicity with transactions)
 */
const logAdminAction = (action, entityType, entityIdExtractor) => {
    return (req, res, next) => {
        // We simply pass through here. 
        // The Service layer handles the actual INSERT into admin_audit_log
        // to ensure it happens within the same database transaction if necessary.
        next();
    };
};

module.exports = {
    adminAuth,
    checkPermission,
    superAdminOnly,
    logAdminAction
};