const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Load DB configuration from .env
const config = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
};

// Load DDL from the schema.sql file
const DDL_PATH = path.join(__dirname, 'schema.sql');
const DDL_SCHEMA = fs.readFileSync(DDL_PATH, 'utf8');

// Import the finance setup function for the Chart of Accounts
const { setupChartOfAccounts } = require('../services/financeService');

async function runSetup() {
    console.log("🚀 Starting ZOLID Systems Database Setup...");
    const pool = new Pool(config);

    try {
        const client = await pool.connect();
        
        // 1. Execute Schema DDL (Create Tables, ENUMs, Functions/Triggers)
        console.log("1. Executing Schema DDL from schema.sql...");
        
        // FIX: Execute DDL as a single block to correctly parse functions and triggers
        // The pg driver can handle multi-command strings.
        await client.query(DDL_SCHEMA);
        
        console.log("✅ Schema DDL executed successfully.");

        // 2. Setup Chart of Accounts (F.S.1 Integrity)
        console.log("2. Initializing Chart of Accounts...");
        await setupChartOfAccounts(client);
        console.log("✅ Chart of Accounts initialized successfully.");

        client.release();
        console.log("🎉 Database setup complete! You can now run 'npm start'.");

    } catch (error) {
        console.error("❌ FATAL: Database setup failed.");
        console.error("Error details:", error.message);
        console.error("Action Required: Ensure the PostgreSQL server is running and accessible with the credentials in .env.");
    } finally {
        await pool.end();
    }
}

runSetup();