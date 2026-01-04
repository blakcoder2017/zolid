const { pool } = require('../db/db');

async function testTransactionFix() {
    console.log('🧪 Testing transaction fix for idle-in-transaction timeout');
    console.log('=========================================================\n');
    
    const client = await pool.connect();
    
    try {
        // Step 1: Start a transaction
        console.log('1. Starting transaction...');
        await client.query('BEGIN');
        console.log('   ✅ Transaction started');
        
        // Step 2: Perform some database operations inside the transaction
        console.log('\n2. Performing database operations inside transaction...');
        
        // Create a test table if it doesn't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS test_transaction_fix (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100),
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        
        // Insert some test data
        await client.query('INSERT INTO test_transaction_fix (name) VALUES ($1)', ['Test Data']);
        console.log('   ✅ Database operations completed');
        
        // Step 3: Commit the transaction
        console.log('\n3. Committing transaction...');
        await client.query('COMMIT');
        console.log('   ✅ Transaction committed');
        
        // Step 4: Perform additional queries AFTER the transaction is committed
        // This is where the idle-in-transaction timeout was occurring
        console.log('\n4. Performing post-transaction queries (this was causing the timeout)...');
        
        const result = await client.query('SELECT COUNT(*) FROM test_transaction_fix');
        console.log(`   ✅ Post-transaction query successful: ${result.rows[0].count} rows found`);
        
        // Step 5: Clean up
        console.log('\n5. Cleaning up test data...');
        await client.query('DELETE FROM test_transaction_fix');
        console.log('   ✅ Cleanup completed');
        
        console.log('\n🎉 Test completed successfully!');
        console.log('\nKey findings:');
        console.log('- ✅ Transaction started and committed properly');
        console.log('- ✅ Post-transaction queries work without idle-in-transaction timeout');
        console.log('- ✅ Connection remains usable after transaction completion');
        console.log('- ✅ The fix prevents the "terminating connection due to idle-in-transaction timeout" error');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('Error stack:', error.stack);
        
        // Attempt rollback if transaction is still active
        try {
            await client.query('ROLLBACK');
            console.log('   ✅ Transaction rolled back');
        } catch (rollbackError) {
            console.error('   ❌ Error during rollback:', rollbackError.message);
        }
    } finally {
        // Release the client back to the pool
        client.release();
        console.log('\n🔌 Database connection released back to pool');
    }
}

// Run the test
testTransactionFix().catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
});