const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const identityService = require('../services/identityService');

const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// --- GET ARTISAN GUARANTORS ---
router.get('/guarantors', authMiddleware, catchAsync(async (req, res, next) => {
    if (req.user.role !== 'artisan') {
        return next(new AppError("This endpoint is only available for artisans.", 403));
    }

    const artisanId = req.user.id;
    const client = req.dbClient;

    try {
        const sql = `
            SELECT id, name, phone, relationship, is_verified, created_at
            FROM artisan_guarantors
            WHERE artisan_id = $1
            ORDER BY created_at DESC;
        `;
        
        const result = await client.query(sql, [artisanId]);
        
        res.status(200).json({
            message: "Guarantors retrieved successfully.",
            guarantors: result.rows
        });

    } catch (e) {
        console.error("Guarantors retrieval error:", e.message);
        return next(e);
    }
}));

// --- ADD NEW GUARANTOR ---
router.post('/guarantors', authMiddleware, catchAsync(async (req, res, next) => {
    if (req.user.role !== 'artisan') {
        return next(new AppError("This endpoint is only available for artisans.", 403));
    }

    const artisanId = req.user.id;
    const client = req.dbClient;
    const { name, phone, relationship } = req.body;

    // Validation
    if (!name || !phone || !relationship) {
        return next(new AppError("Name, phone, and relationship are required.", 400));
    }

    if (name.length > 100) {
        return next(new AppError("Name must be 100 characters or less.", 400));
    }

    if (phone.length > 15) {
        return next(new AppError("Phone must be 15 characters or less.", 400));
    }

    if (relationship.length > 50) {
        return next(new AppError("Relationship must be 50 characters or less.", 400));
    }

    try {
        const sql = `
            INSERT INTO artisan_guarantors (artisan_id, name, phone, relationship)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, phone, relationship, is_verified, created_at;
        `;
        
        const result = await client.query(sql, [artisanId, name, phone, relationship]);
        
        res.status(201).json({
            message: "Guarantor added successfully.",
            guarantor: result.rows[0]
        });

    } catch (e) {
        console.error("Add guarantor error:", e.message);
        return next(e);
    }
}));

// --- UPDATE GUARANTOR ---
router.put('/guarantors/:guarantorId', authMiddleware, catchAsync(async (req, res, next) => {
    if (req.user.role !== 'artisan') {
        return next(new AppError("This endpoint is only available for artisans.", 403));
    }

    const artisanId = req.user.id;
    const client = req.dbClient;
    const guarantorId = req.params.guarantorId;
    const { name, phone, relationship } = req.body;

    // Validation
    if (!name && !phone && !relationship) {
        return next(new AppError("At least one field (name, phone, or relationship) is required.", 400));
    }

    try {
        // Verify guarantor belongs to this artisan
        const verifySql = `
            SELECT artisan_id FROM artisan_guarantors WHERE id = $1
        `;
        const verifyResult = await client.query(verifySql, [guarantorId]);
        
        if (verifyResult.rows.length === 0) {
            return next(new AppError("Guarantor not found.", 404));
        }
        
        if (verifyResult.rows[0].artisan_id !== artisanId) {
            return next(new AppError("You can only update your own guarantors.", 403));
        }

        // Build update query
        const updates = [];
        const values = [];
        let paramCount = 1;
        
        if (name) {
            updates.push(`name = $${paramCount++}`);
            values.push(name);
        }
        if (phone) {
            updates.push(`phone = $${paramCount++}`);
            values.push(phone);
        }
        if (relationship) {
            updates.push(`relationship = $${paramCount++}`);
            values.push(relationship);
        }
        
        values.push(guarantorId); // For WHERE clause
        
        const sql = `
            UPDATE artisan_guarantors
            SET ${updates.join(', ')}
            WHERE id = $${paramCount}
            RETURNING id, name, phone, relationship, is_verified, created_at;
        `;
        
        const result = await client.query(sql, values);
        
        res.status(200).json({
            message: "Guarantor updated successfully.",
            guarantor: result.rows[0]
        });

    } catch (e) {
        console.error("Update guarantor error:", e.message);
        return next(e);
    }
}));

