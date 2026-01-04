// backend/scripts/migrateArtisansToFreePlan.js
require('dotenv').config();
const db = require('../db/db');
const riviaService = require('../services/riviacoService');

const migrateArtisansToFreePlan = async () => {
    const client = await db.getClient();
    
    try {
        console.log("🚀 Starting Artisan Migration to Rivia Free Plan...");
        
        // 1. Get Zolid channel ID - try email format first, then fallback to UUID
        let channelId = "info@zolid.online"; // Use email format as suggested by user
        if (process.env.RIVIA_CHANNEL_ID) {
            channelId = process.env.RIVIA_CHANNEL_ID;
        }
        console.log(`📡 Using Rivia Channel ID: ${channelId}`);
        
        // 2. Retrieve all available cards for the Zolid channel
        console.log("🔍 Retrieving available cards from Rivia...");
        const cardsResponse = await riviaService.getChannelCards(channelId);
        console.log("📥 Rivia API response:", JSON.stringify(cardsResponse, null, 2));
        
        // Extract only unassigned cards (cards without a member)
        const availableCards = cardsResponse.data
            ? cardsResponse.data.filter(card => !card.member || !card.member.id)
            : [];
        
        if (availableCards.length === 0) {
            console.log("⚠️  No available cards found in Rivia for this channel.");
            return;
        }
        
        console.log(`📋 Found ${availableCards.length} available cards in Rivia`);
        
        // 3. Fetch artisans who don't have a Rivia membership yet
        const query = `
            SELECT id, full_name, phone_primary, email
            FROM artisan_profiles
            WHERE riviaco_member_id IS NULL OR riviaco_card_code IS NULL
            ORDER BY created_at ASC
            LIMIT ${availableCards.length}
        `;
        
        const result = await client.query(query);
        const artisans = result.rows;
        
        if (artisans.length === 0) {
            console.log("✅ No artisans need migration. All artisans already have Rivia memberships.");
            return;
        }
        
        console.log(`👥 Found ${artisans.length} artisans to migrate to Rivia Free Plan`);
        
        // 4. Process each artisan with available cards
        for (let i = 0; i < Math.min(artisans.length, availableCards.length); i++) {
            const artisan = artisans[i];
            const card = availableCards[i];
            
            try {
                console.log(`\n🔄 Processing artisan: ${artisan.full_name} (${artisan.phone_primary})`);
                console.log(`   Assigning card: ${card.code}`);
                
                // Split full name into first and last names
                const nameParts = artisan.full_name.trim().split(' ');
                const firstName = nameParts[0];
                const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
                
                // 5. Activate the card for this artisan
                const activationResult = await riviaService.activateCard(
                    card.code,
                    artisan.phone_primary,
                    firstName,
                    lastName,
                    artisan.email
                );
                
                console.log(`✅ Card activated successfully!`);
                console.log(`   Member ID: ${activationResult.data.patient.id}`);
                console.log(`   Card Code: ${activationResult.data.code}`);
                
                // 6. Update artisan record with Rivia information
                const updateQuery = `
                    UPDATE artisan_profiles
                    SET
                        riviaco_member_id = $1,
                        riviaco_card_code = $2,
                        riviaco_plan = 'FREE',
                        riviaco_enrollment_date = NOW()
                    WHERE id = $3
                `;
                
                await client.query(updateQuery, [
                    activationResult.data.patient.id,
                    activationResult.data.code,
                    artisan.id
                ]);
                
                console.log(`📝 Database updated with Rivia membership information`);
                
            } catch (error) {
                console.error(`❌ Failed to migrate artisan ${artisan.full_name}:`, error.message);
                // Continue with next artisan even if one fails
                continue;
            }
        }
        
        console.log("\n✅ Artisan migration to Rivia Free Plan completed!");
        console.log(`📊 Successfully migrated ${Math.min(artisans.length, availableCards.length)} artisans`);
        
        if (artisans.length > availableCards.length) {
            console.log(`⚠️  Warning: ${artisans.length - availableCards.length} artisans remain without cards (need more cards)`);
        }
        
    } catch (error) {
        console.error("❌ Migration failed:", error);
    } finally {
        client.release();
        process.exit();
    }
};

migrateArtisansToFreePlan();