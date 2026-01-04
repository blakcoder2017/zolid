// backend/scripts/testDbConnection.js
require('dotenv').config();
const db = require('../db/db');

const testDbConnection = async () => {
    try {
        console.log("🔍 Testing database connection...");
        console.log("Environment variables:");
        console.log("DB_HOST:", process.env.DB_HOST);
        console.log("DB_NAME:", process.env.DB_NAME);
        console.log("DB_USER:", process.env.DB_USER);
        console.log("DB_PASS:", process.env.DB_PASS ? "[REDACTED]" : "NOT SET");
        console.log("DB_PORT:", process.env.DB_PORT);
        
        const client = await db.getClient();
        
        try {
            const result = await client.query('SELECT NOW() as current_time');
            console.log("✅ Database connection successful!");
            console.log("Current database time:", result.rows[0].current_time);
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error("❌ Database connection failed:", error.message);
        console.error("Error details:", error);
    }
};

testDbConnection();