const express = require('express');
const jwt = require('jsonwebtoken');
const identityService = require('../services/identityService');
const PaystackService = require('../services/paystackService');
const momoProviderService = require('../services/momoProviderService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { normalizePhoneToE164 } = require('../utils/phoneUtils');

const router = express.Router();
const JWT_SECRET = identityService.JWT_SECRET;
const TEMP_TOKEN_SECRET = identityService.TEMP_TOKEN_SECRET;

// --- Helper: Convert E.164 (+233...) to Local Format (0...) for Paystack ---
const e164ToLocal = (phone) => {
    if (!phone) return '';
    if (phone.startsWith('+233')) {
        return '0' + phone.substring(4);
    }
    return phone;
};

// --- Middleware to check for a permanent JWT and attach user data ---
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new AppError("Authentication required (Missing Token).", 401));
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = { id: decoded.id, role: decoded.role }; 
        next();
    } catch (err) {
        return next(new AppError("Invalid or expired token.", 401));
    }
};

// --- 1. Public MoMo Resolution (Frontend Helper) ---
router.post('/artisan/resolve-momo', catchAsync(async (req, res, next) => {
    let { phone_primary, momo_network } = req.body;

    if (!phone_primary || !momo_network) {
        return next(new AppError("Phone number and Network are required.", 400));
    }

    try {
        const e164Phone = normalizePhoneToE164(phone_primary);
        const bankCode = await momoProviderService.getProviderCode(momo_network, 'Ghana');
        
        if (!bankCode) {
            return next(new AppError("Invalid or unsupported Network selected.", 400));
        }

        const localNumber = e164ToLocal(e164Phone);
        const result = await PaystackService.resolveMoMoNumber(localNumber, bankCode);

        res.status(200).json({
            status: 'success',
            data: {
                account_name: result.resolved_account_name,
                account_number: result.resolved_account_number,
                bank_code: bankCode
            }
        });

    } catch (error) {
        console.error("MoMo Resolution Error:", error.message);
        return next(new AppError("Could not verify Mobile Money account. Please check the number and network.", 400));
    }
}));

// --- 2. Artisan Login ---
router.post('/artisan/login', catchAsync(async (req, res, next) => {
    let { phone_primary, password } = req.body;
    const client = req.dbClient;

    if (!phone_primary || !password) {
        return next(new AppError("Phone number and password are required.", 400));
    }

    try {
        phone_primary = normalizePhoneToE164(phone_primary);
    } catch (error) {
        return next(new AppError(`Invalid phone number format: ${error.message}`, 400));
    }

    const artisan = await identityService.loginArtisan(client, phone_primary, password);
    
    if (!artisan) return next(new AppError("Invalid phone number or password.", 401));
    
    res.status(200).json({ 
        message: "Login successful.",
        artisan_id: artisan.artisanId,
        token: artisan.token,
        can_see_gigs: artisan.canSeeGigs,
        next_step: artisan.canSeeGigs ? null : "Update Ghana Card and Location to access jobs."
    });
}));

// --- 3. One-Step Artisan Registration (Production Optimized) ---
router.post('/artisan/register', catchAsync(async (req, res, next) => {
    let {
        phone_primary, full_name, password,
        dob, gender, email,
        gh_card_number, gh_card_image_url, 
        home_gps_address, primary_trade, momo_network,
        paystack_resolved_name, 
        is_identity_verified, primary_language,
        accept_terms, accept_privacy
    } = req.body;

    const client = req.dbClient;

    // 1. Input Validation
    if (!phone_primary || !full_name || !password || !momo_network) {
        return next(new AppError("Phone, name, password, and MoMo network are required.", 400));
    }
    if (!gh_card_number || !gh_card_number.trim()) {
        return next(new AppError("Ghana Card Number is required.", 400));
    }

    try {
        phone_primary = normalizePhoneToE164(phone_primary);
    } catch (error) {
        return next(new AppError(`Invalid phone number format: ${error.message}`, 400));
    }

    // 2. CREATE PAYSTACK RECIPIENT (EXTERNAL CALL - OUTSIDE TRANSACTION)
    // We do this BEFORE 'BEGIN' to avoid holding DB connections during network calls.
    let recipientCode = null;
    let isMomoVerified = false;

    try {
        // Enforce Paystack usage in Production
        if (process.env.PAYSTACK_SECRET_KEY) {
            const bankCode = await momoProviderService.getProviderCode(momo_network, 'Ghana');
            const localPhone = e164ToLocal(phone_primary);
            
            if (bankCode) {
                // Use the name verified by frontend (paystack_resolved_name) or provided full_name
                const recipient = await PaystackService.createTransferRecipient(
                    paystack_resolved_name || full_name, 
                    localPhone, 
                    bankCode
                );
                recipientCode = recipient.recipient_code;
                isMomoVerified = true; 
            } else {
                console.warn(`[Registration] Unknown MoMo Network: ${momo_network}`);
            }
        } else {
            console.warn("[Registration] PAYSTACK_SECRET_KEY missing. Skipping recipient creation.");
        }
    } catch (error) {
        console.error("[Registration] Paystack Recipient Failed:", error.message);
        // We continue registration but mark payment as unverified.
        // This prevents registration blocking due to temporary API issues.
        isMomoVerified = false;
    }

    // 3. Hash Password (CPU Intensive - do before transaction)
    const passwordHash = await identityService.hashPassword(password);

    // 4. DATABASE TRANSACTION (Fast & Atomic)
    let transactionCommitted = false;
    try {
        await client.query('BEGIN');

        // Check Duplicates (Phone/Email)
        const checkSql = `
            SELECT id FROM artisan_profiles 
            WHERE phone_primary = $1 OR ($2::text IS NOT NULL AND email = $2)
        `;
        const checkResult = await client.query(checkSql, [phone_primary, email]);
        
        if (checkResult.rows.length > 0) {
            await client.query('ROLLBACK');
            return next(new AppError("Account already exists with this phone or email.", 409));
        }

        // Insert Profile
        const insertSql = `
            INSERT INTO artisan_profiles (
                phone_primary, full_name, password_hash, momo_network,
                is_momo_verified, paystack_resolved_name, paystack_recipient_code,
                gh_card_number, gh_card_image_url, home_gps_address, primary_trade,
                is_identity_verified, primary_language,
                dob, gender, email, tier_level,
                accept_terms, accept_privacy
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            RETURNING id;
        `;

        const result = await client.query(insertSql, [
            phone_primary,
            full_name,
            passwordHash,
            momo_network,
            isMomoVerified,
            paystack_resolved_name || full_name,
            recipientCode, // Stores real RCP code or NULL
            gh_card_number || null,
            gh_card_image_url || null,
            home_gps_address || null,
            primary_trade || null,
            true, // Identity verification requires manual admin approval
            primary_language || 'ENGLISH',
            dob || null,
            gender || null,
            email || null,
            1, // Default Tier 1
            accept_terms || false,
            accept_privacy || false
        ]);

        const artisanId = result.rows[0].id;
        const token = jwt.sign({ id: artisanId, role: 'artisan' }, JWT_SECRET, { expiresIn: '7d' });

        await client.query('COMMIT');
        transactionCommitted = true;

        res.status(201).json({
            message: "Registration complete.",
            artisan_id: artisanId,
            token: token,
            next_step: "You can now see jobs and claim your insurance benefits."
        });

    } catch (e) {
        if (!transactionCommitted) {
            try { await client.query('ROLLBACK'); } catch (rb) {}
        }
        console.error("Registration DB Error:", e.message);
        return next(e);
    }
}));

