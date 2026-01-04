// backend/scripts/testRiviaChannel.js
require('dotenv').config();
const riviaService = require('../services/riviacoService');

const testRiviaChannel = async () => {
    try {
        console.log("🔍 Testing Rivia Channel ID...");
        
        // Force using email format for channel ID as suggested by user
        const channelId = "info@zolid.online";
        console.log(`Channel ID: ${channelId}`);
        
        if (!channelId) {
            console.error("❌ RIVIA_CHANNEL_ID is not set in .env file");
            return;
        }
        
        // Test the channel by trying to get cards
        console.log("📡 Testing channel by fetching cards...");
        const cardsResponse = await riviaService.getChannelCards(channelId);
        
        console.log("✅ Channel is valid!");
        console.log("Response:", JSON.stringify(cardsResponse, null, 2));
        
    } catch (error) {
        console.error("❌ Error testing Rivia channel:", error.message);
        if (error.response) {
            console.error("Response data:", error.response.data);
        }
    }
};

testRiviaChannel();