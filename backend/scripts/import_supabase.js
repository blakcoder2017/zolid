const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Configuration
const DUMP_FILE = path.join(__dirname, '../zolid.sql');
const CONNECTION_STRING = process.env.DATABASE_URL;

// Validation
if (!CONNECTION_STRING) {
    console.error('❌ Error: DATABASE_URL is missing in backend/.env');
    process.exit(1);
}

if (!fs.existsSync(DUMP_FILE)) {
    console.error(`❌ Error: Dump file not found at: ${DUMP_FILE}`);
    console.error('   Please ensure "zolid.sql" is in the backend root folder.');
    process.exit(1);
}

// Log Safe Info
const dbHost = CONNECTION_STRING.split('@')[1]?.split(':')[0] || 'Unknown Host';
console.log('🚀 Starting Database Import...');
console.log(`📄 Source: ${path.basename(DUMP_FILE)}`);
console.log(`🎯 Target: ${dbHost} (Supabase)`);

// Execute psql using spawn (Better for large files/output than exec)
// Usage: psql "connection_string" -f "file.sql"
const psql = spawn('psql', [CONNECTION_STRING, '-f', DUMP_FILE], {
    stdio: 'inherit', // Pipes output directly to console so you see real-time progress
    shell: true       // Helps with path resolution on some systems
});

psql.on('error', (err) => {
    console.error('❌ Failed to start psql process.');
    console.error('   Ensure PostgreSQL client tools are installed on your machine.');
    console.error(`   Error: ${err.message}`);
});

psql.on('close', (code) => {
    if (code === 0) {
        console.log('\n✅ Import Completed Successfully!');
    } else {
        console.error(`\n❌ Import process exited with code ${code}`);
        console.log('   (Some errors like "role does not exist" are normal when migrating to Supabase)');
    }
});