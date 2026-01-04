const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware, gigGateMiddleware } = require('../middleware/auth'); // Import security layers
const jobService = require('../services/jobService');
const jobQuoteService = require('../services/jobQuoteService'); // NEW: Quote system
const analyticsService = require('../services/analyticsService'); // NEW: Analytics
const negotiationService = require('../services/negotiationService'); // NEW: Negotiation
const notificationService = require('../services/notificationService'); // NEW: Push notifications
const identityService = require('../services/identityService'); // Import identity service

const router = express.Router();

// Utility for handling async errors globally
const catchAsync = require('../utils/catchAsync'); 
const AppError = require('../utils/appError');
// Mock utility function to fetch client email (should be implemented in identityService)


// --- Client Endpoints (Protected by Authentication only) ---

// POST /api/v1/jobs/create (Protected: Only logged-in users can post jobs)
// NEW QUOTE SYSTEM: Price is NO LONGER required at creation - artisans will quote
router.post('/create', authMiddleware, catchAsync(async (req, res, next) => {
    const jobRequest = req.body;
    const client = req.dbClient; 
    const clientId = req.user.id;

    // NEW: Validation - only location and description required, NO price
    if (!jobRequest.location_lat || !jobRequest.location_lon) {
        return next(new AppError("Job location is required.", 400));
    }
    
    if (!jobRequest.job_description) {
        return next(new AppError("Job description is required.", 400));
    }

    // Optional fields: location_gps_address, photo_evidence_before_url, quotes_deadline

    try {
        await client.query('BEGIN'); 
        
        // Retrieve client email using the new identity service function
        const clientEmail = await identityService.getClientEmailById(client, clientId); 
        
        // FIX: Passing clientId to the job service
        const jobDetails = await jobService.createJob(client, jobRequest, clientEmail, clientId);
        
        await client.query('COMMIT'); 
        
        res.status(201).json({
            message: "Job posted successfully! Artisans can now submit quotes. You'll be notified when quotes arrive.",
            job: jobDetails
        });

    } catch (e) {
        await client.query('ROLLBACK'); 
        console.error('Job Creation failed:', e.message);
        // Convert generic service error to an operational error if it's client-facing
        if (e.message.includes("Client profile not found")) {
            return next(new AppError(e.message, 404));
        }
        return next(e);
    }
}));

// POST /api/v1/jobs/:jobId/generate-otp (Protected: Client generates OTP after reviewing work)
router.post('/:jobId/generate-otp', authMiddleware, catchAsync(async (req, res, next) => {
    // F.C.4 - Client generates OTP after reviewing work/photos
    const jobId = req.params.jobId;
    const clientId = req.user.id;
    const client = req.dbClient;

    try {
        await client.query('BEGIN');

        // Verify job exists and belongs to client
        const job = await jobService.getJobById(client, jobId);
        if (!job) {
            await client.query('ROLLBACK');
            return next(new AppError("Job not found.", 404));
        }

        if (job.client_id !== clientId) {
            await client.query('ROLLBACK');
            return next(new AppError("Unauthorized to generate OTP for this job.", 403));
        }

        if (job.current_state !== 'COMPLETED_PENDING') {
            await client.query('ROLLBACK');
            return next(new AppError("Job must be in COMPLETED_PENDING state to generate OTP.", 400));
        }

        // Generate OTP
        const otp = await jobService.generateJobOTP(client, jobId);
        
        await client.query('COMMIT');

        res.status(200).json({
            message: "OTP generated successfully. Share this with the artisan to release payment.",
            job_id: jobId,
            otp: otp,
            expires_in_minutes: 15,
            note: "This OTP is valid for 15 minutes. Share it with the artisan to complete the job."
        });

    } catch (e) {
        await client.query('ROLLBACK');
        console.error(`OTP generation failed for Job ${jobId}:`, e.message);
        return next(new AppError(`Failed to generate OTP. Detail: ${e.message}`, 500));
    }
}));

