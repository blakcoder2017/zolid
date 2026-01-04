// backend/routes/uploadRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/auth');
const { uploadToFirebase } = require('../utils/firebaseStorage'); // Import helper

const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// --- DUAL STORAGE CONFIGURATION ---
const isProduction = process.env.NODE_ENV === 'production' || process.env.IS_VERCEL === 'true';

// 1. Local Storage (Development)
const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// 2. Memory Storage (Production/Firebase)
const memoryStorage = multer.memoryStorage();

const upload = multer({
    storage: isProduction ? memoryStorage : diskStorage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new AppError('Only image files (jpeg, jpg, png, gif) are allowed.', 400));
        }
    }
});

// --- HELPER: Handle File Upload based on Environment ---
async function handleFileUpload(file, folderName) {
    if (isProduction) {
        // Upload to Firebase and return Cloud URL
        return await uploadToFirebase(file, folderName);
    } else {
        // Return Local Path
        return `/uploads/${file.filename}`;
    }
}

// --- ROUTES ---

// 1. JOB PHOTOS
router.post('/job-photos', authMiddleware, upload.fields([
    { name: 'before_photo', maxCount: 1 },
    { name: 'after_photo', maxCount: 1 }
]), catchAsync(async (req, res, next) => {
    const { job_id } = req.body;
    const userId = req.user.id;
    const client = req.dbClient;

    if (!job_id) return next(new AppError("Job ID is required.", 400));

    // Verify ownership
    const checkSql = `SELECT client_id, artisan_id FROM job_transactions WHERE id = $1`;
    const checkResult = await client.query(checkSql, [job_id]);
    
    if (checkResult.rows.length === 0) return next(new AppError("Job not found.", 404));
    
    const job = checkResult.rows[0];
    if (job.client_id !== userId && job.artisan_id !== userId) {
        return next(new AppError("Unauthorized to upload photos for this job.", 403));
    }

    const updateFields = [];
    const updateValues = [job_id];
    let paramCount = 2;

    // Handle 'Before' Photo
    if (req.files?.before_photo?.[0]) {
        const url = await handleFileUpload(req.files.before_photo[0], 'jobs');
        updateFields.push(`photo_evidence_before_url = $${paramCount}`);
        updateValues.push(url);
        paramCount++;
    }

    // Handle 'After' Photo
    if (req.files?.after_photo?.[0]) {
        const url = await handleFileUpload(req.files.after_photo[0], 'jobs');
        updateFields.push(`photo_evidence_after_url = $${paramCount}`);
        updateValues.push(url);
        paramCount++;
    }

    if (updateFields.length === 0) {
        return next(new AppError("No photos uploaded.", 400));
    }

    updateFields.push('updated_at = NOW()');

    const updateSql = `
        UPDATE job_transactions 
        SET ${updateFields.join(', ')}
        WHERE id = $1
        RETURNING photo_evidence_before_url, photo_evidence_after_url
    `;

    const updateResult = await client.query(updateSql, updateValues);

    res.status(200).json({
        message: "Job photos uploaded successfully.",
        photos: updateResult.rows[0]
    });
}));

// 2. GHANA CARD (Authenticated)
router.post('/ghana-card', authMiddleware, upload.single('ghana_card_image'), catchAsync(async (req, res, next) => {
    if (req.user.role !== 'artisan') return next(new AppError("Only artisans allowed.", 403));
    if (!req.file) return next(new AppError("Ghana Card image is required.", 400));

    const imageUrl = await handleFileUpload(req.file, 'identity');
    const artisanId = req.user.id;

    const updateSql = `
        UPDATE artisan_profiles 
        SET gh_card_image_url = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING gh_card_image_url
    `;
    const result = await req.dbClient.query(updateSql, [imageUrl, artisanId]);

    res.status(200).json({
        message: "Ghana Card image uploaded successfully.",
        image_url: result.rows[0].gh_card_image_url
    });
}));

// 3. GHANA CARD (Registration - Public)
router.post('/ghana-card-registration', upload.single('ghana_card_image'), catchAsync(async (req, res, next) => {
    if (!req.file) return next(new AppError("Ghana Card image is required.", 400));

    const imageUrl = await handleFileUpload(req.file, 'temp_identity');

    res.status(200).json({
        message: "Ghana Card image uploaded successfully.",
        image_url: imageUrl
    });
}));

// 4. GENERIC IMAGE
router.post('/image', authMiddleware, upload.single('image'), catchAsync(async (req, res, next) => {
    if (!req.file) return next(new AppError("Image file is required.", 400));

    const imageUrl = await handleFileUpload(req.file, 'general');

    res.status(200).json({
        message: "Image uploaded successfully.",
        image_url: imageUrl
    });
}));

// 5. PROFILE PICTURE
router.post('/profile-picture', authMiddleware, upload.single('profile_picture'), catchAsync(async (req, res, next) => {
    if (!req.file) return next(new AppError("Profile picture is required.", 400));

    const imageUrl = await handleFileUpload(req.file, 'profiles');
    const artisanId = req.user.id;

    const updateSql = `
        UPDATE artisan_profiles 
        SET profile_picture_url = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING profile_picture_url
    `;
    const result = await req.dbClient.query(updateSql, [imageUrl, artisanId]);

    res.status(200).json({
        message: "Profile picture uploaded successfully.",
        image_url: result.rows[0].profile_picture_url
    });
}));

// 6. SERVE LOCAL FILES (Dev Only)
router.get('/file/:filename', authMiddleware, catchAsync(async (req, res, next) => {
    if (isProduction) {
        return next(new AppError("File serving not available in production (Use Firebase URLs).", 404));
    }

    const filename = req.params.filename;
    const filePath = path.join('./uploads', filename);

    if (filename.includes('..') || !fs.existsSync(filePath)) {
        return next(new AppError("File not found.", 404));
    }

    res.sendFile(path.resolve(filePath));
}));

module.exports = router;