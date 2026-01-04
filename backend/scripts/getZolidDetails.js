// backend/scripts/getZolidDetails.js
require('dotenv').config();
const axios = require('axios');

const getChannelDetails = async () => {
    console.log("🔍 Fetching ZOLID Channel Details...");

    const BASE_URL = process.env.RIVIA_API_URL || 'https://api.riviaco.com';
    
    if (!process.env.RIVIA_API_KEY) {
        console.error("❌ Missing RIVIA_API_KEY in .env");
        return;
    }

    try {
        const response = await axios.get(`${BASE_URL}/sponsors`, {
            headers: {
                'X-API-Key': process.env.RIVIA_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        const channels = response.data;
        
        if (Array.isArray(channels) && channels.length > 0) {
            console.log(`\n✅ Found ${channels.length} Channel(s):`);
            console.log("---------------------------------------------------");
            
            channels.forEach((channel, index) => {
                console.log(`[${index + 1}] Name: ${channel.sponsorName || channel.name}`);
                console.log(`    ID:   ${channel.id}`); // <--- THIS IS WHAT YOU NEED
                console.log(`    Role: ${channel.sponsorType}`);
                console.log("---------------------------------------------------");
            });

            // If you only have one, this is the one to copy
            console.log("💡 Tip: Copy the 'ID' above to your .env file as RIVIA_CHANNEL_ID");
        } else {
            console.log("⚠️  No channels found associated with this API Key.");
        }

    } catch (error) {
        console.error("❌ Fetch Failed:");
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
};

getChannelDetails();