// --- APPROVE WORK (Client approves work and releases payment) ---
// NEW WORKFLOW: Replaces OTP system - Client clicks "Approve Work" in-app
router.post('/:jobId/approve-work', authMiddleware, catchAsync(async (req, res, next) => {
    const jobId = req.params.jobId;
    const clientId = req.user.id;
    const client = req.dbClient;
    const { pin, rating, review_text } = req.body; // Optional 4-digit PIN, rating (1-5), and review text

    try {
        await client.query('BEGIN');
        
        // Get job details
        const jobSql = `
            SELECT * FROM job_transactions WHERE id = $1
        `;
        const jobResult = await client.query(jobSql, [jobId]);
        
        if (jobResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return next(new AppError("Job not found.", 404));
        }
        
        const job = jobResult.rows[0];
        
        // Authorization: Only the client who posted the job can approve
        if (job.client_id !== clientId) {
            await client.query('ROLLBACK');
            return next(new AppError("Unauthorized to approve this job.", 403));
        }
        
        // Validation: Job must be in COMPLETED_PENDING state
        if (job.current_state !== 'COMPLETED_PENDING') {
            await client.query('ROLLBACK');
            return next(new AppError(`Job cannot be approved in state: ${job.current_state}. Artisan must request sign-off first.`, 400));
        }
        
        // Validation: Artisan must be assigned
        if (!job.artisan_id) {
            await client.query('ROLLBACK');
            return next(new AppError("No artisan assigned to this job.", 400));
        }
        
        // Validation: After photos must exist
        if (!job.photo_evidence_after_url) {
            await client.query('ROLLBACK');
            return next(new AppError("Work completion photos are required before approval.", 400));
        }
        
        // Optional: Validate PIN if provided (4-digit PIN for physical verification)
        if (pin) {
            if (!/^\d{4}$/.test(pin)) {
                await client.query('ROLLBACK');
                return next(new AppError("PIN must be 4 digits.", 400));
            }
            // PIN is just for physical verification - no storage/validation needed
            console.log(`✅ Physical verification completed with PIN for job ${jobId}`);
        }
        
        // Optional: Validate rating if provided (1-5 stars)
        if (rating !== undefined && rating !== null) {
            const ratingNum = parseInt(rating, 10);
            if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
                await client.query('ROLLBACK');
                return next(new AppError("Rating must be an integer between 1 and 5.", 400));
            }
        }
        
        // ============================================
        // PHASE 1: DATABASE OPERATIONS (FAST - < 100ms)
        // ============================================
        
        // Process payment release (ledger posting)
        const jobService = require('../services/jobService');
        const signoffResult = await jobService.signoffAndPay(client, {
            job_id: jobId,
            client_id: clientId,
            artisan_id: job.artisan_id
        });
        
        // Get recipient code BEFORE commit (so we don't need DB connection in async block)
        const artisanCheck = await client.query(
            `SELECT paystack_recipient_code FROM artisan_profiles WHERE id = $1`,
            [job.artisan_id]
        );
        const recipientCode = artisanCheck.rows[0]?.paystack_recipient_code;
        
        // Check if this is the artisan's first successful payout (for RiviaCo Standard Plan upgrade)
        // Must check BEFORE updating state to PAYOUT_SUCCESS
        const firstGigCheck = await client.query(
            `SELECT COUNT(*) as completed_jobs_count 
             FROM job_transactions 
             WHERE artisan_id = $1 AND current_state = 'PAYOUT_SUCCESS'`,
            [job.artisan_id]
        );
        const isFirstGig = parseInt(firstGigCheck.rows[0].completed_jobs_count, 10) === 0;
        
        // Update job state to PAYOUT_SUCCESS
        await client.query(
            `UPDATE job_transactions SET current_state = 'PAYOUT_SUCCESS', updated_at = NOW() WHERE id = $1`,
            [jobId]
        );
        
        // COMMIT transaction immediately - don't wait for external APIs
        await client.query('COMMIT');
        
        // Upgrade to RiviaCo Standard Plan if this is the first gig (after commit to avoid transaction hangs)
        if (isFirstGig) {
            try {
                const riviacoService = require('../services/riviacoService');
                const artisanProfile = await client.query(
                    `SELECT riviaco_policy_id, riviaco_plan, full_name FROM artisan_profiles WHERE id = $1`,
                    [job.artisan_id]
                );
                
                if (artisanProfile.rows.length > 0) {
                    const profile = artisanProfile.rows[0];
                    // Only upgrade if currently on FREE plan (or no plan set)
                    if (!profile.riviaco_plan || profile.riviaco_plan === 'FREE') {
                        if (profile.riviaco_policy_id) {
                            const upgradeResult = await riviacoService.upgradeToStandardPlan(profile.riviaco_policy_id);
                            
                            // Update artisan profile with Standard plan info
                            await client.query(
                                `UPDATE artisan_profiles 
                                 SET riviaco_plan = 'STANDARD',
                                     updated_at = NOW()
                                 WHERE id = $1`,
                                [job.artisan_id]
                            );
                            
                            console.log(`✅ Upgraded artisan ${job.artisan_id} to RiviaCo Standard Plan`);
                        }
                    }
                }
            } catch (error) {
                // Log error but don't fail the request - upgrade can be retried
                console.error(`❌ Failed to upgrade RiviaCo plan for artisan ${job.artisan_id}:`, error.message);
            }
        }
        
        // ============================================
        // PHASE 2: EXTERNAL API CALLS (AFTER COMMIT)
        // ============================================
        
        // Trigger Paystack transfer (non-blocking, fire-and-forget)
        // Use setImmediate to run AFTER response is sent - NO database connection needed
        const paystackService = require('../services/paystackService');
        const artisanIdForTransfer = job.artisan_id;
        const payoutAmount = job.artisan_payout_pesewas;
        
        setImmediate(async () => {
            try {
                if (recipientCode) {
                    const paystackResponse = await paystackService.initializeTransfer(
                        jobId,
                        recipientCode,
                        payoutAmount,
                        `ZOLID Job Payout ${jobId}`
                    );
                    // Log full Paystack response after payment release
                    console.log(`✅ Paystack transfer initiated for job ${jobId}:`, JSON.stringify({
                        reference: paystackResponse.reference,
                        paystack_transfer_id: paystackResponse.paystack_transfer_id,
                        transfer_code: paystackResponse.transfer_code,
                        batch_code: paystackResponse.batch_code,
                        status: paystackResponse.status,
                        message: paystackResponse.message,
                        amount_pesewas: payoutAmount,
                        recipient_code: recipientCode
                    }, null, 2));
                } else {
                    console.warn(`⚠️ Artisan ${artisanIdForTransfer} has no Paystack recipient code - transfer skipped for job ${jobId}`);
                }
            } catch (paystackError) {
                console.error(`⚠️ Paystack transfer failed for job ${jobId}:`, paystackError.message);
                console.error(`   Error details:`, paystackError);
                // Don't fail - transfer can be retried via reconciliation
            }
        });
        
        // TODO: Send Push Notification to artisan (also async/background)
        console.log(`📬 TODO: Send push notification to artisan ${job.artisan_id} - Payment released for job ${jobId}`);
        
        // Submit rating/review if provided (after transaction commits, use fresh connection)
        if (rating !== undefined && rating !== null) {
            const ratingNum = parseInt(rating, 10);
            const reviewText = review_text || null;
            const artisanIdForReview = job.artisan_id;
            
            setImmediate(async () => {
                const reviewClient = await require('../db/db').pool.connect();
                let transactionStarted = false;
                
                try {
                    // Ensure connection is clean before starting transaction
                    try {
                        await reviewClient.query('ROLLBACK');
                    } catch (e) {
                        // Ignore - connection is clean
                    }
                    
                    await reviewClient.query('BEGIN');
                    transactionStarted = true;
                    
                    // Check if review already exists
                    const existingReviewSql = `SELECT id FROM artisan_reviews WHERE job_transaction_id = $1`;
                    const existingReview = await reviewClient.query(existingReviewSql, [jobId]);
                    
                    if (existingReview.rows.length > 0) {
                        // Update existing review
                        const updateSql = `
                            UPDATE artisan_reviews
                            SET rating = $1, review_text = $2, updated_at = NOW()
                            WHERE job_transaction_id = $3
                        `;
                        await reviewClient.query(updateSql, [ratingNum, reviewText, jobId]);
                    } else {
                        // Insert new review
                        const insertSql = `
                            INSERT INTO artisan_reviews (job_transaction_id, artisan_id, client_id, rating, review_text)
                            VALUES ($1, $2, $3, $4, $5)
                        `;
                        await reviewClient.query(insertSql, [
                            jobId, 
                            artisanIdForReview, 
                            clientId, 
                            ratingNum, 
                            reviewText
                        ]);
                    }
                    
                    // Recalculate artisan reputation
                    const avgSql = `
                        SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
                        FROM artisan_reviews WHERE artisan_id = $1
                    `;
                    const avgResult = await reviewClient.query(avgSql, [artisanIdForReview]);
                    const avgRating = parseFloat(avgResult.rows[0]?.avg_rating || 0);
                    const reviewCount = parseInt(avgResult.rows[0]?.review_count || 0);
                    const updateSql = `
                        UPDATE artisan_profiles
                        SET reputation_score = $1, total_review_count = $2, updated_at = NOW()
                        WHERE id = $3
                    `;
                    await reviewClient.query(updateSql, [avgRating.toFixed(2), reviewCount, artisanIdForReview]);
                    
                    await reviewClient.query('COMMIT');
                    transactionStarted = false;
                    console.log(`✅ Review submitted for job ${jobId} (rating: ${ratingNum}, artisan: ${artisanIdForReview})`);
                } catch (reviewError) {
                    if (transactionStarted) {
                        try {
                            await reviewClient.query('ROLLBACK');
                        } catch (rollbackError) {
                            console.error(`⚠️ Failed to rollback review transaction for job ${jobId}:`, rollbackError.message);
                        }
                    }
                    console.error(`⚠️ Failed to submit review for job ${jobId}:`, reviewError.message);
                    console.error(`   Error stack:`, reviewError.stack);
                    // Don't fail the approval - review can be added later
                } finally {
                    // Ensure connection is clean before release
                    try {
                        if (transactionStarted) {
                            await reviewClient.query('ROLLBACK');
                        }
                    } catch (e) {
                        // Ignore cleanup errors
                    }
                    reviewClient.release();
                }
            });
        }
        
        res.status(200).json({
            message: "Work approved! Payment has been released to artisan.",
            job_id: jobId,
            transaction_id: signoffResult.transaction_id,
            new_state: 'PAYOUT_SUCCESS',
            artisan_payout: job.artisan_payout_pesewas,
            verification_method: pin ? 'in-app with PIN' : 'in-app',
            rating_submitted: rating !== undefined
        });
        
    } catch (e) {
        try { await client.query('ROLLBACK'); } catch (rollbackError) {
            console.error('CRITICAL: Failed to rollback transaction:', rollbackError.message);
        }
        console.error("Failed to approve work:", e.message);
        return next(new AppError(`Failed to approve work: ${e.message}`, 500));
    }
}));

// --- LEGACY OTP SIGNOFF (Deprecated - keeping for backward compatibility) ---
router.post('/signoff', authMiddleware, catchAsync(async (req, res, next) => {
    // DEPRECATED: Use /:jobId/approve-work instead
    // F.A.4 / F.C.4 & F.S.1 - Artisan submits OTP to trigger atomic ledger posting and instant payout.
    const signoffRequest = req.body;
    const client = req.dbClient; 
    const requestingUserId = req.user.id; 
    const userRole = req.user.role;

    // Validation
    if (!signoffRequest.job_id || !signoffRequest.otp) {
        return next(new AppError("Job ID and OTP are required.", 400));
    }

    if (signoffRequest.is_work_satisfactory === false) {
        return next(new AppError("Work marked as unsatisfactory. Initiate dispute resolution.", 400));
    }

    try {
        await client.query('BEGIN');

        // Get job to verify ownership
        const job = await jobService.getJobById(client, signoffRequest.job_id);
        if (!job) {
            await client.query('ROLLBACK');
            return next(new AppError("Job not found.", 404));
        }

        // Verify user is involved in this job
        if (userRole === 'client') {
            signoffRequest.client_id = requestingUserId;
        } else if (userRole === 'artisan') {
            if (job.artisan_id !== requestingUserId) {
                await client.query('ROLLBACK');
                return next(new AppError("Unauthorized artisan for this job.", 403));
            }
            // For artisan sign-off, use the job's client_id
            signoffRequest.client_id = job.client_id;
        } else {
            await client.query('ROLLBACK');
            return next(new AppError("Only clients or artisans can sign off jobs.", 403));
        }
        
        const signoffResult = await jobService.signoffAndPay(client, signoffRequest);
        const transactionId = signoffResult.transaction_id || signoffResult; // Support both old and new return format
        
        await client.query('COMMIT'); 
        
        res.status(200).json({
            message: "Success! Funds released and distributed. Artisan paid instantly.",
            job_id: signoffRequest.job_id,
            transaction_id: transactionId
        });
        
    } catch (e) {
        await client.query('ROLLBACK'); 
        console.error(`FATAL: Client Signoff/Payout failed for Job ${signoffRequest.job_id}:`, e.message);
        return next(new AppError(`Failed to process payment release. Detail: ${e.message}`, 500));
    }
    
}));


