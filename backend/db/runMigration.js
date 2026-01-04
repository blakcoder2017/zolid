// Load environment variables from .env file in backend root BEFORE requiring db
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const db = require('./db');
const fs = require('fs');

async function runMigration(migrationFile) {
  const client = await db.pool.connect();
  
  try {
    console.log(`\n📦 Running migration: ${migrationFile}`);
    console.log('─'.repeat(60));
    
    const migrationPath = path.join(__dirname, 'migrations', migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    await client.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('─'.repeat(60));
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

const migrationFile = process.argv[2] || '002_add_quote_system.sql';

runMigration(migrationFile)
  .then(() => {
    console.log('\n🎉 All migrations completed!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n💥 Migration error:', err.message);
    process.exit(1);
  });
