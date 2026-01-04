const { Pool } = require('pg');
require('dotenv').config();
const PaystackService = require('../services/paystackService');
const momoProviderService = require('../services/momoProviderService');
const { e164ToLocal } = require('../utils/phoneUtils');

const config = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
};

async function fixArtisanRecipientCode(artisanId) {
    const pool = new Pool(config);
    
    try {
        const client = await pool.connect();
        
        // Get artisan profile
        const profileSql = `
            SELECT 
                id,
                phone_primary,
                full_name,
                momo_network,
                is_momo_verified,
                paystack_resolved_name,
                paystack_recipient_code,
                gh_card_number,
                home_gps_address,
                is_identity_verified,
                primary_trade,
                primary_language
            FROM artisan_profiles
            WHERE id = $1
        `;
        const profileResult = await client.query(profileSql, [artisanId]);
        
        if (profileResult.rows.length === 0) {
            console.error(`❌ Artisan not found: ${artisanId}`);
            process.exit(1);
        }
        
        const profile = profileResult.rows[0];
        console.log('📋 Current Artisan Profile:');
        console.log(JSON.stringify(profile, null, 2));
        
        // Check if recipient code already exists (allow force update with --force flag)
        const forceUpdate = process.argv.includes('--force');
        if (profile.paystack_recipient_code && !forceUpdate) {
            console.log(`✅ Recipient code already exists: ${profile.paystack_recipient_code}`);
            console.log(`   Use --force flag to update it: node scripts/fix_artisan_recipient_code.js ${artisanId} --force`);
            client.release();
            await pool.end();
            return;
        }
        
        if (forceUpdate && profile.paystack_recipient_code) {
            console.log(`⚠️ Force updating existing recipient code: ${profile.paystack_recipient_code}`);
        }
        
        // Check required fields
        if (!profile.phone_primary || !profile.full_name || !profile.momo_network) {
            console.error('❌ Missing required fields for recipient creation:');
            console.error(`  - phone_primary: ${profile.phone_primary}`);
            console.error(`  - full_name: ${profile.full_name}`);
            console.error(`  - momo_network: ${profile.momo_network}`);
            client.release();
            await pool.end();
            process.exit(1);
        }
        
        // Get provider code from database (default to Ghana)
        const isDevelopment = process.env.ENVIRONMENT === 'development' || process.env.NODE_ENV === 'development';
        let bankCode = null;
        
        try {
            // Get provider code from database
            bankCode = await momoProviderService.getProviderCode(profile.momo_network, 'Ghana');
            if (bankCode) {
                console.log(`✅ Found provider code for ${profile.momo_network}: ${bankCode}`);
            } else {
                throw new Error(`Provider code not found in database for network: ${profile.momo_network}`);
            }
        } catch (error) {
            console.warn(`⚠️ Failed to get provider code from database: ${error.message}`);
            // In development, fallback to mock code
            if (isDevelopment) {
                console.log('⚠️ DEVELOPMENT MODE: Will use mock recipient code');
                bankCode = null; // Will trigger mock code creation
            } else {
                console.error('❌ Cannot proceed without valid provider code in production mode');
                throw error;
            }
        }
        
        let recipientCode = null;
        
        try {
            if (isDevelopment && (!process.env.PAYSTACK_SECRET_KEY || !bankCode)) {
                // Development mode: Create a mock recipient code
                console.log('⚠️ DEVELOPMENT MODE: Using mock recipient code (Paystack not configured or bank code unavailable)');
                recipientCode = `MOCK_RECIPIENT_${artisanId.substring(0, 8)}`;
            } else {
                // Use paystack_resolved_name if available, otherwise use full_name
                const recipientName = profile.paystack_resolved_name || profile.full_name;
                
                // Paystack expects phone number in LOCAL format (without country code) for mobile money
                // Convert from E.164 (+233244121910) to local format (0244121910)
                const accountNumber = e164ToLocal(profile.phone_primary);
                
                console.log(`🔄 Creating Paystack recipient for: ${recipientName}`);
                console.log(`   Phone (E.164): ${profile.phone_primary}, Local: ${accountNumber}`);
                console.log(`   Network: ${profile.momo_network}, Bank Code: ${bankCode}`);
                
                const recipientResult = await PaystackService.createTransferRecipient(
                    recipientName,
                    accountNumber,
                    bankCode
                );
                recipientCode = recipientResult.recipient_code;
                console.log(`✅ Paystack recipient created: ${recipientCode}`);
            }
            
            // Update profile with recipient code
            const updateSql = `
                UPDATE artisan_profiles 
                SET paystack_recipient_code = $1, updated_at = NOW()
                WHERE id = $2
                RETURNING paystack_recipient_code
            `;
            const updateResult = await client.query(updateSql, [recipientCode, artisanId]);
            
            console.log(`✅ Artisan profile updated with recipient code: ${updateResult.rows[0].paystack_recipient_code}`);
            
        } catch (error) {
            console.error('❌ Error creating recipient code:', error.message);
            
            // If Paystack fails in development, use mock code as fallback
            if (isDevelopment) {
                console.log('⚠️ Using mock recipient code as fallback');
                recipientCode = `MOCK_RECIPIENT_${artisanId.substring(0, 8)}`;
                
                const updateSql = `
                    UPDATE artisan_profiles 
                    SET paystack_recipient_code = $1, updated_at = NOW()
                    WHERE id = $2
                    RETURNING paystack_recipient_code
                `;
                await client.query(updateSql, [recipientCode, artisanId]);
                console.log(`✅ Updated with mock recipient code: ${recipientCode}`);
            } else {
                throw error;
            }
        }
        
        client.release();
        await pool.end();
        
        console.log('🎉 Done!');
        
    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Get artisan ID from command line
const artisanId = process.argv[2];

if (!artisanId) {
    console.error('Usage: node scripts/fix_artisan_recipient_code.js <artisan-id>');
    console.error('Example: node scripts/fix_artisan_recipient_code.js 0fea3482-a77e-489b-8a47-d062458ecf34');
    process.exit(1);
}

fixArtisanRecipientCode(artisanId);
