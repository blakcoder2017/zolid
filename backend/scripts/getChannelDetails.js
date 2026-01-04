/**
 * RiviaOS Channel Details Fetcher
 * 
 * This script helps retrieve channel details from RiviaOS API.
 * Since the API doesn't have a direct "get channel by ID" endpoint,
 * this script provides alternative approaches to get channel information.
 */

require('dotenv').config();
const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ask = (query) => new Promise((resolve) => rl.question(query, resolve));

// Configuration
const BASE_URL = process.env.RIVIA_API_URL || 'https://staging-api-service.riviaco.com/api/v1';
const API_KEY = process.env.RIVIA_API_KEY;

async function getChannelDetails() {
    console.log("🔍 RiviaOS Channel Details Fetcher");
    console.log("====================================");
    
    if (!API_KEY) {
        console.error("❌ Error: RIVIA_API_KEY is missing in .env file");
        console.log("💡 Please add your RiviaOS API key to .env:");
        console.log("RIVIA_API_KEY=your_api_key_here");
        rl.close();
        return;
    }

    try {
        // Approach 1: Try to get channel details via cards endpoint (if we have a channel ID)
        const channelId = process.env.RIVIA_CHANNEL_ID;
        
        if (channelId) {
            console.log(`\n📋 Using existing CHANNEL_ID: ${channelId}`);
            
            // Try to get channel cards - this will also verify the channel exists
            try {
                const cardsResponse = await axios.get(`${BASE_URL}/channels/${channelId}/cards`, {
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log("✅ Channel verified successfully!");
                console.log(`📊 Cards found: ${cardsResponse.data.data.length || 0}`);
                console.log("\n📝 Channel Details:");
                console.log(`   Channel ID: ${channelId}`);
                console.log(`   Status: Active`);
                console.log(`   Cards Count: ${cardsResponse.data.data.length || 0}`);
                
                // Show first card if available
                if (cardsResponse.data.data && cardsResponse.data.data.length > 0) {
                    const firstCard = cardsResponse.data.data[0];
                    console.log(`\n💳 Sample Card:`);
                    console.log(`   Code: ${firstCard.code}`);
                    console.log(`   Title: ${firstCard.title}`);
                    console.log(`   Status: ${firstCard.status}`);
                }
                
            } catch (cardsError) {
                if (cardsError.response && cardsError.response.status === 404) {
                    console.log("⚠️  Channel not found or invalid channel ID");
                } else {
                    console.error("❌ Error fetching channel cards:", cardsError.response ? cardsError.response.data : cardsError.message);
                }
            }
        } else {
            console.log("\n⚠️  No RIVIA_CHANNEL_ID found in .env");
            console.log("📋 Available options:");
            console.log("1. Register a new channel");
            console.log("2. Use existing channel ID");
            
            const choice = await ask("\nEnter your choice (1-2): ");
            
            if (choice === '1') {
                // Register new channel
                const sponsorName = await ask("Enter sponsor name (e.g., ZOLID Systems): ");
                const contact = await ask("Enter contact phone: ");
                const email = await ask("Enter contact email: ");
                const location = await ask("Enter location: ");
                const teamSize = await ask("Enter team size: ");
                
                const payload = {
                    sponsorName,
                    contact,
                    email,
                    location,
                    teamSize,
                    sponsorType: "business"
                };
                
                console.log("\n📤 Registering new channel...");
                const registerResponse = await axios.post(`${BASE_URL}/channels`, payload, {
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log("✅ Channel registered successfully!");
                console.log("\n📝 New Channel Details:");
                console.log(`   Name: ${registerResponse.data.data.sponsorName}`);
                console.log(`   ID: ${registerResponse.data.data.id}`);
                console.log(`   Contact: ${registerResponse.data.data.contact}`);
                
                console.log("\n---------------------------------------------------");
                console.log("⚠️  IMPORTANT: Add this to your .env file:");
                console.log(`RIVIA_CHANNEL_ID=${registerResponse.data.data.id}`);
                console.log("---------------------------------------------------");
                
            } else if (choice === '2') {
                const manualChannelId = await ask("Enter your channel ID: ");
                console.log(`\n📋 Using channel ID: ${manualChannelId}`);
                console.log("\n---------------------------------------------------");
                console.log("⚠️  Add this to your .env file:");
                console.log(`RIVIA_CHANNEL_ID=${manualChannelId}`);
                console.log("---------------------------------------------------");
            }
        }
        
        // Show authentication token info
        console.log("\n🔐 Authentication Info:");
        console.log(`   API Base URL: ${BASE_URL}`);
        console.log(`   API Key: ${API_KEY.substring(0, 10)}...`);
        
    } catch (error) {
        console.error("\n❌ Error:", error.response ? error.response.data : error.message);
        if (error.response) {
            console.log(`Status: ${error.response.status}`);
            if (error.response.data) {
                console.log("Details:", JSON.stringify(error.response.data, null, 2));
            }
        }
    } finally {
        rl.close();
    }
}

// Alternative approach: Try to infer channel from account info
async function inferChannelFromAccount() {
    console.log("\n🔍 Trying to infer channel from account information...");
    
    try {
        // This would require the user to be authenticated with a JWT token
        // For now, we'll skip this as it requires interactive auth
        console.log("ℹ️  Note: Channel inference requires JWT authentication");
        console.log("💡 Use the get_rivia_token.js script first to get a token");
        
    } catch (error) {
        console.error("❌ Could not infer channel:", error.message);
    }
}

// Main execution
(async () => {
    await getChannelDetails();
    // await inferChannelFromAccount();
})();