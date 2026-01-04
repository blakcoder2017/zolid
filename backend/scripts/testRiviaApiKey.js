const axios = require('axios');
require('dotenv').config();

async function testRiviaApiKey() {
    const apiKey = process.env.RIVIA_API_KEY;
    const baseUrl = process.env.RIVIA_API_URL || 'https://staging-api-service.riviaco.com/api/v1';

    console.log('RIVIA_API_KEY from .env:', apiKey ? '*****' : 'NOT SET');
    console.log('RIVIA_API_URL from .env:', baseUrl);

    if (!apiKey) {
        console.error('❌ Rivia API Token not configured in .env file');
        return;
    }

    try {
        const config = {
            method: 'GET',
            url: `${baseUrl}/accounts/me`,
            headers: { 
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        };
        
        console.log('Testing Rivia API key...');
        const response = await axios(config);
        
        if (response.data) {
            console.log('✅ Rivia API key is valid');
            console.log('Response:', response.data);
        } else {
            console.warn('⚠️ Empty response from Rivia API');
        }
    } catch (error) {
        const msg = error.response?.data?.message || error.message;
        const status = error.response?.status || 'unknown';
        console.error(`❌ Rivia API Error [/accounts/me]`);
        console.error(`Status: ${status}`);
        console.error(`Message: ${msg}`);
        
        if (status === 401) {
            console.error('The API key is invalid or expired. Please check your RIVIA_API_KEY in the .env file.');
        }
    }
}

testRiviaApiKey();