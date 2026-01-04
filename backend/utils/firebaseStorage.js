// backend/utils/firebaseStorage.js
const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
if (!admin.apps.length) {
    try {
        // Check for required variables
        if (!process.env.FIREBASE_STORAGE_BUCKET) {
            throw new Error("Missing FIREBASE_STORAGE_BUCKET environment variable");
        }

        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
            : {};
            
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET
        });
        console.log("🔥 Firebase Storage Initialized");
    } catch (error) {
        console.error("⚠️ Firebase Init Error:", error.message);
    }
}

// Initialize Firebase (Singleton pattern to prevent multiple inits)
if (!admin.apps.length) {
    try {
        // Parse the service account JSON from environment variable
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
            : {};
            
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET
        });
        console.log("🔥 Firebase Storage Initialized");
    } catch (error) {
        console.error("⚠️ Firebase Init Error:", error.message);
    }
}

const bucket = admin.storage().bucket();

/**
 * Uploads a file buffer to Firebase Storage and returns the public URL.
 */
const uploadToFirebase = async (file, folder = 'uploads') => {
    if (!file) return null;

    const extension = path.extname(file.originalname);
    const filename = `${folder}/${uuidv4()}${extension}`;
    const fileUpload = bucket.file(filename);

    const stream = fileUpload.createWriteStream({
        metadata: {
            contentType: file.mimetype,
        },
    });

    return new Promise((resolve, reject) => {
        stream.on('error', (err) => {
            console.error('Firebase Upload Error:', err);
            reject(err);
        });

        stream.on('finish', async () => {
            // Make public and get URL
            await fileUpload.makePublic();
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
            resolve(publicUrl);
        });

        stream.end(file.buffer);
    });
};

module.exports = { uploadToFirebase };