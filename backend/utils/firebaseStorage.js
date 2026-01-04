// backend/utils/firebaseStorage.js
const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Initialize Firebase (Singleton)
if (!admin.apps.length) {
    try {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
            : {};
            
        // Log warning if bucket is missing (helps debugging logs)
        if (!process.env.FIREBASE_STORAGE_BUCKET) {
            console.warn("⚠️ WARNING: FIREBASE_STORAGE_BUCKET is not set in environment variables.");
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET
        });
        console.log("🔥 Firebase Admin Initialized");
    } catch (error) {
        console.error("⚠️ Firebase Init Error:", error.message);
    }
}

/**
 * Helper to safely get the bucket instance.
 * Prevents crash on startup if variables are missing.
 */
const getBucket = () => {
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
        throw new Error("FIREBASE_STORAGE_BUCKET environment variable is missing. Check Vercel Settings.");
    }
    // Explicitly pass the bucket name to avoid ambiguity
    return admin.storage().bucket(bucketName); 
};

/**
 * Uploads a file buffer to Firebase Storage and returns the public URL.
 */
const uploadToFirebase = async (file, folder = 'uploads') => {
    if (!file) return null;

    try {
        const bucket = getBucket(); // Get bucket instance lazily

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
                console.error('Firebase Upload Stream Error:', err);
                reject(err);
            });

            stream.on('finish', async () => {
                try {
                    // Make the file public and construct URL
                    await fileUpload.makePublic();
                    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
                    resolve(publicUrl);
                } catch (publicError) {
                    console.error("Error making file public:", publicError);
                    // Fallback: If makePublic fails (permissions), try signed URL or just reject
                    reject(publicError);
                }
            });

            stream.end(file.buffer);
        });
    } catch (error) {
        console.error("Upload to Firebase failed:", error.message);
        throw error; // Rethrow so the route handler sees the error
    }
};

module.exports = { uploadToFirebase };