// --- Artisan Endpoints (Protected by Authentication AND Gig Gate) ---

// GET /api/v1/jobs/available (Protected by Gig Gate)
router.get('/available', authMiddleware, gigGateMiddleware, catchAsync(async (req, res, next) => {
    const client = req.dbClient;

    try {
        // NEW QUOTE SYSTEM: Get all jobs open for quotes
        const sql = `
            SELECT
                jt.id,
                jt.gross_fee_pesewas,
                jt.warranty_fee_pesewas,
                jt.artisan_payout_pesewas,
                jt.current_state,
                jt.location_gps_address,
                jt.location_lat,
                jt.location_lon,
                jt.job_description,
                jt.photo_evidence_before_url,
                jt.quotes_deadline,
                jt.created_at,
                cp.full_name as client_name,
                cp.phone_primary as client_phone,
                (SELECT COUNT(*) FROM job_quotes WHERE job_id = jt.id AND status = 'PENDING') as quote_count
            FROM job_transactions jt
            LEFT JOIN client_profiles cp ON jt.client_id = cp.id
            WHERE jt.current_state IN ('OPEN_FOR_QUOTES', 'QUOTED')
              AND jt.artisan_id IS NULL
              AND (jt.quotes_deadline IS NULL OR jt.quotes_deadline > NOW())
            ORDER BY jt.created_at DESC
        `;

        const result = await client.query(sql);
        
        res.status(200).json({
            message: "Available jobs retrieved successfully.",
            jobs: result.rows
        });
    } catch (e) {
        console.error("Failed to fetch available jobs:", e.message);
        return next(e);
    }
}));

// POST /api/v1/jobs/:jobId/accept (Protected by Gig Gate)
router.post('/:jobId/accept', authMiddleware, gigGateMiddleware, catchAsync(async (req, res, next) => {
    const jobId = req.params.jobId;
    const artisanId = req.user.id;
    const client = req.dbClient;

    try {
        await client.query('BEGIN');
        
        // Verify job exists and is available
        const job = await jobService.getJobById(client, jobId);
        
        if (!job) {
            await client.query('ROLLBACK');
            return next(new AppError("Job not found.", 404));
        }
        
        // Normalize state to uppercase for comparison (PostgreSQL ENUMs are case-sensitive)
        const jobState = (job.current_state || '').toString().trim().toUpperCase();
        
        // Debug: Log job state
        console.log(`[ACCEPT] Job ${jobId} current state: "${job.current_state}" (normalized: "${jobState}"), artisan_id: ${job.artisan_id}, requesting artisan: ${artisanId}`);
        
        // Handle DRAFT jobs: Record acceptance in job_artisan_acceptances table (allows multiple acceptances)
        // Also handle if artisan_id is already set but state is still DRAFT (recovery case - try to complete the acceptance)
        if (jobState === 'DRAFT') {
            // Check if artisan has already accepted this job
            const existingAcceptanceSql = `
                SELECT id FROM job_artisan_acceptances 
                WHERE job_id = $1 AND artisan_id = $2
            `;
            const existingResult = await client.query(existingAcceptanceSql, [jobId, artisanId]);
            
            // If already accepted and job already has this artisan assigned, just return success
            if (existingResult.rows.length > 0 && job.artisan_id === artisanId) {
                // Job was already accepted by this artisan - return current state
                await client.query('COMMIT');
                res.status(200).json({
                    message: `Job ${jobId} already accepted. Current state: ${job.current_state}`,
                    job_id: jobId,
                    artisan_id: artisanId,
                    current_state: job.current_state
                });
                return;
            }
            
            if (existingResult.rows.length > 0) {
                await client.query('ROLLBACK');
                return next(new AppError("You have already accepted this job.", 409));
            }
            
            // Record acceptance in job_artisan_acceptances
            const acceptanceSql = `
                INSERT INTO job_artisan_acceptances (job_id, artisan_id, is_selected)
                VALUES ($1, $2, FALSE)
                RETURNING id, accepted_at
            `;
            await client.query(acceptanceSql, [jobId, artisanId]);
            
            // Assign artisan directly to job and move to STARTED state (artisan can move/start work)
            const updateSql = `
                UPDATE job_transactions
                SET artisan_id = $1,
                    current_state = 'STARTED',
                    updated_at = NOW()
                WHERE id = $2
                RETURNING id, current_state, artisan_id;
            `;
            
            const updateResult = await client.query(updateSql, [artisanId, jobId]);
            
            if (updateResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return next(new AppError("Failed to update job state.", 500));
            }
            
            await client.query('COMMIT');

            res.status(200).json({
                message: `Job ${jobId} successfully accepted. You can now start the work. Payment will be secured before completion.`,
                job_id: jobId,
                artisan_id: artisanId,
                new_state: updateResult.rows[0].current_state,
                next_step: "You can now move to the job site and start working. Client will complete payment before job completion."
            });
            
            return; // Exit early for DRAFT jobs
        }
        
        // Handle other states (ESCROW_PENDING, ESCROW_HELD) - legacy flow
        const normalizedState = (job.current_state || '').toString().trim().toUpperCase();
        if (normalizedState !== 'ESCROW_PENDING' && normalizedState !== 'ESCROW_HELD') {
            await client.query('ROLLBACK');
            return next(new AppError(`Job cannot be accepted in state: ${job.current_state}. Only DRAFT, ESCROW_PENDING, or ESCROW_HELD jobs can be accepted.`, 400));
        }
        
        // Check if job already has an artisan assigned
        if (job.artisan_id && job.artisan_id !== artisanId) {
            await client.query('ROLLBACK');
            return next(new AppError("Job has already been accepted by another artisan.", 409));
        }
        
        // Update job: assign artisan and move to STARTED state (if ESCROW_HELD) or keep ESCROW_PENDING
        const newState = job.current_state === 'ESCROW_HELD' ? 'STARTED' : 'ESCROW_PENDING';
        
        const updateSql = `
            UPDATE job_transactions
            SET artisan_id = $1,
                current_state = $2,
                updated_at = NOW()
            WHERE id = $3
            RETURNING id, current_state, artisan_id;
        `;
        
        const updateResult = await client.query(updateSql, [artisanId, newState, jobId]);
        
        await client.query('COMMIT');

        res.status(200).json({
            message: `Job ${jobId} successfully accepted. Funds remain secured in escrow.`,
            job_id: jobId,
            artisan_id: artisanId,
            new_state: updateResult.rows[0].current_state,
            next_step: newState === 'ESCROW_PENDING' 
                ? "Wait for client payment confirmation."
                : "You can now start the work."
        });

    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Job acceptance error:", e.message);
        return next(e);
    }
}));


// --- GET ARTISAN'S JOBS (Protected by Gig Gate) ---
// Query params: ?filter=all|active|in-process|completed|pending|matched|quoted
// - all: all jobs assigned to artisan
// - active: jobs in progress (MATCHED, AWAITING_PAYMENT, ESCROW_HELD, STARTED, IN_PROGRESS, COMPLETED_PENDING)
// - in-process: jobs currently being worked on (ESCROW_HELD, STARTED, IN_PROGRESS)
// - completed: jobs finished (PAYOUT_SUCCESS)
// - pending: jobs awaiting client approval (COMPLETED_PENDING)
// - matched: jobs where quote accepted, waiting for payment (MATCHED, AWAITING_PAYMENT)
// - quoted: jobs where artisan has submitted quotes (even if not assigned yet)
router.get('/my-jobs', authMiddleware, gigGateMiddleware, catchAsync(async (req, res, next) => {
    const artisanId = req.user.id;
    const client = req.dbClient;
    const { filter = 'all' } = req.query;
    
    // NO TRANSACTION NEEDED - this is a read-only query

    let sql;
    
    // Special handling for 'quoted' filter - shows jobs where artisan has submitted quotes
    if (filter === 'quoted') {
        sql = `
            SELECT DISTINCT
                jt.*,
                cp.full_name as client_name,
                cp.phone_primary as client_phone,
                cp.email as client_email,
                jq.status as quote_status,
                jq.quoted_fee_pesewas,
                jq.created_at as quote_submitted_at
            FROM job_transactions jt
            INNER JOIN job_quotes jq ON jt.id = jq.job_id
            LEFT JOIN client_profiles cp ON jt.client_id = cp.id
            WHERE jq.artisan_id = $1
            ORDER BY jq.created_at DESC
        `;
    } else {
        // Build WHERE clause based on filter for assigned jobs
        let stateFilter = '';
        if (filter === 'active' || filter === 'in-process') {
            // In-process: ESCROW_HELD (payment secured, can start) and STARTED (working)
            if (filter === 'in-process') {
                stateFilter = `AND jt.current_state IN ('ESCROW_HELD', 'STARTED', 'IN_PROGRESS')`;
            } else {
                // Active: all jobs that are not draft, cancelled, or completed
                stateFilter = `AND jt.current_state IN ('MATCHED', 'AWAITING_PAYMENT', 'ESCROW_HELD', 'STARTED', 'IN_PROGRESS', 'COMPLETED_PENDING')`;
            }
        } else if (filter === 'completed') {
            stateFilter = `AND jt.current_state = 'PAYOUT_SUCCESS'`;
        } else if (filter === 'pending') {
            stateFilter = `AND jt.current_state = 'COMPLETED_PENDING'`;
        } else if (filter === 'matched') {
            // Show matched jobs (quote accepted, waiting for payment)
            stateFilter = `AND jt.current_state IN ('MATCHED', 'AWAITING_PAYMENT')`;
        }

        sql = `
            SELECT
                jt.*,
                cp.full_name as client_name,
                cp.phone_primary as client_phone,
                cp.email as client_email
            FROM job_transactions jt
            LEFT JOIN client_profiles cp ON jt.client_id = cp.id
            WHERE jt.artisan_id = $1
            ${stateFilter}
            ORDER BY 
                CASE jt.current_state
                    WHEN 'STARTED' THEN 1
                    WHEN 'IN_PROGRESS' THEN 1
                    WHEN 'ESCROW_HELD' THEN 2
                    WHEN 'COMPLETED_PENDING' THEN 3
                    WHEN 'MATCHED' THEN 4
                    WHEN 'AWAITING_PAYMENT' THEN 4
                    ELSE 5
                END,
                jt.updated_at DESC
        `;
    }

    try {
        const result = await client.query(sql, [artisanId]);
        
        res.status(200).json({
            message: `Jobs for Artisan (filter: ${filter})`,
            filter: filter,
            count: result.rows.length,
            jobs: result.rows
        });
    } catch (e) {
        console.error("Failed to fetch artisan jobs:", e.message);
        return next(e);
    }
}));

