const PaystackService = require('./paystackService');
const momoProviderService = require('./momoProviderService');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { e164ToLocal } = require('../utils/phoneUtils');
require('dotenv').config();

// --- CONFIGURATION ---
const JWT_SECRET = process.env.JWT_SECRET;
const TEMP_TOKEN_SECRET = process.env.TEMP_TOKEN_SECRET; 

// --- ENVIRONMENT & TEST SETUP ---
// Check both ENVIRONMENT and NODE_ENV for development mode
const ENVIRONMENT = process.env.ENVIRONMENT || process.env.NODE_ENV || 'production';
console.log(`🔧 Environment detected: ${ENVIRONMENT}`); 
const DEV_TEST_ACCOUNT = '+233552537904'; 
const TEST_RESOLVED_NAME = "ZOLID TEST ACCOUNT"; 

const GHANA_MOMO_BANK_CODES = {}; // Dynamically populated at startup


// CRITICAL: Ensure secrets exist in production.
if (!JWT_SECRET || !TEMP_TOKEN_SECRET) {
    throw new Error("FATAL: JWT and TEMP_TOKEN secrets must be set in the .env file.");
}


// --- PRODUCTION HASHING IMPLEMENTATION ---
const SALT_ROUNDS = 10;

async function hashPassword(password) {
    // Ensure password is not null/undefined before hashing
    if (!password) {
        throw new Error("Password cannot be empty during hashing.");
    }
    return bcrypt.hash(password, SALT_ROUNDS); 
}

async function comparePassword(password, hash) {
    return bcrypt.compare(password, hash); 
}
// --- END PRODUCTION HASHING IMPLEMENTATION ---


/**
 * Artisan Logic (Omitted details for brevity, assumed stable)
 */

async function verifyMomo(phonePrimary, fullName, momoNetwork) {
    let paystackName = null;

    // Development mode bypass: Skip Paystack API call and use provided name
    // Check if we're in development mode
    const isDevelopment = ENVIRONMENT === 'development' || process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
        console.warn(`⚠️ DEVELOPMENT MODE (ENVIRONMENT=${ENVIRONMENT}, NODE_ENV=${process.env.NODE_ENV}): Bypassing Paystack API verification. Using provided name as resolved name.`);
        paystackName = fullName.toUpperCase(); // Use provided name, uppercase to match typical Paystack format
    } else {
        // Production: Verify with Paystack API
        // Get provider code from database (default to Ghana)
        const bankCode = await momoProviderService.getProviderCode(momoNetwork, 'Ghana');
        if (!bankCode) {
            throw new Error(`Invalid Mobile Money Network specified: ${momoNetwork}. Provider code not found in database.`);
        }
        
        const resolution = await PaystackService.resolveMoMoNumber(phonePrimary, bankCode);
        paystackName = resolution.resolved_account_name;

        // Name matching validation (only in production)
        const providedNameParts = fullName.toLowerCase().split(' ').filter(p => p.length > 2);
        const resolvedNameParts = paystackName.toLowerCase().split(' ');
        const matchCount = providedNameParts.filter(part => resolvedNameParts.includes(part)).length;
        
        const isMatch = matchCount >= Math.ceil(providedNameParts.length / 2) && providedNameParts.length > 0;
        
        if (!isMatch) {
            throw new Error(`Name mismatch. Paystack name resolved to: ${paystackName}.`);
        }
    }

  

    return { resolvedName: paystackName };
}

async function finalizeArtisanRegistration(client, phonePrimary, fullName, momoNetwork, password, paystackResolvedName) {
    const checkSql = "SELECT id FROM artisan_profiles WHERE phone_primary = $1;";
    const checkResult = await client.query(checkSql, [phonePrimary]);
    if (checkResult.rows.length > 0) {
        throw { code: '23505', message: "Phone number already registered." }; 
    }
    
    // Validate that resolved name was provided (should come from successful MoMo verification)
    if (!paystackResolvedName) {
        throw new Error("MoMo verification data missing. Please complete MoMo verification first.");
    }
    
    const passwordHash = await hashPassword(password);
    const sql = `
        INSERT INTO artisan_profiles (
            phone_primary, full_name, password_hash, momo_network, 
            is_momo_verified, paystack_resolved_name, tier_level
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING id;
    `;
    
    const result = await client.query(sql, [
        phonePrimary, fullName, passwordHash, momoNetwork, 
        true, paystackResolvedName, 1 
    ]);
    const artisanId = result.rows[0].id;
    const permanentToken = jwt.sign({ id: artisanId, role: 'artisan' }, JWT_SECRET, { expiresIn: '7d' });
    return { artisanId, token: permanentToken };
}

