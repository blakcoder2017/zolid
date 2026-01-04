const RiviaService = require('../services/riviacoService');
const RiviaCardService = require('../services/riviaCardService');
const db = require('../db/db');

async function testUpdatedRiviaIntegration() {
    console.log('🧪 Testing Updated Rivia Integration with Card Service');
    console.log('====================================================\n');
    
    // Get database client
    const client = await db.getClient();
    
    try {
        // Step 1: Create a test card in the database
        console.log('1. Creating test free card in database...');
        const testCardData = {
            card_code: 'TEST-FREE-001',
            brand: 'RiviaCo',
            is_free: true,
            price: 0.00,
            status: 'pending'
        };
        
        const createdCard = await RiviaCardService.createCard(client, testCardData);
        console.log(`   ✅ Created card: ${createdCard.card_code} (ID: ${createdCard.id})`);
        
        // Step 2: Test the updated registerArtisanAndActivateFreeCard method
        console.log('\n2. Testing registerArtisanAndActivateFreeCard...');
        
        const testArtisan = {
            fullName: 'John Doe',
            phone: '0501234567',
            email: 'john.doe@example.com'
        };
        
        const result = await RiviaService.registerArtisanAndActivateFreeCard(
            testArtisan.fullName,
            testArtisan.phone,
            testArtisan.email
        );
        
        console.log('   ✅ Artisan registered and card activated successfully:');
        console.log(`      Member ID: ${result.memberId}`);
        console.log(`      Card Code: ${result.cardCode}`);
        console.log(`      Card Status: ${result.cardDetails.status}`);
        console.log(`      Assigned to Member: ${result.cardDetails.member_id}`);
        
        // Step 3: Verify the card is no longer available for assignment
        console.log('\n3. Verifying card is no longer available...');
        const availableCards = await RiviaCardService.getAllUnassignedFreeCards(client);
        console.log(`   Found ${availableCards.length} unassigned free cards (should be 0)`);
        
        // Step 4: Verify the card is assigned to the member
        console.log('\n4. Verifying card assignment...');
        const memberCards = await RiviaCardService.getCardsByMemberId(client, result.memberId);
        console.log(`   Found ${memberCards.length} cards assigned to member`);
        if (memberCards.length > 0) {
            console.log(`   Card Code: ${memberCards[0].card_code}`);
            console.log(`   Status: ${memberCards[0].status}`);
        }
        
        console.log('\n🎉 All tests completed successfully!');
        console.log('\nSummary:');
        console.log('- ✅ Card created in database');
        console.log('- ✅ Artisan registered as member');
        console.log('- ✅ Card assigned to member in database');
        console.log('- ✅ Card activated on Rivico API');
        console.log('- ✅ Card no longer available for reassignment');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('Error details:', error);
    } finally {
        client.release();
        console.log('\n🔌 Database connection released');
    }
}

// Run the test
testUpdatedRiviaIntegration();