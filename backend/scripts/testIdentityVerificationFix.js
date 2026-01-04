const { pool } = require('../db/db');
const identityService = require('../services/identityService');
const jwt = require('jsonwebtoken');

async function testIdentityVerification() {
    console.log('🧪 Testing identity verification fix...');
    
    const client = await pool.connect();
    
    try {
        // Start a transaction
        await client.query('BEGIN');
        console.log('✅ Transaction started');
        
        // Simulate the identity verification process
        const artisanId = 'test_artisan_id_12345678'; // This should be a real artisan ID in your test database
        const ghCardNumber = 'GHA-123456789-1';
        const homeGpsAddress = '5.6037, -0.1870';
        const primaryTrade = 'Electrician';
        const primaryLanguage = 'English';
        
        console.log('📝 Updating artisan profile...');
        
        // This simulates the update that was causing the idle-in-transaction timeout
        const updateSql = `
            UPDATE artisan_profiles
            SET gh_card_number = $1,
                primary_trade = $2,
                primary_language = $3,
                home_gps_address = $4,
                is_identity_verified = $5,
                updated_at = NOW()
            WHERE id = $6
            RETURNING id, gh_card_number, home_gps_address, primary_trade, primary_language,
                      is_identity_verified, paystack_recipient_code, gh_card_image_url
        `;
        
        const result = await client.query(updateSql, [
            String(ghCardNumber).trim(),
            String(primaryTrade).trim(),
            String(primaryLanguage).trim(),
            String(homeGpsAddress).trim(),
            true,
            artisanId
        ]);
        
        console.log('✅ Profile updated successfully');
        
        // Commit the transaction
        await client.query('COMMIT');
        console.log('✅ Transaction committed');
        
        // Now test that we can do additional queries without idle-in-transaction timeout
        console.log('🔍 Testing post-transaction queries...');
        
        // This should work without causing idle-in-transaction timeout
        const checkSql = `SELECT is_identity_verified FROM artisan_profiles WHERE id = $1`;
        const checkResult = await client.query(checkSql, [artisanId]);
        
        console.log('✅ Post-transaction query successful');
        console.log('📋 Verification status:', checkResult.rows[0].is_identity_verified);
        
        // Release the client back to the pool
        client.release();
        console.log('✅ Client released back to pool');
        
        console.log('🎉 Test completed successfully! The fix should prevent idle-in-transaction timeouts.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        // Rollback on error
        try {
            await client.query('ROLLBACK');
            console.log('✅ Transaction rolled back');
        } catch (rollbackError) {
            console.error('❌ Error during rollback:', rollbackError.message);
        }
        
        client.release();
        process.exit(1);
    }
}

// Run the test
testIdentityVerification().catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
});