// --- DELETE GUARANTOR ---
router.delete('/guarantors/:guarantorId', authMiddleware, catchAsync(async (req, res, next) => {
    if (req.user.role !== 'artisan') {
        return next(new AppError("This endpoint is only available for artisans.", 403));
    }

    const artisanId = req.user.id;
    const client = req.dbClient;
    const guarantorId = req.params.guarantorId;

    try {
        // Verify guarantor belongs to this artisan
        const verifySql = `
            SELECT artisan_id FROM artisan_guarantors WHERE id = $1
        `;
        const verifyResult = await client.query(verifySql, [guarantorId]);
        
        if (verifyResult.rows.length === 0) {
            return next(new AppError("Guarantor not found.", 404));
        }
        
        if (verifyResult.rows[0].artisan_id !== artisanId) {
            return next(new AppError("You can only delete your own guarantors.", 403));
        }

        const sql = `
            DELETE FROM artisan_guarantors
            WHERE id = $1
            RETURNING id;
        `;
        
        const result = await client.query(sql, [guarantorId]);
        
        if (result.rows.length === 0) {
            return next(new AppError("Guarantor not found.", 404));
        }
        
        res.status(200).json({
            message: "Guarantor deleted successfully.",
            deleted_id: result.rows[0].id
        });

    } catch (e) {
        console.error("Delete guarantor error:", e.message);
        return next(e);
    }
}));

// --- GET USER PROFILE ---
router.get('/profile', authMiddleware, catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    const client = req.dbClient;

    try {
        let profileData;
        
        if (userRole === 'artisan') {
            const sql = `
                SELECT 
                    id, phone_primary, full_name, momo_network, 
                    is_momo_verified, paystack_resolved_name,
                    gh_card_number, gh_card_image_url, is_identity_verified,
                    primary_trade, primary_language, 
                    home_gps_address, home_lat, home_lon,
                    tier_level, reputation_score, total_review_count,
                    profile_picture_url, paystack_recipient_code,
                    created_at, updated_at
                FROM artisan_profiles 
                WHERE id = $1;
            `;
            const result = await client.query(sql, [userId]);
            if (result.rows.length === 0) {
                return next(new AppError("Artisan profile not found.", 404));
            }
            profileData = result.rows[0];
        } else if (userRole === 'client') {
            const sql = `
                SELECT 
                    id, phone_primary, full_name, email,
                    home_gps_address, home_lat, home_lon,
                    created_at, updated_at
                FROM client_profiles 
                WHERE id = $1;
            `;
            const result = await client.query(sql, [userId]);
            if (result.rows.length === 0) {
                return next(new AppError("Client profile not found.", 404));
            }
            profileData = result.rows[0];
        }

        res.status(200).json({
            message: "Profile retrieved successfully.",
            profile: profileData,
            user_role: userRole
        });

    } catch (e) {
        console.error("Profile retrieval error:", e.message);
        return next(e);
    }
}));

// --- UPDATE USER PROFILE ---
router.put('/profile', authMiddleware, catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    const client = req.dbClient;
    
    const allowedFields = [
        'full_name', 'home_gps_address', 'home_lat', 'home_lon', 'primary_trade', 'primary_language'
    ];
    
    // Filter allowed fields from request body
    const updates = {};
    for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    }

    if (Object.keys(updates).length === 0) {
        return next(new AppError("No valid fields provided for update.", 400));
    }

    try {
        let sql, values;
        
        if (userRole === 'artisan') {
            // Build dynamic update query for artisan
            const setClauses = [];
            const queryValues = [userId]; // $1 is userId for WHERE clause
            
            // Start paramCount at 2 since $1 is used for userId in WHERE clause
            let paramCount = 2;
            for (const [field, value] of Object.entries(updates)) {
                setClauses.push(`${field} = $${paramCount}`);
                queryValues.push(value);
                paramCount++;
            }
            
            setClauses.push(`updated_at = NOW()`);
            
            sql = `
                UPDATE artisan_profiles 
                SET ${setClauses.join(', ')}
                WHERE id = $1
                RETURNING id, full_name, home_gps_address, primary_trade, primary_language;
            `;
            values = queryValues;
        } else if (userRole === 'client') {
            // Build dynamic update query for client
            const setClauses = [];
            const queryValues = [userId]; // $1 is userId for WHERE clause
            
            // Start paramCount at 2 since $1 is used for userId in WHERE clause
            let paramCount = 2;
            for (const [field, value] of Object.entries(updates)) {
                setClauses.push(`${field} = $${paramCount}`);
                queryValues.push(value);
                paramCount++;
            }
            
            setClauses.push(`updated_at = NOW()`);
            
            sql = `
                UPDATE client_profiles 
                SET ${setClauses.join(', ')}
                WHERE id = $1
                RETURNING id, full_name, home_gps_address;
            `;
            values = queryValues;
        }

        const result = await client.query(sql, values);
        
        if (result.rows.length === 0) {
            return next(new AppError("Profile not found.", 404));
        }

        res.status(200).json({
            message: "Profile updated successfully.",
            profile: result.rows[0]
        });

    } catch (e) {
        console.error("Profile update error:", e.message);
        return next(e);
    }
}));