async function finalizeArtisanIdentity(client, artisanId, ghCardNumber, homeGpsAddress, primaryTrade, primaryLanguage) {
    // ... (logic)
    const profileSql = `
        SELECT phone_primary, full_name, momo_network 
        FROM artisan_profiles 
        WHERE id = $1;
    `;
    const profileResult = await client.query(profileSql, [artisanId]);
    if (profileResult.rows.length === 0) {
        throw new Error("Artisan profile not found.");
    }
    const { phone_primary, full_name, momo_network } = profileResult.rows[0];
    
    let isVerified = false;
    try { 
        isVerified = PaystackService.verifyGhanaCard(ghCardNumber, phone_primary); 
    } catch (e) { 
        // Verification failed, but continue - isVerified remains false
        console.warn(`Ghana Card verification failed for artisan ${artisanId}:`, e.message);
    }
    
    const bankCode = GHANA_MOMO_BANK_CODES[momo_network];
    if (!bankCode) { 
        throw new Error(`Invalid Mobile Money Network configured: ${momo_network}. Cannot create recipient.`); 
    }

    let recipientCode = null;
    try {
        // Create transfer recipient with timeout protection
        // In development mode, we can skip this if Paystack is not configured
        const isDevelopment = ENVIRONMENT === 'development' || process.env.NODE_ENV === 'development';
        
        if (isDevelopment && !process.env.PAYSTACK_SECRET_KEY) {
            // Development mode: Create a mock recipient code
            console.warn('⚠️ DEVELOPMENT MODE: Using mock recipient code (Paystack not configured)');
            recipientCode = `MOCK_RECIPIENT_${artisanId.substring(0, 8)}`;
        } else {
            // Production or development with Paystack configured: Make actual API call
            // Paystack expects phone number in LOCAL format (without country code) for mobile money
            const accountNumber = e164ToLocal(phone_primary);
            const recipientResult = await PaystackService.createTransferRecipient(full_name, accountNumber, bankCode);
            recipientCode = recipientResult.recipient_code;
        }
    } catch (e) {
        // If Paystack fails in development, use mock code as fallback
        const isDevelopment = ENVIRONMENT === 'development' || process.env.NODE_ENV === 'development';
        if (isDevelopment) {
            console.warn('⚠️ Paystack API call failed, using mock recipient code:', e.message);
            recipientCode = `MOCK_RECIPIENT_${artisanId.substring(0, 8)}`;
        } else {
            throw new Error(`Failed to create Paystack Recipient: ${e.message}`);
        }
    }
    
    // MVP: When paystack_recipient_code is set, automatically set is_identity_verified = true
    const updateSql = `
        UPDATE artisan_profiles 
        SET gh_card_number = $1, 
            home_gps_address = $2, 
            paystack_recipient_code = $4,
            is_identity_verified = CASE 
                WHEN $4 IS NOT NULL THEN true 
                ELSE $3 
            END,
            primary_trade = $5, 
            primary_language = $6, 
            updated_at = NOW()
        WHERE id = $7
        RETURNING is_identity_verified, home_gps_address, paystack_recipient_code;
    `;
    
    const result = await client.query(updateSql, [
        ghCardNumber, homeGpsAddress, isVerified, recipientCode, primaryTrade, primaryLanguage, artisanId
    ]);
    
    const row = result.rows[0];
    const canSeeGigs = row.is_identity_verified && !!row.paystack_recipient_code;

    return { canSeeGigs, isVerified: row.is_identity_verified, recipientCode: row.paystack_recipient_code };
}

