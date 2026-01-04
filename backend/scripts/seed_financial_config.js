const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../db/db');

async function seedFinancialConfig() {
    console.log("🌱 Seeding Financial Configuration...");
    
    const client = await db.getClient();
    
    try {
        // 1. Check if config already exists to avoid duplicates
        const checkRes = await client.query('SELECT count(*) FROM financial_config WHERE is_active = TRUE');
        const count = parseInt(checkRes.rows[0].count);

        if (count > 0) {
            console.log("⚠️  Active financial configuration already exists. Skipping seed.");
            return;
        }

        // 2. Insert Default Config
        // Values from schema.sql: 
        // - 5% Platform Commission (0.05)
        // - 15% Warranty Fee (0.15)
        // - 2000 Pesewas RiviaCo Premium (GHS 20.00)
        const insertQuery = `
            INSERT INTO financial_config 
            (platform_commission_percent, warranty_fee_percent, riviaco_premium_pesewas, is_active)
            VALUES ($1, $2, $3, TRUE)
            RETURNING id;
        `;
        
        const values = [0.08, 0.15, 2000];
        
        await client.query(insertQuery, values);
        
        console.log("✅ Financial configuration seeded successfully!");
        console.log("   - Platform Commission: 8%");
        console.log("   - Warranty Fee: 15%");
        console.log("   - RiviaCo Premium: 2000 pesewas");

    } catch (error) {
        console.error("❌ Seeding failed:", error.message);
    } finally {
        if (client) client.release();
        // Force exit to close the pool connection
        process.exit();
    }
}

seedFinancialConfig();