// --- SELECT ARTISAN (Client selects preferred artisan from acceptances) ---
router.post('/:jobId/select-artisan', authMiddleware, catchAsync(async (req, res, next) => {
    const jobId = req.params.jobId;
    const clientId = req.user.id;
    const { artisan_id } = req.body;
    const client = req.dbClient;

    if (!artisan_id) {
        return next(new AppError("artisan_id is required.", 400));
    }

    try {
        await client.query('BEGIN');

        // Verify job exists and belongs to client
        const jobSql = `
            SELECT id, client_id, current_state
            FROM job_transactions
            WHERE id = $1
        `;
        const jobResult = await client.query(jobSql, [jobId]);

        if (jobResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return next(new AppError("Job not found.", 404));
        }

        const job = jobResult.rows[0];

        if (job.client_id !== clientId) {
            await client.query('ROLLBACK');
            return next(new AppError("Unauthorized to access this job.", 403));
        }

        // Check if job is in DRAFT state (should have artisan acceptances)
        if (job.current_state !== 'DRAFT') {
            await client.query('ROLLBACK');
            return next(new AppError(`Cannot select artisan for job in state: ${job.current_state}. Only DRAFT jobs with acceptances can have artisan selected.`, 400));
        }

        // Verify the artisan has accepted this job
        const acceptanceSql = `
            SELECT id FROM job_artisan_acceptances
            WHERE job_id = $1 AND artisan_id = $2
        `;
        const acceptanceResult = await client.query(acceptanceSql, [jobId, artisan_id]);

        if (acceptanceResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return next(new AppError("This artisan has not accepted this job.", 400));
        }

        // Mark this artisan as selected and update job
        await client.query(
            `UPDATE job_artisan_acceptances 
             SET is_selected = TRUE 
             WHERE job_id = $1 AND artisan_id = $2`,
            [jobId, artisan_id]
        );

        // Update job: assign artisan and move to MATCHED_PENDING_PAYMENT
        await client.query(
            `UPDATE job_transactions 
             SET artisan_id = $1, 
                 current_state = 'MATCHED_PENDING_PAYMENT',
                 updated_at = NOW()
             WHERE id = $2`,
            [artisan_id, jobId]
        );

        await client.query('COMMIT');

        res.status(200).json({
            message: "Artisan selected successfully. Please complete payment to secure funds.",
            job_id: jobId,
            artisan_id: artisan_id,
            new_state: 'MATCHED_PENDING_PAYMENT',
            next_step: "Complete payment to secure funds. The artisan will be notified once payment is confirmed."
        });

    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Artisan selection error:", e.message);
        return next(e);
    }
}));

// --- GET ARTISAN ACCEPTANCES FOR JOB (Client view) ---
router.get('/:jobId/acceptances', authMiddleware, catchAsync(async (req, res, next) => {
    const jobId = req.params.jobId;
    const clientId = req.user.id;
    const dbClient = req.dbClient;

    try {
        // Verify job exists and belongs to client
        const jobSql = `SELECT id, client_id, current_state FROM job_transactions WHERE id = $1`;
        const jobResult = await dbClient.query(jobSql, [jobId]);

        if (jobResult.rows.length === 0) {
            return next(new AppError("Job not found.", 404));
        }

        const job = jobResult.rows[0];
        if (job.client_id !== clientId) {
            return next(new AppError("Unauthorized to access this job.", 403));
        }

        // Get all artisan acceptances with artisan profile info
        const acceptancesSql = `
            SELECT 
                jaa.id,
                jaa.artisan_id,
                jaa.accepted_at,
                jaa.is_selected,
                ap.full_name as artisan_name,
                ap.phone_primary as artisan_phone,
                ap.profile_picture_url,
                ap.reputation_score,
                ap.tier_level
            FROM job_artisan_acceptances jaa
            JOIN artisan_profiles ap ON jaa.artisan_id = ap.id
            WHERE jaa.job_id = $1
            ORDER BY jaa.accepted_at ASC
        `;
        const acceptancesResult = await dbClient.query(acceptancesSql, [jobId]);

        res.status(200).json({
            message: "Artisan acceptances retrieved successfully.",
            job_id: jobId,
            acceptances: acceptancesResult.rows
        });

    } catch (e) {
        console.error("Failed to fetch acceptances:", e.message);
        return next(e);
    }
}));

// --- GET PAYMENT LINK FOR JOB (MUST BE BEFORE /:jobId route) ---
router.get('/:jobId/payment-link', authMiddleware, catchAsync(async (req, res, next) => {
    const jobId = req.params.jobId;
    const clientId = req.user.id;
    const client = req.dbClient;

    try {
        // First, do all reads WITHOUT transaction (to avoid holding transaction during external API call)
        // Verify job exists and belongs to client
        const jobSql = `
            SELECT id, client_id, current_state, paystack_reference_id, gross_fee_pesewas, warranty_fee_pesewas
            FROM job_transactions
            WHERE id = $1
        `;
        const jobResult = await client.query(jobSql, [jobId]);

        if (jobResult.rows.length === 0) {
            return next(new AppError("Job not found.", 404));
        }

        const job = jobResult.rows[0];

        if (job.client_id !== clientId) {
            return next(new AppError("Unauthorized to access this job.", 403));
        }

        // NEW WORKFLOW: Only allow payment for MATCHED_PENDING_PAYMENT (artisan accepted, waiting for payment)
        if (job.current_state !== 'MATCHED_PENDING_PAYMENT') {
            return next(new AppError(`Job is not in a state that requires payment. Current state: ${job.current_state}. Payment can be made after artisan accepts the job.`, 400));
        }
        
        // Ensure an artisan is assigned
        if (!job.artisan_id) {
            return next(new AppError(`Job requires artisan acceptance before payment.`, 400));
        }

        // Get client email and phone to regenerate payment link
        const identityService = require('../services/identityService');
        const clientEmail = await identityService.getClientEmailById(client, clientId);
        
        // Get client phone
        const clientSql = `SELECT phone_primary FROM client_profiles WHERE id = $1`;
        const clientResult = await client.query(clientSql, [clientId]);
        const clientPhone = clientResult.rows[0]?.phone_primary || null;

        // Calculate total amount client pays: artisan quote + warranty fee (15% markup)
        const totalClientPaysPesewas = parseInt(job.gross_fee_pesewas, 10) + parseInt(job.warranty_fee_pesewas, 10);

        // Regenerate payment link from Paystack (OUTSIDE transaction to avoid timeout)
        // Generate a unique reference ID for this payment link (Paystack doesn't allow duplicates)
        const uniqueReference = `${jobId}-${uuidv4()}`;
        
        const paystackService = require('../services/paystackService');
        let paystackResponse;
        try {
            paystackResponse = await paystackService.initiateCollection(
                uniqueReference, // Use unique reference to avoid duplicates
                totalClientPaysPesewas, // Client pays: artisan quote + warranty fee
                clientEmail,
                clientPhone
            );
        } catch (paystackError) {
            console.error("Paystack API error:", paystackError.message);
            return next(new AppError(`Failed to generate payment link: ${paystackError.message}`, 500));
        }

        // Now start transaction ONLY for the database update
        try {
            await client.query('BEGIN');

            // Update job with new paystack reference
            await client.query(
                `UPDATE job_transactions SET paystack_reference_id = $1 WHERE id = $2`,
                [paystackResponse.paystack_ref, jobId]
            );

            await client.query('COMMIT');

            res.status(200).json({
                message: "Payment link retrieved successfully.",
                payment_link: paystackResponse.authorization_url,
                job_id: jobId
            });
        } catch (dbError) {
            await client.query('ROLLBACK');
            console.error("Database update error:", dbError.message);
            // Even if DB update fails, return the payment link (it's already generated)
            res.status(200).json({
                message: "Payment link retrieved successfully (database update may have failed).",
                payment_link: paystackResponse.authorization_url,
                job_id: jobId,
                warning: "Database update may have failed. Payment link is still valid."
            });
        }

    } catch (e) {
        console.error("Failed to get payment link:", e.message);
        return next(e);
    }
}));

