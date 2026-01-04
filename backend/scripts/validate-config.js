require('dotenv').config();

const requiredEnvVars = [
    'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS',
    'JWT_SECRET', 'TEMP_TOKEN_SECRET',
    'PAYSTACK_SECRET_KEY'
];

const checkEnvironment = () => {
    const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:');
        missing.forEach(envVar => console.error(`   - ${envVar}`));
        process.exit(1);
    }
    
    // Validate JWT secret length
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
        console.error('❌ JWT_SECRET must be at least 32 characters long');
        process.exit(1);
    }
    
    console.log('✅ Environment configuration is valid');
};

checkEnvironment();