const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const templatePath = path.join(__dirname, '../firebase-messaging-sw.template.js');
const clientSwPath = path.join(__dirname, '../packages/client/public/firebase-messaging.sw.js');
const artisanSwPath = path.join(__dirname, '../packages/artisan/public/firebase-messaging.sw.js');

let template = fs.readFileSync(templatePath, 'utf8');

// Replace placeholders
const keys = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
];

keys.forEach(key => {
    const value = process.env[key];
    if (!value) console.warn(`⚠️ Warning: ${key} is missing in .env`);
    template = template.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
});

// Write to packages
fs.writeFileSync(clientSwPath, template);
console.log('✅ Generated Client Service Worker');

fs.writeFileSync(artisanSwPath, template);
console.log('✅ Generated Artisan Service Worker');