// --- GET ARTISAN'S QUOTES (Artisan views their own quotes) ---
// IMPORTANT: This must come BEFORE /:jobId route to avoid "my-quotes" being treated as a jobId
router.get('/my-quotes', authMiddleware, catchAsync(async (req, res, next) => {
    const artisanId = req.user.id;
    const client = req.dbClient;
    const filter = req.query.filter || 'all'; // all, pending, accepted, rejected
    
    try {
        const quotes = await jobQuoteService.getArtisanQuotes(client, artisanId, filter);
        
        res.status(200).json({
            quotes_count: quotes.length,
            quotes: quotes
        });
        
    } catch (e) {
        console.error("Failed to get artisan quotes:", e.message);
        return next(new AppError(e.message, 400));
    }
}));

// --- GET JOB DETAILS ---
router.get('/:jobId', authMiddleware, catchAsync(async (req, res, next) => {
    const jobId = req.params.jobId;
    const client = req.dbClient;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        // Use the new service method
        const job = await jobService.getJobDetails(client, jobId);
        
        if (!job) {
            return next(new AppError("Job not found.", 404));
        }
        
        // Authorization Logic
        if (userRole === 'client' && job.client_id !== userId) {
            return next(new AppError("Unauthorized access to this job.", 403));
        }
        
        if (userRole === 'artisan') {
            const isOpenForQuotes = ['OPEN_FOR_QUOTES', 'QUOTED'].includes(job.current_state);
            const isAssignedArtisan = job.artisan_id === userId;
            
            if (!isOpenForQuotes && !isAssignedArtisan) {
                return next(new AppError("Unauthorized access to this job.", 403));
            }
        }
        
        // Fix: Return 'data' key to match frontend expectation (response.data.data)
        res.status(200).json({
            status: 'success',
            data: job 
        });
        
    } catch (e) {
        console.error("Failed to fetch job details:", e.message);
        return next(e);
    }
}));

// --- REQUEST SIGN-OFF (Artisan requests client approval after uploading photos) ---
// NEW WORKFLOW: Replaces OTP system with in-app approval
router.post('/:jobId/request-signoff', authMiddleware, gigGateMiddleware, catchAsync(async (req, res, next) => {
    const jobId = req.params.jobId;
    const artisanId = req.user.id;
    const client = req.dbClient;
    
    const { photo_evidence_after_url, work_description } = req.body;

    try {
        await client.query('BEGIN');
        
        // Check if job exists and belongs to this artisan
        const checkSql = `
            SELECT current_state, client_id, photo_evidence_after_url
            FROM job_transactions
            WHERE id = $1 AND artisan_id = $2
        `;
        
        const checkResult = await client.query(checkSql, [jobId, artisanId]);
        
        if (checkResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return next(new AppError("Job not found or unauthorized.", 404));
        }
        
        const job = checkResult.rows[0];
        
        // NEW QUOTE WORKFLOW: Can request sign-off from IN_PROGRESS, ESCROW_HELD, or STARTED states
        if (!['IN_PROGRESS', 'ESCROW_HELD', 'STARTED'].includes(job.current_state)) {
            await client.query('ROLLBACK');
            return next(new AppError(`Cannot request sign-off in state: ${job.current_state}. Work must be in progress.`, 400));
        }
        
        // CRITICAL: Photo evidence is REQUIRED before sign-off
        const finalPhotoUrl = photo_evidence_after_url || job.photo_evidence_after_url;
        if (!finalPhotoUrl) {
            await client.query('ROLLBACK');
            return next(new AppError("After photos are required before requesting sign-off. Please upload work completion photos.", 400));
        }
        
        // Update job state to COMPLETED_PENDING and save photo
        const updateSql = `
            UPDATE job_transactions
            SET current_state = 'COMPLETED_PENDING',
                photo_evidence_after_url = $1,
                updated_at = NOW()
            WHERE id = $2
            RETURNING current_state, photo_evidence_after_url, client_id
        `;
        
        const updateResult = await client.query(updateSql, [finalPhotoUrl, jobId]);
        
        await client.query('COMMIT');
        
        // TODO: Send Push Notification to client
        console.log(`📬 TODO: Send push notification to client ${updateResult.rows[0].client_id} - Job ${jobId} ready for review`);
        
        res.status(200).json({
            message: "Sign-off requested successfully. Client has been notified to review your work.",
            job_id: jobId,
            new_state: 'COMPLETED_PENDING',
            photo_evidence_after_url: finalPhotoUrl,
            next_step: "Client will review photos and approve work in-app. Payment will be released automatically upon approval."
        });
        
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Failed to request sign-off:", e.message);
        return next(e);
    }
}));


// --- CLIENT JOBS (Get jobs created by a client) ---
// Query params: ?filter=all|active|in-process|pending|completed
// - all: all jobs created by client
// - active: jobs in progress (MATCHED_PENDING_PAYMENT, ESCROW_HELD, STARTED, COMPLETED_PENDING)
// - in-process: jobs currently being worked on (ESCROW_HELD, STARTED)
// - pending: jobs waiting for client approval (COMPLETED_PENDING)
// - completed: jobs finished (PAYOUT_SUCCESS)
router.get('/client/:clientId', authMiddleware, catchAsync(async (req, res, next) => {
    const requestedClientId = req.params.clientId;
    const client = req.dbClient;
    const currentUserId = req.user.id;
    const { filter = 'all' } = req.query;
    
    // Authorization: users can only view their own jobs
    if (requestedClientId !== currentUserId) {
        return next(new AppError("Unauthorized access to these jobs.", 403));
    }

    // Build WHERE clause based on filter
    let stateFilter = '';
    if (filter === 'active' || filter === 'in-process') {
        // In-process: ESCROW_HELD (payment secured, artisan can start) and STARTED (artisan working)
        if (filter === 'in-process') {
            stateFilter = `AND jt.current_state IN ('ESCROW_HELD', 'STARTED')`;
        } else {
            // Active: all jobs that are not draft, cancelled, or completed
            stateFilter = `AND jt.current_state IN ('MATCHED_PENDING_PAYMENT', 'ESCROW_HELD', 'STARTED', 'COMPLETED_PENDING')`;
        }
    } else if (filter === 'completed') {
        stateFilter = `AND jt.current_state = 'PAYOUT_SUCCESS'`;
    } else if (filter === 'pending') {
        stateFilter = `AND jt.current_state = 'COMPLETED_PENDING'`;
    } else if (filter === 'draft') {
        stateFilter = `AND jt.current_state = 'DRAFT'`;
    } else if (filter === 'awaiting-payment') {
        stateFilter = `AND jt.current_state = 'MATCHED_PENDING_PAYMENT'`;
    }

    try {
        const sql = `
            SELECT
                jt.*,
                ap.full_name as artisan_name,
                ap.phone_primary as artisan_phone,
                ap.profile_picture_url as artisan_picture,
                ap.reputation_score as artisan_rating
            FROM job_transactions jt
            LEFT JOIN artisan_profiles ap ON jt.artisan_id = ap.id
            WHERE jt.client_id = $1
            ${stateFilter}
            ORDER BY 
                CASE jt.current_state
                    WHEN 'COMPLETED_PENDING' THEN 1
                    WHEN 'STARTED' THEN 2
                    WHEN 'ESCROW_HELD' THEN 3
                    WHEN 'MATCHED_PENDING_PAYMENT' THEN 4
                    WHEN 'DRAFT' THEN 5
                    ELSE 6
                END,
                jt.updated_at DESC
        `;
        
        const result = await client.query(sql, [requestedClientId]);
        
        res.status(200).json({
            message: `Jobs for Client (filter: ${filter})`,
            filter: filter,
            count: result.rows.length,
            jobs: result.rows
        });
        
    } catch (e) {
        console.error("Failed to fetch client jobs:", e.message);
        return next(e);
    }
}));

