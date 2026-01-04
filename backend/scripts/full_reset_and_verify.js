const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const EXPECTED_TABLES = [
    'accounts',
    'admin_audit_log',
    'admin_users',
    'analytics_events',
    'artisan_guarantors',
    'artisan_profiles',
    'artisan_reviews',
    'benefits_ledger',
    'client_profiles',
    'dispute_messages',
    'disputes',
    'financial_config',
    'job_artisan_acceptances',
    'job_quotes',
    'job_transactions',
    'momo_providers',
    'notifications',
    'postings',
    'quote_negotiations',
    'remittance_batch',
    'rivia_cards',
    'transactions',
    'withdrawal_requests'
].sort();

async function run() {
    const client = await pool.connect();
    try {
        console.log("🚀 Starting Full Database Reset...");

        // 1. Run SQL File
        const sqlPath = path.join(__dirname, '../zolid.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await client.query(sql);
        console.log("✅ Database reset and schema imported successfully.");

        // 2. Verify Tables
        console.log("\n🔍 Verifying Tables...");
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);

        const actualTables = res.rows.map(r => r.table_name).filter(t => t !== 'spatial_ref_sys'); // Filter out PostGIS if present
        const missing = EXPECTED_TABLES.filter(t => !actualTables.includes(t));
        const extra = actualTables.filter(t => !EXPECTED_TABLES.includes(t));

        console.log(`\nTotal Tables Found: ${actualTables.length}`);
        
        if (missing.length === 0 && extra.length === 0) {
            console.log("✅ SUCCESS: All 23 tables match exactly.");
        } else {
            if (missing.length > 0) console.error("❌ MISSING TABLES:", missing);
            if (extra.length > 0) console.warn("⚠️ EXTRA TABLES:", extra);
        }

        console.log("\n--- Table List ---");
        actualTables.forEach(t => console.log(`- ${t}`));

    } catch (err) {
        console.error("❌ Fatal Error:", err);
    } finally {
        client.release();
        pool.end();
    }
}

run();