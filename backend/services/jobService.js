// ===============================
// Imports
// ===============================
const { v4: uuidv4 } = require('uuid');

const PaystackService = require('./paystackService');
const { postAtomicTransaction } = require('./financeService');
const configService = require('./configService');
const benefitsService = require('./benefitsService');


// ===============================
// Pricing & Fee Calculation
// ===============================

/**
 * REVISED ZOLID PRICING MODEL (5% Commission)
 */
function calculateJobFees(grossFeePesewas) {
    if (grossFeePesewas <= 0) {
        throw new Error("Gross fee must be positive.");
    }

    const config = configService.getConfig();

    // Client markup (15%)
    const warrantyFee = Math.floor(grossFeePesewas * config.WARRANTY_FEE_PERCENT);
    const totalClientPaysPesewas = grossFeePesewas + warrantyFee;

    // Deductions from artisan quote
    const BENEFIT_DEDUCTION_PERCENT = 0.05;
    const benefitDeduction = Math.floor(grossFeePesewas * BENEFIT_DEDUCTION_PERCENT);
    const platformCommission = Math.floor(
        grossFeePesewas * config.PLATFORM_COMMISSION_PERCENT
    );

    const artisanPayoutNet =
        grossFeePesewas - benefitDeduction - platformCommission;

    if (artisanPayoutNet < 0) {
        throw new Error("Job value too low to cover deductions.");
    }

    return {
        gross_fee_pesewas: grossFeePesewas,
        total_client_pays_pesewas: totalClientPaysPesewas,
        warranty_fee_pesewas: warrantyFee,
        platform_commission_pesewas: platformCommission,
        riviaco_premium_pesewas: benefitDeduction,
        artisan_payout_pesewas: artisanPayoutNet,
    };
}


// ===============================
// Job Creation & Retrieval
// ===============================

async function createJob(client, jobRequest, clientEmail, clientId) {
    const {
        location_lat,
        location_lon,
        location_gps_address,
        job_description,
        photo_evidence_before_url,
        quotes_deadline,
    } = jobRequest;

    const jobId = uuidv4();

    const insertFields = [
        'id',
        'client_id',
        'current_state',
        'gross_fee_pesewas',
        'warranty_fee_pesewas',
        'artisan_payout_pesewas',
        'riviaco_premium_pesewas',
        'platform_commission_pesewas',
        'location_lat',
        'location_lon',
    ];

    const insertValues = [
        jobId,
        clientId,
        'OPEN_FOR_QUOTES',
        0,
        0,
        0,
        0,
        0,
        location_lat,
        location_lon,
    ];

    if (location_gps_address) {
        insertFields.push('location_gps_address');
        insertValues.push(location_gps_address);
    }
    if (job_description) {
        insertFields.push('job_description');
        insertValues.push(job_description);
    }
    if (photo_evidence_before_url) {
        insertFields.push('photo_evidence_before_url');
        insertValues.push(photo_evidence_before_url);
    }
    if (quotes_deadline) {
        insertFields.push('quotes_deadline');
        insertValues.push(quotes_deadline);
    }

    const placeholders = insertFields.map((_, i) => `$${i + 1}`).join(', ');

    const sql = `
        INSERT INTO job_transactions (${insertFields.join(', ')})
        VALUES (${placeholders})
        RETURNING id, current_state;
    `;

    await client.query(sql, insertValues);

    return {
        job_id: jobId,
        state: 'OPEN_FOR_QUOTES',
        message: 'Job posted successfully! Artisans can now submit quotes.',
    };
}

/**
 * Basic retrieval for internal logic (state checks, ownership)
 */
async function getJobById(client, jobId) {
    const result = await client.query(
        `SELECT * FROM job_transactions WHERE id = $1`,
        [jobId]
    );
    return result.rows[0] || null;
}

/**
 * Detailed retrieval for Frontend display (includes profiles and images)
 */
async function getJobDetails(client, jobId) {
    const sql = `
        SELECT
            jt.*,
            ap.full_name as artisan_name,
            ap.phone_primary as artisan_phone,
            ap.profile_picture_url as artisan_profile_picture_url,
            ap.reputation_score as artisan_rating,
            cp.full_name as client_name,
            cp.phone_primary as client_phone
        FROM job_transactions jt
        LEFT JOIN artisan_profiles ap ON jt.artisan_id = ap.id
        LEFT JOIN client_profiles cp ON jt.client_id = cp.id
        WHERE jt.id = $1
    `;
    const result = await client.query(sql, [jobId]);
    return result.rows[0] || null;
}