// --- UPDATE JOB (Client can edit jobs in DRAFT or ESCROW_PENDING state) ---
router.put('/:jobId', authMiddleware, catchAsync(async (req, res, next) => {
    const jobId = req.params.jobId;
    const clientId = req.user.id;
    const client = req.dbClient;
    const updateData = req.body;

    // Only allow editing jobs in DRAFT or ESCROW_PENDING state
    // (jobs that haven't been accepted by an artisan or paid for)
    try {
        await client.query('BEGIN');

        // Verify job exists and belongs to client
        const checkSql = `
            SELECT client_id, current_state, artisan_id
            FROM job_transactions
            WHERE id = $1
        `;
        const checkResult = await client.query(checkSql, [jobId]);

        if (checkResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return next(new AppError("Job not found.", 404));
        }

        const job = checkResult.rows[0];

        if (job.client_id !== clientId) {
            await client.query('ROLLBACK');
            return next(new AppError("Unauthorized to edit this job.", 403));
        }

        // Only allow editing jobs that haven't been accepted or paid
        if (job.current_state !== 'DRAFT' && job.current_state !== 'ESCROW_PENDING') {
            await client.query('ROLLBACK');
            return next(new AppError(`Cannot edit job in ${job.current_state} state. Only DRAFT or ESCROW_PENDING jobs can be edited.`, 400));
        }

        // Build update query dynamically
        const updateFields = [];
        const updateValues = [];
        let paramCount = 1;

        // Allowed fields to update
        const allowedFields = ['gross_fee_pesewas', 'location_lat', 'location_lon', 'location_gps_address', 'job_description', 'photo_evidence_before_url'];
        
        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                updateFields.push(`${field} = $${paramCount}`);
                updateValues.push(updateData[field]);
                paramCount++;
            }
        }

        if (updateFields.length === 0) {
            await client.query('ROLLBACK');
            return next(new AppError("No valid fields to update.", 400));
        }

        updateFields.push('updated_at = NOW()');
        updateValues.push(jobId);

        const updateSql = `
            UPDATE job_transactions
            SET ${updateFields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await client.query(updateSql, updateValues);
        await client.query('COMMIT');

        res.status(200).json({
            message: "Job updated successfully.",
            job: result.rows[0]
        });

    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Failed to update job:", e.message);
        return next(e);
    }
}));

// --- DELETE JOB (Client can delete jobs in DRAFT or ESCROW_PENDING state) ---
router.delete('/:jobId', authMiddleware, catchAsync(async (req, res, next) => {
    const jobId = req.params.jobId;
    const clientId = req.user.id;
    const client = req.dbClient;

    // Only allow deleting jobs in DRAFT or ESCROW_PENDING state
    try {
        await client.query('BEGIN');

        // Verify job exists and belongs to client
        const checkSql = `
            SELECT client_id, current_state, artisan_id
            FROM job_transactions
            WHERE id = $1
        `;
        const checkResult = await client.query(checkSql, [jobId]);

        if (checkResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return next(new AppError("Job not found.", 404));
        }

        const job = checkResult.rows[0];

        if (job.client_id !== clientId) {
            await client.query('ROLLBACK');
            return next(new AppError("Unauthorized to delete this job.", 403));
        }

        // Only allow deleting jobs that haven't been accepted or paid
        if (job.current_state !== 'DRAFT' && job.current_state !== 'ESCROW_PENDING') {
            await client.query('ROLLBACK');
            return next(new AppError(`Cannot delete job in ${job.current_state} state. Only DRAFT or ESCROW_PENDING jobs can be deleted.`, 400));
        }

        // Delete the job
        const deleteSql = `DELETE FROM job_transactions WHERE id = $1 RETURNING id`;
        const result = await client.query(deleteSql, [jobId]);
        await client.query('COMMIT');

        res.status(200).json({
            message: "Job deleted successfully.",
            job_id: result.rows[0].id
        });

    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Failed to delete job:", e.message);
        return next(e);
    }
}));

// --- DISPUTE JOB ---
router.post('/:jobId/dispute', authMiddleware, catchAsync(async (req, res, next) => {
    const jobId = req.params.jobId;
    const { dispute_reason } = req.body;
    const userId = req.user.id;
    const client = req.dbClient;
    
    if (!dispute_reason || dispute_reason.length < 10) {
        return next(new AppError("Dispute reason must be at least 10 characters.", 400));
    }

    try {
        await client.query('BEGIN');
        
        // Check if job exists and user is involved
        const checkSql = `
            SELECT current_state, client_id, artisan_id
            FROM job_transactions
            WHERE id = $1
        `;
        
        const checkResult = await client.query(checkSql, [jobId]);
        
        if (checkResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return next(new AppError("Job not found.", 404));
        }
        
        const job = checkResult.rows[0];
        
        // Check if user is involved in this job
        if (job.client_id !== userId && job.artisan_id !== userId) {
            await client.query('ROLLBACK');
            return next(new AppError("Unauthorized to dispute this job.", 403));
        }
        
        // Update job state to DISPUTED
        const updateSql = `
            UPDATE job_transactions
            SET current_state = 'DISPUTED',
                updated_at = NOW()
            WHERE id = $1
            RETURNING current_state
        `;
        
        const updateResult = await client.query(updateSql, [jobId]);
        
        // TODO: Create dispute record in separate table (for future enhancement)
        // For now, we'll just change the state
        
        await client.query('COMMIT');
        
        res.status(200).json({
            message: "Job dispute initiated. Support will review the case.",
            job_id: jobId,
            new_state: updateResult.rows[0].current_state,
            dispute_reason: dispute_reason
        });
        
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Failed to dispute job:", e.message);
        return next(e);
    }
}));

// ============================================================================
// QUOTE SYSTEM ENDPOINTS (NEW)
// ============================================================================

// --- SUBMIT QUOTE (Artisan submits quote for a job) ---
router.post('/:jobId/submit-quote', authMiddleware, catchAsync(async (req, res, next) => {
    const jobId = req.params.jobId;
    const artisanId = req.user.id;
    const client = req.dbClient;
    const { quoted_fee_pesewas, quote_message, estimated_duration_hours } = req.body;
    
    // Validation
    if (!quoted_fee_pesewas || quoted_fee_pesewas < 1000 || quoted_fee_pesewas > 1000000) {
        return next(new AppError("Quote must be between GHS 10.00 and GHS 10,000.00", 400));
    }
    
    try {
        await client.query('BEGIN');
        
        const quote = await jobQuoteService.submitQuote(client, jobId, artisanId, {
            quoted_fee_pesewas: parseInt(quoted_fee_pesewas),
            quote_message,
            estimated_duration_hours: estimated_duration_hours ? parseInt(estimated_duration_hours) : null
        });
        
        await client.query('COMMIT');
        
        res.status(201).json({
            message: "Quote submitted successfully. Client will review and respond.",
            quote_id: quote.id,
            breakdown: {
                your_quote: quote.quoted_fee_pesewas,
                warranty_fee: quote.warranty_fee_pesewas,
                client_pays: quote.total_client_pays_pesewas,
                your_payout: quote.artisan_payout_pesewas,
                platform_commission: quote.platform_commission_pesewas,
                health_benefit: quote.riviaco_premium_pesewas
            }
        });
        
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Failed to submit quote:", e.message);
        return next(new AppError(e.message, 400));
    }
}));

// --- GET JOB QUOTES (Client views all quotes for their job) ---
router.get('/:jobId/quotes', authMiddleware, catchAsync(async (req, res, next) => {
    const jobId = req.params.jobId;
    const clientId = req.user.id;
    const client = req.dbClient;
    
    try {
        const quotes = await jobQuoteService.getJobQuotes(client, jobId, clientId);
        
        res.status(200).json({
            job_id: jobId,
            quotes_count: quotes.length,
            quotes: quotes
        });
        
    } catch (e) {
        console.error("Failed to get quotes:", e.message);
        return next(new AppError(e.message, e.message.includes("Unauthorized") ? 403 : 400));
    }
}));

// --- GET SINGLE QUOTE (For negotiation page) ---
router.get('/quotes/:quoteId', authMiddleware, catchAsync(async (req, res, next) => {
    const quoteId = req.params.quoteId;
    const userId = req.user.id;
    const userRole = req.user.role;
    const client = req.dbClient;
    
    try {
        // Fetch quote with artisan and job details
        const sql = `
            SELECT 
                jq.*,
                ap.full_name as artisan_name,
                ap.profile_picture_url as artisan_picture,
                ap.phone_primary as artisan_phone,
                ap.reputation_score as artisan_rating,
                jt.client_id,
                jt.job_description,
                jt.location_gps_address
            FROM job_quotes jq
            JOIN artisan_profiles ap ON jq.artisan_id = ap.id
            JOIN job_transactions jt ON jq.job_id = jt.id
            WHERE jq.id = $1
        `;
        
        const result = await client.query(sql, [quoteId]);
        
        if (result.rows.length === 0) {
            return next(new AppError('Quote not found', 404));
        }
        
        const quote = result.rows[0];
        
        // Authorization: client who owns the job or artisan who created the quote
        if (userRole === 'client' && quote.client_id !== userId) {
            return next(new AppError('Unauthorized access to this quote', 403));
        }
        if (userRole === 'artisan' && quote.artisan_id !== userId) {
            return next(new AppError('Unauthorized access to this quote', 403));
        }
        
        res.status(200).json({
            quote: quote
        });
        
    } catch (e) {
        console.error('Failed to get quote:', e.message);
        return next(e);
    }
}));

// --- ACCEPT QUOTE (Client selects an artisan's quote) ---
router.post('/:jobId/accept-quote', authMiddleware, catchAsync(async (req, res, next) => {
    const jobId = req.params.jobId;
    const clientId = req.user.id;
    const client = req.dbClient;
    const { quote_id } = req.body;
    
    if (!quote_id) {
        return next(new AppError("quote_id is required", 400));
    }
    
    let transactionStarted = false;
    
    try {
        // CRITICAL: Ensure no existing transaction before starting
        try {
            await client.query('ROLLBACK');
        } catch (e) {
            // Ignore if no transaction exists
        }
        
        // ============================================
        // PHASE 1: DATABASE OPERATIONS (FAST - < 100ms)
        // ============================================
        await client.query('BEGIN');
        transactionStarted = true;
        
        // Get quote details first to access total_client_pays_pesewas
        const quoteCheck = await client.query(
            `SELECT total_client_pays_pesewas, quoted_fee_pesewas, warranty_fee_pesewas
             FROM job_quotes
             WHERE id = $1`,
            [quote_id]
        );
        
        if (quoteCheck.rows.length === 0) {
            throw new Error("Quote not found");
        }
        
        const quote = quoteCheck.rows[0];
        
        // Update job state and accept quote (atomic DB operations only)
        const job = await jobQuoteService.acceptQuote(client, jobId, quote_id, clientId);
        
        // COMMIT immediately - close transaction as fast as possible
        await client.query('COMMIT');
        transactionStarted = false;
        
        // ============================================
        // PHASE 2: EXTERNAL API CALLS (AFTER COMMIT)
        // ============================================
        const paystackService = require('../services/paystackService');
        
        // Use total_client_pays_pesewas from quote (already calculated correctly)
        // Fallback to manual calculation if not available
        let totalAmount = parseInt(quote.total_client_pays_pesewas, 10);
        
        if (!totalAmount || isNaN(totalAmount)) {
            // Fallback: calculate manually
            const grossFee = parseInt(job.gross_fee_pesewas, 10) || 0;
            const warrantyFee = parseInt(job.warranty_fee_pesewas, 10) || 0;
            totalAmount = grossFee + warrantyFee;
        }
        
        // Validate total amount is reasonable (GHS 10 - GHS 10,000)
        if (totalAmount < 1000 || totalAmount > 10000000) {
            throw new Error(`Invalid payment amount: GHS ${(totalAmount / 100).toFixed(2)}. Amount must be between GHS 10.00 and GHS 100,000.00`);
        }
        
        const reference = `job_${jobId}_${Date.now()}`;
        
        let paymentLink;
        try {
            // Call Paystack AFTER transaction is committed
            const paystackResponse = await paystackService.initiateCollection({
                email: req.user.email || 'client@zolid.online',
                amount: totalAmount,
                reference: reference,
                metadata: {
                    job_id: jobId,
                    client_id: clientId,
                    artisan_id: job.artisan_id,
                    purpose: 'job_payment',
                    quote_id: quote_id
                }
            });
            
            // Extract authorization_url from Paystack response
            paymentLink = paystackResponse.authorization_url;
            
            if (!paymentLink) {
                throw new Error('Paystack did not return authorization_url');
            }
            
            // Update job with payment reference (separate, fast transaction using fresh connection)
            // Don't use the same client connection after commit - get a fresh one
            const updateClient = await require('../db/db').pool.connect();
            try {
                await updateClient.query(
                    `UPDATE job_transactions SET paystack_reference_id = $1, current_state = 'AWAITING_PAYMENT' WHERE id = $2`,
                    [reference, jobId]
                );
            } finally {
                updateClient.release();
            }
        } catch (paystackError) {
            // Paystack failed AFTER job was accepted - log error but don't fail the request
            // Job is already in MATCHED state, client can retry payment later
            console.error('Paystack payment link generation failed after quote acceptance:', paystackError.message);
            
            // Return success but indicate payment link generation failed
            return res.status(200).json({
                message: "Quote accepted. Payment link generation failed - please contact support.",
                job_id: jobId,
                artisan_id: job.artisan_id,
                payment_link: null,
                payment_error: paystackError.message,
                amount_to_pay_pesewas: totalAmount,
                amount_to_pay_ghs: (totalAmount / 100).toFixed(2),
                retry_payment: true
            });
        }
        
        // ============================================
        // SUCCESS RESPONSE
        // ============================================
        res.status(200).json({
            message: "Quote accepted. Please proceed to payment.",
            job_id: jobId,
            artisan_id: job.artisan_id,
            payment_link: paymentLink,
            amount_to_pay_pesewas: totalAmount,
            amount_to_pay_ghs: (totalAmount / 100).toFixed(2)
        });
        
    } catch (e) {
        // CRITICAL: Always rollback if transaction was started
        if (transactionStarted) {
            try {
                await client.query('ROLLBACK');
                transactionStarted = false;
            } catch (rollbackError) {
                console.error('CRITICAL: Failed to rollback transaction:', rollbackError.message);
            }
        }
        console.error("Failed to accept quote:", e.message);
        return next(new AppError(e.message, 400));
    }
}));

// --- WITHDRAW QUOTE (Artisan cancels their quote) ---
router.delete('/quotes/:quoteId', authMiddleware, catchAsync(async (req, res, next) => {
    const quoteId = req.params.quoteId;
    const artisanId = req.user.id;
    const client = req.dbClient;
    
    try {
        await client.query('BEGIN');
        
        const quote = await jobQuoteService.withdrawQuote(client, quoteId, artisanId);
        
        await client.query('COMMIT');
        
        res.status(200).json({
            message: "Quote withdrawn successfully",
            quote_id: quote.id
        });
        
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Failed to withdraw quote:", e.message);
        return next(new AppError(e.message, 400));
    }
}));

// --- EDIT QUOTE (Artisan updates their pending quote) ---
router.put('/quotes/:quoteId', authMiddleware, catchAsync(async (req, res, next) => {
    const quoteId = req.params.quoteId;
    const artisanId = req.user.id;
    const client = req.dbClient;
    const { quoted_fee_pesewas, quote_message, estimated_duration_hours } = req.body;
    
    if (!quoted_fee_pesewas || quoted_fee_pesewas < 1000 || quoted_fee_pesewas > 1000000) {
        return next(new AppError("Quote must be between GHS 10.00 and GHS 10,000.00", 400));
    }
    
    try {
        await client.query('BEGIN');
        
        const quote = await jobQuoteService.editQuote(client, quoteId, artisanId, {
            quoted_fee_pesewas: parseInt(quoted_fee_pesewas),
            quote_message,
            estimated_duration_hours: estimated_duration_hours ? parseInt(estimated_duration_hours) : null
        });
        
        await client.query('COMMIT');
        
        res.status(200).json({
            message: "Quote updated successfully",
            quote: quote,
            breakdown: {
                your_quote: quote.quoted_fee_pesewas,
                warranty_fee: quote.warranty_fee_pesewas,
                client_pays: quote.total_client_pays_pesewas,
                your_payout: quote.artisan_payout_pesewas
            }
        });
        
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Failed to edit quote:", e.message);
        return next(new AppError(e.message, 400));
    }
}));

// ============================================================================
// NEGOTIATION ENDPOINTS
// ============================================================================

// --- SEND COUNTER-OFFER (Client proposes different price) ---
router.post('/quotes/:quoteId/counter-offer', authMiddleware, catchAsync(async (req, res, next) => {
    const quoteId = req.params.quoteId;
    const clientId = req.user.id;
    const client = req.dbClient;
    const { offered_amount_pesewas, message } = req.body;
    
    if (!offered_amount_pesewas || offered_amount_pesewas < 1000 || offered_amount_pesewas > 1000000) {
        return next(new AppError('Counter-offer must be between GHS 10.00 and GHS 10,000.00', 400));
    }
    
    try {
        await client.query('BEGIN');
        
        const negotiation = await negotiationService.sendCounterOffer(client, quoteId, clientId, {
            offered_amount_pesewas: parseInt(offered_amount_pesewas),
            message
        });
        
        // Get artisan info for notification
        const quoteInfo = await client.query(
            `SELECT jq.artisan_id, cp.full_name as client_name
             FROM job_quotes jq
             JOIN job_transactions jt ON jq.job_id = jt.id
             JOIN client_profiles cp ON jt.client_id = cp.id
             WHERE jq.id = $1`,
            [quoteId]
        );
        
        if (quoteInfo.rows.length > 0) {
            await notificationService.notifyUser(
                client,
                quoteInfo.rows[0].artisan_id,
                'artisan',
                'COUNTER_OFFER',
                {
                    quote_id: quoteId,
                    negotiation_id: negotiation.id,
                    sender_name: quoteInfo.rows[0].client_name,
                    amount: offered_amount_pesewas,
                    round: negotiation.round_number,
                    click_action: `/quotes/${quoteId}/negotiation`
                }
            );
        }
        
        await client.query('COMMIT');
        
        res.status(201).json({
            message: 'Counter-offer sent to artisan',
            negotiation_id: negotiation.id,
            round: negotiation.round_number,
            your_offer: offered_amount_pesewas
        });
        
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Failed to send counter-offer:', e.message);
        return next(new AppError(e.message, 400));
    }
}));

// --- RESPOND TO COUNTER-OFFER (Artisan accepts/rejects/counters) ---
router.post('/negotiations/:negotiationId/respond', authMiddleware, catchAsync(async (req, res, next) => {
    const negotiationId = req.params.negotiationId;
    const artisanId = req.user.id;
    const client = req.dbClient;
    const { action, counter_amount_pesewas, message } = req.body;
    
    if (!['accept', 'reject', 'counter'].includes(action)) {
        return next(new AppError('Action must be: accept, reject, or counter', 400));
    }
    
    if (action === 'counter' && (!counter_amount_pesewas || counter_amount_pesewas < 1000)) {
        return next(new AppError('Counter amount is required and must be >= GHS 10.00', 400));
    }
    
    try {
        await client.query('BEGIN');
        
        const result = await negotiationService.respondToCounterOffer(client, negotiationId, artisanId, {
            action,
            counter_amount_pesewas: counter_amount_pesewas ? parseInt(counter_amount_pesewas) : null,
            message
        });
        
        // Get client info for notification
        const negotiationInfo = await client.query(
            `SELECT qn.quote_id, jt.client_id, jt.id as job_id, ap.full_name as artisan_name
             FROM quote_negotiations qn
             JOIN job_quotes jq ON qn.quote_id = jq.id
             JOIN job_transactions jt ON jq.job_id = jt.id
             JOIN artisan_profiles ap ON jq.artisan_id = ap.id
             WHERE qn.id = $1`,
            [negotiationId]
        );
        
        if (negotiationInfo.rows.length > 0) {
            const info = negotiationInfo.rows[0];
            
            if (action === 'accept') {
                await notificationService.notifyUser(
                    client,
                    info.client_id,
                    'client',
                    'QUOTE_ACCEPTED',
                    {
                        quote_id: info.quote_id,
                        artisan_name: info.artisan_name,
                        amount: result.negotiation.offered_amount_pesewas,
                        message: 'Artisan accepted your counter-offer!',
                        click_action: `/jobs/${info.job_id}/quotes`
                    }
                );
            } else if (action === 'counter') {
                await notificationService.notifyUser(
                    client,
                    info.client_id,
                    'client',
                    'COUNTER_OFFER',
                    {
                        quote_id: info.quote_id,
                        negotiation_id: result.negotiation.id,
                        sender_name: info.artisan_name,
                        amount: counter_amount_pesewas,
                        round: result.negotiation.round_number,
                        click_action: `/quotes/${info.quote_id}/negotiate`
                    }
                );
            }
        }
        
        await client.query('COMMIT');
        
        res.status(200).json({
            message: `Counter-offer ${action}ed successfully`,
            action: result.action,
            negotiation: result.negotiation
        });
        
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Failed to respond to counter-offer:', e.message);
        return next(new AppError(e.message, 400));
    }
}));

// --- GET NEGOTIATION HISTORY ---
router.get('/quotes/:quoteId/negotiations', authMiddleware, catchAsync(async (req, res, next) => {
    const quoteId = req.params.quoteId;
    const userId = req.user.id;
    const client = req.dbClient;
    
    try {
        const negotiations = await negotiationService.getNegotiationHistory(client, quoteId, userId);
        
        res.status(200).json({
            quote_id: quoteId,
            negotiations_count: negotiations.length,
            negotiations: negotiations
        });
        
    } catch (e) {
        console.error('Failed to get negotiation history:', e.message);
        return next(new AppError(e.message, 400));
    }
}));

// --- CLIENT ACCEPTS NEGOTIATION ---
router.post('/negotiations/:negotiationId/accept', authMiddleware, catchAsync(async (req, res, next) => {
    const negotiationId = req.params.negotiationId;
    const clientId = req.user.id;
    const client = req.dbClient;
    
    try {
        await client.query('BEGIN');
        
        const negotiation = await negotiationService.clientAcceptsNegotiation(client, negotiationId, clientId);
        
        // Notify artisan
        await notificationService.notifyUser(
            client,
            negotiation.artisan_id,
            'artisan',
            'QUOTE_ACCEPTED',
            {
                negotiation_id: negotiationId,
                amount: negotiation.offered_amount_pesewas,
                message: 'Client accepted your counter-offer!',
                click_action: `/dashboard`
            }
        );
        
        await client.query('COMMIT');
        
        res.status(200).json({
            message: 'Counter-offer accepted! You can now proceed to payment.',
            quote_id: negotiation.quote_id,
            final_amount: negotiation.offered_amount_pesewas
        });
        
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Failed to accept negotiation:', e.message);
        return next(new AppError(e.message, 400));
    }
}));

// ============================================================================
// ANALYTICS ENDPOINTS
// ============================================================================

// --- GET ANALYTICS (Admin/Platform view) ---
router.get('/analytics/platform', authMiddleware, catchAsync(async (req, res, next) => {
    // TODO: Add admin role check
    const client = req.dbClient;
    
    try {
        const metrics = await analyticsService.getPlatformAnalytics(client);
        
        res.status(200).json({
            message: 'Platform analytics retrieved',
            metrics: metrics
        });
        
    } catch (e) {
        console.error('Failed to get platform analytics:', e.message);
        return next(new AppError(e.message, 500));
    }
}));

// --- GET ARTISAN ANALYTICS ---
router.get('/analytics/my-stats', authMiddleware, catchAsync(async (req, res, next) => {
    const artisanId = req.user.id;
    const client = req.dbClient;
    
    try {
        const stats = await analyticsService.getArtisanAnalytics(client, artisanId);
        
        res.status(200).json({
            message: 'Your quote statistics',
            stats: stats
        });
        
    } catch (e) {
        console.error('Failed to get artisan analytics:', e.message);
        return next(new AppError(e.message, 500));
    }
}));

// ============================================================================
// FCM TOKEN MANAGEMENT
// ============================================================================

// --- REGISTER FCM TOKEN ---
router.post('/fcm/register', authMiddleware, catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    const userRole = req.user.role; // 'artisan' or 'client'
    const client = req.dbClient;
    const { fcm_token } = req.body;
    
    if (!fcm_token) {
        return next(new AppError('FCM token is required', 400));
    }
    
    try {
        await notificationService.registerFCMToken(client, userId, userRole, fcm_token);
        
        res.status(200).json({
            message: 'FCM token registered successfully',
            user_id: userId
        });
        
    } catch (e) {
        console.error('Failed to register FCM token:', e.message);
        return next(new AppError(e.message, 500));
    }
}));

router.patch('/:id/start', async (req, res, next) => {
    try {
        const job = await jobService.startJob(req.dbClient, req.user.id, req.params.id);
        res.json({ status: 'success', data: job });
    } catch (error) { next(error); }
});

module.exports = router;