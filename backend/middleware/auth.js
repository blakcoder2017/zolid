const jwt = require('jsonwebtoken');
require('dotenv').config();

// CRITICAL: Must match the secret used for signing tokens in identityService.js
const JWT_SECRET = process.env.JWT_SECRET; 

if (!JWT_SECRET) {
    throw new Error("FATAL: JWT_SECRET must be set in the .env file.");
}

/**
 * Standard JWT Authentication Middleware.
 * Decodes the token, verifies the signature, and attaches req.user = { id, role }.
 * This middleware protects routes that require a logged-in user.
 */
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Authentication required. Bearer Token missing or improperly formatted." });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Attach user ID and role for use in subsequent route handlers
        req.user = { id: decoded.id, role: decoded.role }; 
        next();
    } catch (err) {
        // Token is invalid (expired, wrong signature, etc.)
        return res.status(401).json({ error: "Invalid or expired token." });
    }
};

/**
 * Authorization Middleware: Checks if the Artisan is verified and can see/accept gigs.
 * This is the GIG GATE. It relies on authMiddleware and dbClientMiddleware running first.
 */
const gigGateMiddleware = async (req, res, next) => {
    // 1. Authorization check only applies to Artisans
    if (req.user.role !== 'artisan') {
        // Allow clients/admins to pass; their access is handled elsewhere
        return next();
    }
    
    // 2. Fetch verification status from DB
    const client = req.dbClient; // Assumed available via dbClientMiddleware
    const artisanId = req.user.id;
    
    const sql = `
        SELECT is_momo_verified, is_identity_verified, home_gps_address 
        FROM artisan_profiles 
        WHERE id = $1;
    `;
    
    try {
        const result = await client.query(sql, [artisanId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Artisan profile not found." });
        }
        
        const { is_momo_verified, is_identity_verified, home_gps_address } = result.rows[0];
        
        // Gig Gate Logic: Must have MoMo verified AND Identity verified AND Location set
        const canSeeGigs = is_momo_verified && is_identity_verified && !!home_gps_address;
        
        if (canSeeGigs) {
            return next();
        } else {
            return res.status(403).json({ 
                error: "Access Denied: You must complete your profile verification to see jobs.",
                status: {
                    momo_verified: is_momo_verified,
                    identity_verified: is_identity_verified,
                    location_set: !!home_gps_address
                }
            });
        }
    } catch (e) {
        console.error("Gig Gate DB Check Error:", e.message);
        return res.status(500).json({ error: "Authorization check failed." });
    }
};

module.exports = {
    authMiddleware,
    gigGateMiddleware,
};