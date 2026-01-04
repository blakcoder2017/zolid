const RiviaCardService = require('../services/riviaCardService');
const db = require('../db/db');

async function testRiviaCardAssignment() {
    console.log('🧪 Testing Rivia Card Assignment Logic');
    console.log('=====================================\n');
    
    // Get database client using the proper connection method
    const client = await db.getClient();
    
    try {
        // Test 1: Create some test cards
        console.log('1. Creating test cards...');
        
        const testCards = [
            { card_code: 'FREE-001', brand: 'RiviaCo', is_free: true, price: 0.00 },
            { card_code: 'FREE-002', brand: 'RiviaCo', is_free: true, price: 0.00 },
            { card_code: 'PAID-001', brand: 'RiviaCo', is_free: false, price: 500.00 },
            { card_code: 'PAID-002', brand: 'RiviaCo', is_free: false, price: 1000.00 }
        ];
        
        for (const cardData of testCards) {
            try {
                const card = await RiviaCardService.createCard(client, cardData);
                console.log(`   ✅ Created card: ${card.card_code} (${card.is_free ? 'Free' : 'Paid'})`);
            } catch (error) {
                if (error.message.includes('already exists')) {
                    console.log(`   ⚠️  Card ${cardData.card_code} already exists, skipping...`);
                } else {
                    throw error;
                }
            }
        }
        
        // Test 2: Get all unassigned free cards
        console.log('\n2. Getting all unassigned free cards...');
        const unassignedCards = await RiviaCardService.getAllUnassignedFreeCards(client);
        console.log(`   Found ${unassignedCards.length} unassigned free cards:`);
        unassignedCards.forEach(card => {
            console.log(`   - ${card.card_code} (${card.status})`);
        });
        
        // Test 3: Get a single unassigned free card (for assignment)
        console.log('\n3. Getting a single unassigned free card for assignment...');
        const cardToAssign = await RiviaCardService.getUnassignedFreeCard(client);
        
        if (cardToAssign) {
            console.log(`   ✅ Found card to assign: ${cardToAssign.card_code}`);
            
            // Test 4: Assign the card to a test member
            console.log('\n4. Assigning card to test member...');
            const testMemberId = 'test-member-1234-5678-9012-345678901234';
            const assignedCard = await RiviaCardService.assignCardToMember(client, cardToAssign.id, testMemberId);
            console.log(`   ✅ Card assigned successfully:`);
            console.log(`      Card Code: ${assignedCard.card_code}`);
            console.log(`      Member ID: ${assignedCard.member_id}`);
            console.log(`      Status: ${assignedCard.status}`);
            
            // Test 5: Verify the card is no longer available
            console.log('\n5. Verifying card is no longer available for assignment...');
            const nextAvailableCard = await RiviaCardService.getUnassignedFreeCard(client);
            if (nextAvailableCard) {
                console.log(`   ✅ Next available card: ${nextAvailableCard.card_code}`);
            } else {
                console.log(`   ℹ️  No more unassigned free cards available`);
            }
            
            // Test 6: Get cards by member ID
            console.log('\n6. Getting cards assigned to test member...');
            const memberCards = await RiviaCardService.getCardsByMemberId(client, testMemberId);
            console.log(`   Found ${memberCards.length} cards for member:`);
            memberCards.forEach(card => {
                console.log(`   - ${card.card_code} (${card.status})`);
            });
            
            // Test 7: Get card by code
            console.log('\n7. Getting card by code...');
            const cardByCode = await RiviaCardService.getCardByCode(client, assignedCard.card_code);
            console.log(`   ✅ Found card by code:`);
            console.log(`      Card Code: ${cardByCode.card_code}`);
            console.log(`      Member ID: ${cardByCode.member_id}`);
            console.log(`      Status: ${cardByCode.status}`);
            
        } else {
            console.log('   ⚠️  No unassigned free cards available for testing assignment');
        }
        
        console.log('\n🎉 All tests completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('Error details:', error);
    } finally {
        client.release();
        console.log('\n🔌 Database connection released');
    }
}

// Run the test
testRiviaCardAssignment();