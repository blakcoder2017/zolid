// backend/scripts/registerZolidChannel.js
require('dotenv').config(); 
const axios = require('axios'); // Use axios directly to control headers

const registerChannel = async () => {
    console.log("🚀 Initializing ZOLID Channel Registration...");

    // 1. Check for the correct API KEY (Not the JWT Token)
    if (!process.env.RIVIA_API_KEY) {
        console.error("❌ Error: RIVIA_API_KEY is missing in .env");
        console.error("💡 Tip: Check your .env file. You need the 'X-API-Key' value here, not the Bearer token.");
        process.exit(1);
    }

    // 2. Ensure Base URL is defined
    const BASE_URL = process.env.RIVIA_API_URL || 'https://api.riviaco.com'; // Adjust default if needed

    try {
        const payload = {
            sponsorName: "ZOLID Systems",
            contact: "0594836357",      
            email: "info@zolid.online", 
            location: "Tamale, Ghana",
            sponsorType: "business",
            teamSize: 100                
        };

        // 3. Send Request with 'X-API-Key' Header
        const response = await axios.post(`${BASE_URL}/channels`, payload, {
            headers: {
                'X-API-Key': process.env.RIVIA_API_KEY, // ✅ Correct Auth Method
                'Content-Type': 'application/json'
            }
        });

        console.log("\n✅ Channel Registered Successfully!");
        console.log("---------------------------------------------------");
        console.log("📝 Channel Name:", response.data.sponsorName);
        console.log("🆔 CHANNEL ID:", response.data.id);
        console.log("---------------------------------------------------");
        console.log("⚠️  ACTION REQUIRED: Copy the CHANNEL ID above and add it to your .env file:");
        console.log(`RIVIA_CHANNEL_ID=${response.data.id}`);

    } catch (error) {
        console.error("\n❌ Registration Failed:");
        
        if (error.response) {
            // Server responded with a status code outside 2xx range
            console.error(`Status: ${error.response.status} - ${error.response.statusText}`);
            console.error("Details:", JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            // Request was made but no response received
            console.error("No response received from Rivia API.");
        } else {
            // Something happened in setting up the request
            console.error("Error Message:", error.message);
        }
    }
};

registerChannel();