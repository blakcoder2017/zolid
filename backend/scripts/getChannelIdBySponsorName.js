#!/usr/bin/env node

/**
 * Script to fetch channel details by sponsor name using the new endpoint.
 * Usage: node scripts/getChannelIdBySponsorName.js <sponsorName>
 * Example: node scripts/getChannelIdBySponsorName.js "ZOLID Systems"
 */

const axios = require('axios');

// Use the correct sponsor name directly
const sponsorName = "Zolid Systems";

// Encode the sponsor name for the URL
const encodedSponsorName = encodeURIComponent(sponsorName);

// Construct the URL for the new endpoint
const apiUrl = `http://localhost:8000/api/v1/identity/channel/${encodedSponsorName}`;

console.log(`Fetching channel details for sponsor: ${sponsorName}`);
console.log(`Request URL: ${apiUrl}`);

axios.get(apiUrl)
    .then(response => {
        const channelData = response.data;
        console.log('\n✅ Channel details retrieved successfully:');
        console.log(JSON.stringify(channelData, null, 2));
        
        if (channelData.data && channelData.data.id) {
            console.log(`\n📌 Channel ID: ${channelData.data.id}`);
        }
    })
    .catch(error => {
        console.error('\n❌ Error fetching channel details:');
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error(`Status: ${error.response.status}`);
            console.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('No response received from the server.');
            console.error('Make sure the server is running and the endpoint is accessible.');
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error(`Error: ${error.message}`);
        }
        process.exit(1);
    });