// --- GET VERIFICATION STATUS (for artisans) ---
router.get('/verification-status', authMiddleware, catchAsync(async (req, res, next) => {
    if (req.user.role !== 'artisan') {
        return next(new AppError("This endpoint is only available for artisans.", 403));
    }

    const artisanId = req.user.id;
    const client = req.dbClient;

    try {
        const sql = `
            SELECT 
                is_momo_verified, is_identity_verified, 
                home_gps_address IS NOT NULL as has_location,
                paystack_recipient_code IS NOT NULL as has_payout_rail
            FROM artisan_profiles 
            WHERE id = $1;
        `;
        
        const result = await client.query(sql, [artisanId]);
        
        if (result.rows.length === 0) {
            return next(new AppError("Artisan profile not found.", 404));
        }

        const status = result.rows[0];
        const canSeeGigs = status.is_momo_verified && 
                          status.is_identity_verified && 
                          status.has_location && 
                          status.has_payout_rail;

        res.status(200).json({
            verification_status: {
                momo_verified: status.is_momo_verified,
                identity_verified: status.is_identity_verified,
                location_set: status.has_location,
                payout_rail_active: status.has_payout_rail,
                can_see_gigs: canSeeGigs
            },
            gig_gate_locked: !canSeeGigs
        });

    } catch (e) {
        console.error("Verification status error:", e.message);
        return next(e);
    }
}));

// --- GET ARTISAN ID CARD DATA ---
router.get('/id-card-data', authMiddleware, catchAsync(async (req, res, next) => {
    if (req.user.role !== 'artisan') {
        return next(new AppError("This endpoint is only available for artisans.", 403));
    }

    const artisanId = req.user.id;
    const client = req.dbClient;

    try {
        // Get artisan profile
        const profileSql = `
            SELECT 
                id, full_name, primary_trade, profile_picture_url,
                reputation_score, total_review_count, created_at
            FROM artisan_profiles 
            WHERE id = $1;
        `;
        const profileResult = await client.query(profileSql, [artisanId]);
        
        if (profileResult.rows.length === 0) {
            return next(new AppError("Artisan profile not found.", 404));
        }

        const profile = profileResult.rows[0];

        // Get total completed jobs (PAYOUT_SUCCESS)
        const jobsSql = `
            SELECT COUNT(*) as total_jobs
            FROM job_transactions 
            WHERE artisan_id = $1 AND current_state = 'PAYOUT_SUCCESS';
        `;
        const jobsResult = await client.query(jobsSql, [artisanId]);
        const totalJobs = parseInt(jobsResult.rows[0]?.total_jobs || 0, 10);

        // Calculate years of experience (from account creation date)
        const createdAt = new Date(profile.created_at);
        const now = new Date();
        const diffTime = Math.abs(now - createdAt);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const yearsExperience = Math.floor(diffDays / 365);
        const experienceYears = yearsExperience < 1 ? 1 : yearsExperience; // Minimum 1 year, round down

        // Get rating (reputation_score) or default to 0
        const rating = parseFloat(profile.reputation_score || 0).toFixed(1);

        // Generate booking URL - links to public artisan profile or booking page
        // This URL should be accessible by clients scanning the QR code
        const CLIENT_APP_URL = process.env.FRONTEND_CLIENT_URL || 'http://localhost:3002';
        const bookingUrl = `${CLIENT_APP_URL}/artisan/${profile.id}`;

        // Format artisan ID (short version)
        const artisanIdShort = profile.id.split('-')[0].toUpperCase();

        res.status(200).json({
            id_card_data: {
                name: profile.full_name || 'Artisan',
                trade: profile.primary_trade || 'ARTISAN',
                rating: rating,
                total_jobs: totalJobs,
                years_experience: experienceYears,
                profile_image_url: profile.profile_picture_url,
                artisan_id: profile.id,
                artisan_id_short: artisanIdShort,
                booking_url: bookingUrl
            }
        });

    } catch (e) {
        console.error("ID card data retrieval error:", e.message);
        return next(e);
    }
}));