async function loginArtisan(client, phonePrimary, password) {
    const sql = `
        SELECT id, password_hash, is_identity_verified, home_gps_address, paystack_recipient_code
        FROM artisan_profiles 
        WHERE phone_primary = $1;
    `;
    const result = await client.query(sql, [phonePrimary]);

    if (result.rows.length === 0) return null;

    const artisan = result.rows[0];
    const isPasswordValid = await comparePassword(password, artisan.password_hash);
    
    if (!isPasswordValid) return null;

    const token = jwt.sign({ id: artisan.id, role: 'artisan' }, JWT_SECRET, { expiresIn: '7d' });
    const canSeeGigs = artisan.is_identity_verified && !!artisan.paystack_recipient_code;

    return { artisanId: artisan.id, token: token, canSeeGigs: canSeeGigs };
}


/**
 * CLIENT LOGIC: Creates a new Client profile and hashes password.
 */
async function createClientProfile(client, phonePrimary, fullName, email, password, homeGpsAddress, homeLat, homeLon) {
    const passwordHash = await hashPassword(password); // Hash the client's password
    
    const sql = `
        INSERT INTO client_profiles (phone_primary, full_name, email, password_hash, home_gps_address, home_lat, home_lon)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id;
    `;
    
    try {
        const result = await client.query(sql, [
            phonePrimary, 
            fullName, 
            email, 
            passwordHash, 
            homeGpsAddress || null, 
            homeLat || null, 
            homeLon || null
        ]);
        return { clientId: result.rows[0].id };
    } catch (e) {
        if (e.code === '23505') {
            throw { code: '23505', message: "Client phone number or email already registered." }; 
        }
        throw e;
    }
}

/**
 * CLIENT LOGIC: Logs in a client and issues a JWT token. (NEW)
 */
async function loginClient(client, phonePrimary, password) {
    const sql = `
        SELECT id, password_hash
        FROM client_profiles 
        WHERE phone_primary = $1;
    `;
    const result = await client.query(sql, [phonePrimary]);

    if (result.rows.length === 0) return null;

    const clientProfile = result.rows[0];
    const isPasswordValid = await comparePassword(password, clientProfile.password_hash);
    
    if (!isPasswordValid) return null;

    // Issue token with role 'client'
    const token = jwt.sign({ id: clientProfile.id, role: 'client' }, JWT_SECRET, { expiresIn: '7d' });

    return { clientId: clientProfile.id, token: token };
}


/**
 * CLIENT LOGIC: Retrieves client email for Paystack initiation.
 */
async function getClientEmailById(client, clientId) {
    const sql = 'SELECT email FROM client_profiles WHERE id = $1';
    const result = await client.query(sql, [clientId]);
    if (result.rows.length === 0) {
        throw new Error("Client profile not found for payment initiation."); 
    }
    return result.rows[0].email;
}


// DEPRECATED: initializeMomoCodes() is no longer needed.
// Provider codes are now read from the database via momoProviderService.
// This function is kept for backward compatibility but does nothing.
async function initializeMomoCodes() {
    console.log("✅ MoMo provider codes are now read from database. Migration completed.");
}

async function changePassword(client, userId, role, oldPassword, newPassword) {
    const table = role === 'client' ? 'client_profiles' : 'artisan_profiles';
    
    // 1. Get current hash
    const sql = `SELECT password_hash FROM ${table} WHERE id = $1`;
    const result = await client.query(sql, [userId]);
    
    if (result.rows.length === 0) {
        throw new AppError("User not found.", 404);
    }
    
    const currentHash = result.rows[0].password_hash;
    
    // 2. Verify old password
    const valid = await comparePassword(oldPassword, currentHash);
    if (!valid) {
        throw new AppError("Incorrect current password.", 401);
    }
    
    // 3. Hash new password
    const newHash = await hashPassword(newPassword);
    
    // 4. Update
    await client.query(`UPDATE ${table} SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [newHash, userId]);
    
    return true;
}


module.exports = {
    verifyMomo, finalizeArtisanRegistration, loginArtisan,changePassword,
    finalizeArtisanIdentity, createClientProfile, loginClient, getClientEmailById,
    initializeMomoCodes, hashPassword, JWT_SECRET, TEMP_TOKEN_SECRET
};