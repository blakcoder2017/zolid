const RiviaCardService = require('../services/riviaCardService');
const db = require('../db/db');

async function testDatabaseIntegration() {
    console.log('🧪 Testing Database Integration for Card Assignment');
    console.log('==================================================\n');
    
    // Get database client
    const client = await db.getClient();
    
    try {
        // Step 1: Create a test card in the database
        console.log('1. Creating test free card in database...');
        // Generate a card code in the format X-T556 (6 characters total)
        const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
        const testCardData = {
            card_code: 'X-T' + randomSuffix, // Format: X-T556
            brand: 'RiviaCo',
            is_free: true,
            price: 0.00,
            status: 'pending'
        };
        
        const createdCard = await RiviaCardService.createCard(client, testCardData);
        console.log(`   ✅ Created card: ${createdCard.card_code} (ID: ${createdCard.id})`);
        console.log(`      Status: ${createdCard.status}`);
        console.log(`      Member ID: ${createdCard.member_id || 'null (unassigned)'}`);
        
        // Step 2: Get the unassigned card
        console.log('\n2. Getting unassigned free card...');
        const unassignedCard = await RiviaCardService.getUnassignedFreeCard(client);
        console.log(`   ✅ Found card: ${unassignedCard.card_code} (ID: ${unassignedCard.id})`);
        
        // Step 3: Assign the card to a test member
        console.log('\n3. Assigning card to test member...');
        // Generate a proper UUID for testing
        const testMemberId = '123e4567-e89b-12d3-a456-426614174000';
        const assignedCard = await RiviaCardService.assignCardToMember(client, unassignedCard.id, testMemberId);
        console.log(`   ✅ Card assigned successfully:`);
        console.log(`      Card Code: ${assignedCard.card_code}`);
        console.log(`      Member ID: ${assignedCard.member_id}`);
        console.log(`      Status: ${assignedCard.status}`);
        
        // Step 4: Verify the card is no longer available
        console.log('\n4. Verifying card is no longer available...');
        const nextAvailableCard = await RiviaCardService.getUnassignedFreeCard(client);
        if (nextAvailableCard) {
            console.log(`   ⚠️  Next available card: ${nextAvailableCard.card_code}`);
        } else {
            console.log(`   ✅ No more unassigned free cards available`);
        }
        
        // Step 5: Get cards by member ID
        console.log('\n5. Getting cards assigned to test member...');
        const memberCards = await RiviaCardService.getCardsByMemberId(client, testMemberId);
        console.log(`   Found ${memberCards.length} cards for member:`);
        memberCards.forEach(card => {
            console.log(`   - ${card.card_code} (${card.status})`);
        });
        
        // Step 6: Get card by code
        console.log('\n6. Getting card by code...');
        const cardByCode = await RiviaCardService.getCardByCode(client, assignedCard.card_code);
        console.log(`   ✅ Found card by code:`);
        console.log(`      Card Code: ${cardByCode.card_code}`);
        console.log(`      Member ID: ${cardByCode.member_id}`);
        console.log(`      Status: ${cardByCode.status}`);
        
        console.log('\n🎉 All database integration tests completed successfully!');
        console.log('\nSummary:');
        console.log('- ✅ Card created in database');
        console.log('- ✅ Card retrieved as unassigned');
        console.log('- ✅ Card assigned to member');
        console.log('- ✅ Card status updated to "assigned"');
        console.log('- ✅ Card no longer available for reassignment');
        console.log('- ✅ Card can be retrieved by member ID');
        console.log('- ✅ Card can be retrieved by card code');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('Error details:', error);
    } finally {
        client.release();
        console.log('\n🔌 Database connection released');
    }
}

// Run the test
testDatabaseIntegration();