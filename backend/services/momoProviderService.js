/**
 * Mobile Money Provider Service
 * * Manages mobile money provider codes stored in the database.
 * Replaces hardcoded provider codes with database-driven lookups.
 */

const { Pool } = require('pg');

// Database connection config
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
});

/**
 * Gets the Paystack provider code for a given provider name and country
 * @param {string} providerName - Provider name (e.g., 'MTN', 'VODAFONE', 'TELECEL', 'Airtel Money')
 * @param {string} country - Country name (default: 'Ghana')
 * @returns {Promise<string|null>} The provider code (e.g., 'mtn', 'atl', 'vod') or null if not found
 */
async function getProviderCode(providerName, country = 'Ghana') {
    if (!providerName) return null;
    
    const client = await pool.connect();
    try {
        // Normalize provider name for lookup (handle variations)
        const normalizedName = normalizeProviderName(providerName);
        
        const query = `
            SELECT provider_code 
            FROM momo_providers 
            WHERE provider_name = $1 
            AND country = $2 
            AND is_active = TRUE
            LIMIT 1
        `;
        
        const result = await client.query(query, [normalizedName, country]);
        
        if (result.rows.length > 0) {
            return result.rows[0].provider_code;
        }
        
        // If not found with exact match, try case-insensitive search
        const caseInsensitiveQuery = `
            SELECT provider_code 
            FROM momo_providers 
            WHERE UPPER(provider_name) = UPPER($1) 
            AND country = $2 
            AND is_active = TRUE
            LIMIT 1
        `;
        
        const caseInsensitiveResult = await client.query(caseInsensitiveQuery, [providerName, country]);
        
        if (caseInsensitiveResult.rows.length > 0) {
            return caseInsensitiveResult.rows[0].provider_code;
        }
        
        return null;
    } catch (error) {
        console.error('Error fetching provider code from database:', error);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Normalizes provider names to handle variations and aliases
 * @param {string} providerName - Raw provider name
 * @returns {string} Normalized provider name matching DB records
 */
function normalizeProviderName(providerName) {
    if (!providerName) return providerName;
    
    const upperName = providerName.toUpperCase().trim();
    
    // Handle common variations
    // 1. MTN
    if (upperName.includes('MTN')) return 'MTN';
    
    // 2. Telecel (Legacy: Vodafone)
    // Maps legacy 'VODAFONE' or new 'TELECEL' to the database entry 'Telecel'
    if (upperName.includes('VODAFONE') || upperName.includes('TELECEL')) {
        return 'Telecel';
    }
    
    // 3. AT (Legacy: AirtelTigo)
    // Maps legacy 'AIRTEL', 'TIGO', 'ATMONEY' to the database entry 'AT'
    if (upperName.includes('AIRTEL') || upperName.includes('TIGO') || upperName.includes('AT') || upperName.includes('AT MONEY')) {
        return 'AT';
    }
    
    // Other regions/providers
    if (upperName.includes('M-PESA') || upperName === 'MPESA') return 'M-PESA';
    if (upperName.includes('ORANGE')) return 'Orange';
    if (upperName.includes('WAVE')) return 'Wave';
    
    // Return as-is if no match
    return providerName;
}

/**
 * Gets all active providers for a given country
 * @param {string} country - Country name (default: 'Ghana')
 * @returns {Promise<Array>} Array of provider objects
 */
async function getAllProviders(country = 'Ghana') {
    const client = await pool.connect();
    try {
        const query = `
            SELECT provider_name, provider_code, country
            FROM momo_providers 
            WHERE country = $1 
            AND is_active = TRUE
            ORDER BY provider_name
        `;
        
        const result = await client.query(query, [country]);
        return result.rows;
    } catch (error) {
        console.error('Error fetching providers from database:', error);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Gets provider code using a database client (for use within transactions)
 * @param {object} client - PostgreSQL client from a transaction
 * @param {string} providerName - Provider name
 * @param {string} country - Country name (default: 'Ghana')
 * @returns {Promise<string|null>} The provider code or null if not found
 */
async function getProviderCodeWithClient(client, providerName, country = 'Ghana') {
    if (!providerName) return null;
    
    try {
        const normalizedName = normalizeProviderName(providerName);
        
        const query = `
            SELECT provider_code 
            FROM momo_providers 
            WHERE provider_name = $1 
            AND country = $2 
            AND is_active = TRUE
            LIMIT 1
        `;
        
        const result = await client.query(query, [normalizedName, country]);
        
        if (result.rows.length > 0) {
            return result.rows[0].provider_code;
        }
        
        // Try case-insensitive
        const caseInsensitiveQuery = `
            SELECT provider_code 
            FROM momo_providers 
            WHERE UPPER(provider_name) = UPPER($1) 
            AND country = $2 
            AND is_active = TRUE
            LIMIT 1
        `;
        
        const caseInsensitiveResult = await client.query(caseInsensitiveQuery, [providerName, country]);
        
        if (caseInsensitiveResult.rows.length > 0) {
            return caseInsensitiveResult.rows[0].provider_code;
        }
        
        return null;
    } catch (error) {
        console.error('Error fetching provider code from database:', error);
        throw error;
    }
}

module.exports = {
    getProviderCode,
    getAllProviders,
    getProviderCodeWithClient,
    normalizeProviderName
};