// --- GET REVIEW FOR A JOB (must be BEFORE POST /review to avoid route conflicts) ---
router.get('/review/:jobId', authMiddleware, catchAsync(async (req, res, next) => {
    if (req.user.role !== 'client') {
        return next(new AppError("Only clients can view reviews.", 403));
    }

    const clientId = req.user.id;
    const client = req.dbClient;
    const { jobId } = req.params;

    try {
        // Verify job belongs to client
        const jobSql = `
            SELECT id, client_id FROM job_transactions WHERE id = $1
        `;
        const jobResult = await client.query(jobSql, [jobId]);

        if (jobResult.rows.length === 0) {
            return next(new AppError("Job not found.", 404));
        }

        if (jobResult.rows[0].client_id !== clientId) {
            return next(new AppError("Unauthorized to view review for this job.", 403));
        }

        // Get review if exists
        const reviewSql = `
            SELECT id, rating, review_text, created_at, updated_at
            FROM artisan_reviews
            WHERE job_transaction_id = $1
        `;
        const reviewResult = await client.query(reviewSql, [jobId]);

        if (reviewResult.rows.length === 0) {
            return res.status(200).json({
                message: "No review found for this job.",
                review: null
            });
        }

        res.status(200).json({
            message: "Review retrieved successfully.",
            review: reviewResult.rows[0]
        });

    } catch (e) {
        console.error("Get review error:", e.message);
        return next(e);
    }
}));

// --- SUBMIT ARTISAN REVIEW/RATING ---
router.post('/review', authMiddleware, catchAsync(async (req, res, next) => {
    if (req.user.role !== 'client') {
        return next(new AppError("Only clients can submit reviews.", 403));
    }

    const clientId = req.user.id;
    const client = req.dbClient;
    const { job_transaction_id, rating, review_text } = req.body;

    // Validation
    if (!job_transaction_id || !rating) {
        return next(new AppError("Job transaction ID and rating are required.", 400));
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return next(new AppError("Rating must be an integer between 1 and 5.", 400));
    }

    try {
        await client.query('BEGIN');

        // Verify job exists and belongs to the client, and is completed
        const jobSql = `
            SELECT id, artisan_id, client_id, current_state
            FROM job_transactions
            WHERE id = $1 AND client_id = $2
        `;
        const jobResult = await client.query(jobSql, [job_transaction_id, clientId]);

        if (jobResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return next(new AppError("Job not found or you don't have permission to review this job.", 404));
        }

        const job = jobResult.rows[0];

        // Only allow reviews for completed jobs
        if (job.current_state !== 'PAYOUT_SUCCESS') {
            await client.query('ROLLBACK');
            return next(new AppError("You can only review completed jobs.", 400));
        }

        if (!job.artisan_id) {
            await client.query('ROLLBACK');
            return next(new AppError("No artisan assigned to this job.", 400));
        }

        // Check if review already exists
        const existingReviewSql = `SELECT id FROM artisan_reviews WHERE job_transaction_id = $1`;
        const existingReview = await client.query(existingReviewSql, [job_transaction_id]);

        if (existingReview.rows.length > 0) {
            // Update existing review
            const updateSql = `
                UPDATE artisan_reviews
                SET rating = $1, review_text = $2, updated_at = NOW()
                WHERE job_transaction_id = $3
                RETURNING id, rating, review_text
            `;
            const updateResult = await client.query(updateSql, [
                rating,
                review_text || null,
                job_transaction_id
            ]);

            // Recalculate artisan reputation
            await recalculateArtisanReputation(client, job.artisan_id);

            await client.query('COMMIT');

            return res.status(200).json({
                message: "Review updated successfully.",
                review: updateResult.rows[0]
            });
        }

        // Insert new review
        const insertSql = `
            INSERT INTO artisan_reviews (job_transaction_id, artisan_id, client_id, rating, review_text)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, rating, review_text, created_at
        `;
        const insertResult = await client.query(insertSql, [
            job_transaction_id,
            job.artisan_id,
            clientId,
            rating,
            review_text || null
        ]);

        // Update artisan reputation score
        await recalculateArtisanReputation(client, job.artisan_id);

        await client.query('COMMIT');

        res.status(201).json({
            message: "Review submitted successfully.",
            review: insertResult.rows[0]
        });

    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Review submission error:", e.message);
        
        // Handle unique constraint violation (if review already exists)
        if (e.code === '23505') {
            return next(new AppError("A review already exists for this job.", 409));
        }
        
        return next(e);
    }
}));

/**
 * Recalculates artisan reputation score based on all reviews
 */
async function recalculateArtisanReputation(client, artisanId) {
    const avgSql = `
        SELECT 
            AVG(rating) as avg_rating,
            COUNT(*) as review_count
        FROM artisan_reviews
        WHERE artisan_id = $1
    `;
    const avgResult = await client.query(avgSql, [artisanId]);
    
    const avgRating = parseFloat(avgResult.rows[0]?.avg_rating || 0);
    const reviewCount = parseInt(avgResult.rows[0]?.review_count || 0);
    
    // Update artisan profile
    const updateSql = `
        UPDATE artisan_profiles
        SET reputation_score = $1,
            total_review_count = $2,
            updated_at = NOW()
        WHERE id = $3
    `;
    await client.query(updateSql, [avgRating.toFixed(2), reviewCount, artisanId]);
}

module.exports = router;