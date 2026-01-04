// backend/scripts/seedAdmin.js
const path = require('path');
// ✅ CRITICAL FIX: Explicitly point to the .env file in the parent directory
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const db = require('../db/db');
const bcrypt = require('bcrypt');

const seedAdmin = async () => {
    // Attempt to get a client. If DB connection fails, this will throw an error caught below.
    let client;
    try {
        client = await db.getClient();
        console.log("🌱 Starting Admin Seed...");

        // 1. Define the Super Admin credentials
        const email = "info@zolid.online";
        const password = "KillBird@2024";
        const fullName = "Abubakari Sherifdeen";
        const phone = "0552537904";

        // 2. Hash the password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 3. Define Permissions (Full Access)
        const permissions = {
            dashboard: true,
            users: true,
            jobs: true,
            finance: true,
            analytics: true,
            settings: true
        };

        // 4. Insert into Database
        const query = `
            INSERT INTO admin_users (email, password_hash, full_name, phone, role, permissions, is_active)
            VALUES ($1, $2, $3, $4, 'SUPER_ADMIN', $5, TRUE)
            ON CONFLICT (email) DO NOTHING
            RETURNING id;
        `;

        const res = await client.query(query, [email, passwordHash, fullName, phone, permissions]);

        if (res.rows.length > 0) {
            console.log("✅ Super Admin created successfully!");
            console.log(`📧 Email: ${email}`);
            console.log(`🔑 Password: ${password}`);
        } else {
            console.log("⚠️  Admin already exists. No changes made.");
        }

    } catch (error) {
        console.error("❌ Seeding failed:", error.message);
    } finally {
        if (client) client.release();
        // Force exit to close the pool connection
        process.exit();
    }
};

seedAdmin();