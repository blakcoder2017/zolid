const db = require('../db/db');

// Global configuration object loaded on startup
let financialConfig = null;

/**
 * Loads the active financial configuration (fees, commissions) from the database.
 * This should run once during application startup.
 */
async function loadFinancialConfig() {
    console.log("🛠️ Loading financial configuration...");
    const sql = `
        SELECT platform_commission_percent, warranty_fee_percent, riviaco_premium_pesewas
        FROM financial_config
        WHERE is_active = TRUE
        LIMIT 1;
    `;
    
    let client;
    try {
        client = await db.getClient();
        const result = await client.query(sql);
        
        if (result.rows.length === 0) {
            throw new Error("FATAL: No active financial configuration found in DB.");
        }
        
        // Convert string/numeric fields to correct types
        const config = result.rows[0];
        
        financialConfig = {
            PLATFORM_COMMISSION_PERCENT: parseFloat(config.platform_commission_percent),
            WARRANTY_FEE_PERCENT: parseFloat(config.warranty_fee_percent),
            RIVIACO_PREMIUM_PESEWAS: parseInt(config.riviaco_premium_pesewas, 10),
        };
        
        console.log("✅ Financial configuration loaded successfully.");
        console.log("Active Fees:", financialConfig);

    } catch (error) {
        console.error("FATAL ERROR in configService:", error.message);
        // Fallback to hardcoded safe values if DB fetch fails
        financialConfig = {
            PLATFORM_COMMISSION_PERCENT: 0.05, // 5% platform commission
            WARRANTY_FEE_PERCENT: 0.15, // 15% warranty fee (markup)
            RIVIACO_PREMIUM_PESEWAS: 2000, // GHS 20.00 (fallback, but now uses 5% of quote)
        };
    } finally {
        if (client) client.release();
    }
}

/**
 * Retrieves the currently loaded configuration.
 */
function getConfig() {
    if (!financialConfig) {
        // Should only happen if loadFinancialConfig failed completely
        throw new Error("Financial configuration not initialized.");
    }
    return financialConfig;
}

module.exports = {
    loadFinancialConfig,
    getConfig
};