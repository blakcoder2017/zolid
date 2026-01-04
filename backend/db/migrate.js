const { Pool } = require('pg');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Load DB configuration from .env
const config = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
};

async function runMigration(migrationFile) {
    console.log(`🚀 Running migration: ${migrationFile}...`);
    const pool = new Pool(config);

    try {
        const client = await pool.connect();
        
        const migrationPath = path.join(__dirname, 'migrations', migrationFile);
        
        if (!fs.existsSync(migrationPath)) {
            throw new Error(`Migration file not found: ${migrationPath}`);
        }
        
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        await client.query(migrationSQL);
        
        console.log(`✅ Migration ${migrationFile} completed successfully.`);
        
        client.release();
    } catch (error) {
        console.error(`❌ Migration failed: ${migrationFile}`);
        console.error("Error details:", error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

// Get migration file from command line argument
const migrationFile = process.argv[2];

if (!migrationFile) {
    console.error("Usage: node db/migrate.js <migration-file.sql>");
    console.error("Example: node db/migrate.js add_profile_picture_column.sql");
    process.exit(1);
}

runMigration(migrationFile)
    .then(() => {
        console.log("🎉 Migration complete!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Migration failed:", error);
        process.exit(1);
    });
