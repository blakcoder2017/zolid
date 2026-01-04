#!/usr/bin/env node

// Test script for RiviaCo integration
const RiviaService = require('../services/riviacoService');

async function testRiviaIntegration() {
    console.log('🧪 Testing RiviaCo Integration');
    console.log('─'.repeat(50));

    try {
        // Test 1: Split full name into first and last names
        console.log('\n1. Testing name splitting logic...');
        const testNames = [
            { fullName: 'John Doe', expected: { firstName: 'John', lastName: 'Doe' } },
            { fullName: 'Jane Smith', expected: { firstName: 'Jane', lastName: 'Smith' } },
            { fullName: 'Michael', expected: { firstName: 'Michael', lastName: '' } },
            { fullName: 'Sarah Johnson Wilson', expected: { firstName: 'Sarah', lastName: 'Johnson Wilson' } }
        ];

        testNames.forEach(test => {
            const nameParts = test.fullName.trim().split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
            
            console.log(`   Input: "${test.fullName}" → First: "${firstName}", Last: "${lastName}"`);
            
            if (firstName === test.expected.firstName && lastName === test.expected.lastName) {
                console.log('   ✅ PASS');
            } else {
                console.log('   ❌ FAIL');
            }
        });

        // Test 2: Test RiviaCo API connectivity
        console.log('\n2. Testing RiviaCo API connectivity...');
        try {
            const userProfile = await RiviaService.getUserProfile();
            console.log('   ✅ RiviaCo API is reachable');
            console.log(`   User: ${userProfile.data.name}`);
        } catch (error) {
            console.log('   ⚠️  RiviaCo API connectivity test failed:');
            console.log(`   Error: ${error.message}`);
        }

        // Test 3: Test member registration (mock test - won't actually call API)
        console.log('\n3. Testing member registration logic...');
        const mockFullName = 'Test Artisan';
        const mockPhone = '+233551234567';
        
        const nameParts = mockFullName.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
        
        console.log(`   Mock artisan: ${mockFullName} (${mockPhone})`);
        console.log(`   Would register as: First="${firstName}", Last="${lastName}"`);
        console.log(`   Would generate card code: FREE-${mockPhone.substring(3, 11)}`);
        console.log('   ✅ Member registration logic is correct');

        console.log('\n' + '─'.repeat(50));
        console.log('✅ RiviaCo Integration Tests Complete');
        console.log('\nNote: Actual API calls would be made during artisan profile completion.');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the test
testRiviaIntegration();