// ===============================
// OTP Utilities
// ===============================

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function generateJobOTP(client, jobId) {
    const job = await getJobById(client, jobId);

    if (!job) throw new Error("Job not found.");
    if (job.current_state !== 'COMPLETED_PENDING') {
        throw new Error("Job not ready for OTP.");
    }

    if (
        job.client_otp &&
        job.otp_expires_at &&
        new Date(job.otp_expires_at) > new Date()
    ) {
        return job.client_otp;
    }

    const otp = generateOTP();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);

    const result = await client.query(
        `
        UPDATE job_transactions
        SET client_otp = $1,
            otp_generated_at = $2,
            otp_expires_at = $3,
            updated_at = NOW()
        WHERE id = $4
        RETURNING client_otp;
        `,
        [otp, now, expiresAt, jobId]
    );

    return result.rows[0].client_otp;
}

async function validateJobOTP(client, jobId, otp) {
    const job = await getJobById(client, jobId);
    if (!job || !job.client_otp) return false;
    if (job.client_otp !== otp) return false;
    if (new Date(job.otp_expires_at) < new Date()) return false;
    return true;
}


// ===============================
// Job Lifecycle
// ===============================

async function startJob(client, artisanId, jobId) {
    const jobRes = await client.query(
        `SELECT * FROM job_transactions WHERE id = $1 AND artisan_id = $2`,
        [jobId, artisanId]
    );

    if (jobRes.rows.length === 0) {
        throw new Error('Job not found or unauthorized.');
    }

    if (jobRes.rows[0].current_state !== 'ESCROW_HELD') {
        throw new Error('Funds must be in escrow first.');
    }

    const result = await client.query(
        `
        UPDATE job_transactions
        SET current_state = 'STARTED',
            started_at = NOW(),
            updated_at = NOW()
        WHERE id = $1
        RETURNING *;
        `,
        [jobId]
    );

    return result.rows[0];
}


// ===============================
// Client Signoff & Ledger Posting
// ===============================

async function signoffAndPay(client, signoffRequest) {
    const job = await getJobById(client, signoffRequest.job_id);

    if (!job) throw new Error("Job not found.");
    if (job.current_state !== 'COMPLETED_PENDING') {
        throw new Error("Job not ready for signoff.");
    }
    if (job.client_id !== signoffRequest.client_id) {
        throw new Error("Unauthorized client.");
    }
    if (!job.photo_evidence_after_url) {
        throw new Error("Completion photos required.");
    }

    const totalEscrow =
        Number(job.gross_fee_pesewas) +
        Number(job.warranty_fee_pesewas);

    const transactionId = await postAtomicTransaction(client, {
        reference_id: job.id,
        description: `Client signoff for job ${job.id}`,
        metadata: {
            job_id: job.id,
            client_id: job.client_id,
            artisan_id: job.artisan_id,
        },
        postings: [
            { account_name: 'MoMo_Escrow_Liability', amount_pesewas: totalEscrow, direction: 'DEBIT' },
            { account_name: 'Revenue_Warranty_Fee', amount_pesewas: job.warranty_fee_pesewas, direction: 'CREDIT' },
            { account_name: 'Revenue_Artisan_Commission', amount_pesewas: job.platform_commission_pesewas, direction: 'CREDIT' },
            { account_name: 'Payable_Artisan_Net', amount_pesewas: job.artisan_payout_pesewas, direction: 'CREDIT' },
            { account_name: 'Payable_RiviaCo_Premium', amount_pesewas: job.riviaco_premium_pesewas, direction: 'CREDIT' },
        ],
    });

    try {
        await benefitsService.recordPremiumDeduction(
            client,
            job.artisan_id,
            job.id,
            job.riviaco_premium_pesewas
        );
    } catch (err) {
        console.error('Benefits recording failed:', err.message);
    }

    return { transaction_id: transactionId, job_data: job };
}


// ===============================
// Exports
// ===============================
module.exports = {
    calculateJobFees,
    createJob,
    getJobById,
    getJobDetails, // <--- EXPORTED NEW FUNCTION
    generateOTP,
    generateJobOTP,
    validateJobOTP,
    startJob,
    signoffAndPay,
};