// --- 4. Client Registration ---
router.post('/client/register', catchAsync(async (req, res, next) => {
    let { phone_primary, full_name, email, password, home_gps_address, home_lat, home_lon } = req.body;
    const client = req.dbClient;

    if (!phone_primary || !full_name || !email || !password) {
        return next(new AppError("Phone, name, email, and password are required.", 400));
    }

    try {
        phone_primary = normalizePhoneToE164(phone_primary);
    } catch (error) {
        return next(new AppError(`Invalid phone number format: ${error.message}`, 400));
    }

    let transactionCommitted = false;
    try {
        await client.query('BEGIN');

        const result = await identityService.createClientProfile(
            client, phone_primary, full_name, email, password, home_gps_address, home_lat, home_lon
        );

        await client.query('COMMIT');
        transactionCommitted = true;

        res.status(201).json({
            message: "Client profile created successfully.",
            client_id: result.clientId
        });

    } catch (e) {
        if (!transactionCommitted) {
            try { await client.query('ROLLBACK'); } catch (e) {}
        }
        if (e.code === '23505') {
            return next(new AppError("Phone or email already registered.", 409));
        }
        return next(e);
    }
}));

// --- 5. Client Login ---
router.post('/client/login', catchAsync(async (req, res, next) => {
    let { phone_primary, password } = req.body;
    const client = req.dbClient;

    if (!phone_primary || !password) {
        return next(new AppError("Phone number and password are required.", 400));
    }

    try {
        phone_primary = normalizePhoneToE164(phone_primary);
    } catch (error) {
        return next(new AppError(`Invalid phone number format: ${error.message}`, 400));
    }

    const clientUser = await identityService.loginClient(client, phone_primary, password);
    
    if (!clientUser) {
        return next(new AppError("Invalid phone number or password.", 401));
    }
    
    res.status(200).json({
        message: "Client login successful.",
        client_id: clientUser.clientId,
        token: clientUser.token,
    });
}));

// --- 6. Fetch MoMo Providers ---
router.get('/momo-providers', catchAsync(async (req, res, next) => {
    try {
        const momoCodes = await PaystackService.fetchGhanaMomoBankCodes();
        const providers = Object.entries(momoCodes).map(([key, code]) => ({
            provider_name: key, 
            provider_code: code 
        }));

        res.status(200).json({
            message: "Mobile money providers retrieved successfully.",
            providers: providers
        });
    } catch (error) {
        return res.status(200).json({
            message: "Using fallback providers.",
            providers: [
                { provider_name: 'MTN', provider_code: 'MTN' },
                { provider_name: 'Telecel', provider_code: 'VOD' },
                { provider_name: 'AT', provider_code: 'ATL' }
            ]
        });
    }
}));

// --- 7. Change Password ---
router.post('/change-password', authMiddleware, catchAsync(async (req, res, next) => {
    const { old_password, new_password } = req.body;
    const { id, role } = req.user;
    const client = req.dbClient;
    
    if (!old_password || !new_password) {
        return next(new AppError("Old and new passwords are required.", 400));
    }
    
    if (new_password.length < 6) {
        return next(new AppError("New password must be at least 6 characters.", 400));
    }
    
    await identityService.changePassword(client, id, role, old_password, new_password);
    
    res.status(200).json({
        message: "Password changed successfully."
    });
}));

module.exports = router;