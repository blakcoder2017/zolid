const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const BASE_URL = 'https://staging-api-service.riviaco.com/api/v1';

// Helper to ask questions
const ask = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
    console.log("🔐 RiviaOS Token Generator");
    console.log("--------------------------");

    // 1. Get User ID (Email/Phone)
    const key = await ask("Enter your Rivia Account Email or Phone: ");
    
    try {
        // 2. Request OTP
        console.log(`\nSending OTP to ${key}...`);
        await axios.post(`${BASE_URL}/auth/otp/request`, { key });
        console.log("✅ OTP Sent! Check your email/SMS.");

        // 3. Input OTP
        const otp = await ask("\nEnter the 4-digit OTP code you received: ");

        // 4. Verify & Get Token
        console.log("Verifying...");
        const res = await axios.post(`${BASE_URL}/auth/otp/verify`, { key, otp });

        const token = res.data.data.token;
        const user = res.data.data.user;

        console.log("\n🎉 Login Successful!");
        console.log(`User: ${user.name} (${user.role})`);
        console.log("\n---------------------------------------------------");
        console.log("⚠️  COPY THIS TOKEN INTO YOUR .ENV FILE:");
        console.log("---------------------------------------------------");
        console.log(`RIVIA_API_TOKEN=${token}`);
        console.log("---------------------------------------------------");

    } catch (error) {
        console.error("\n❌ Error:", error.response ? error.response.data : error.message);
    } finally {
        rl.close();
    }
}

main();