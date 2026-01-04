const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: 'fail',
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

// Common validation rules
const validationRules = {
    phone: body('phone_primary')
        .isMobilePhone('any', { strictMode: false })
        .withMessage('Invalid phone number format')
        .trim()
        .escape(),
    
    email: body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Invalid email address'),
    
    password: body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    
    name: body('full_name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage('Name contains invalid characters'),
    
    jobId: param('jobId')
        .isUUID()
        .withMessage('Invalid job ID format'),
    
    amount: body('gross_fee_pesewas')
        .isInt({ min: 100, max: 50000000 }) // Min GHS 1, Max GHS 500,000
        .withMessage('Amount must be between 100 and 50,000,000 pesewas')
};

module.exports = {
    validationRules,
    handleValidationErrors
};