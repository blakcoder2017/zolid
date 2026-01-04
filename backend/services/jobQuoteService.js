/**
 * Job Quote Service
 * Handles all quote-related business logic for the marketplace
 */

const configService = require('./configService');
const jobService = require('./jobService');

/**
 * Calculate all fees for a quote
 * @param {number} quotedFeePesewas - Artisan's quoted price in pesewas
 * @returns {object} Complete fee breakdown
 */
function calculateQuoteFees(quotedFeePesewas) {
    if (quotedFeePesewas < 1000 || quotedFeePesewas > 1000000) {
        throw new Error("Quote must be between GHS 10.00 and GHS 10,000.00");
    }

    const config = configService.getConfig();
    
    // Client pays: quoted fee + 15% warranty
    const warrantyFee = Math.floor(quotedFeePesewas * config.WARRANTY_FEE_PERCENT);
    const totalClientPaysPesewas = quotedFeePesewas + warrantyFee;
    
    // Artisan deductions: 5% benefit + 5% commission
    const BENEFIT_DEDUCTION_PERCENT = 0.05;
    const benefitDeduction = Math.floor(quotedFeePesewas * BENEFIT_DEDUCTION_PERCENT);
    const platformCommission = Math.floor(quotedFeePesewas * config.PLATFORM_COMMISSION_PERCENT);
    const riviacoPremium = benefitDeduction;
    
    // Artisan net payout
    const artisanPayoutNet = quotedFeePesewas - platformCommission - riviacoPremium;
    
    if (artisanPayoutNet < 0) {
        throw new Error("Quote too low to cover platform fees");
    }
    
    return {
        quoted_fee_pesewas: quotedFeePesewas,
        warranty_fee_pesewas: warrantyFee,
        total_client_pays_pesewas: totalClientPaysPesewas,
        artisan_payout_pesewas: artisanPayoutNet,
        platform_commission_pesewas: platformCommission,
        riviaco_premium_pesewas: riviacoPremium
    };
}

/**
 * Submit a new quote for a job
 * @param {object} client - Database client
 * @param {string} jobId - Job ID
 * @param {string} artisanId - Artisan ID
 * @param {object} quoteData - Quote details
 * @returns {object} Created quote
 */
async function submitQuote(client, jobId, artisanId, quoteData) {
    // 1. Validate job exists and is open for quotes
    const jobCheck = await client.query(
        `SELECT id, current_state, quotes_deadline, max_quotes, quote_count, client_id
         FROM job_transactions 
         WHERE id = $1`,
        [jobId]
    );
    
    if (jobCheck.rows.length === 0) {
        throw new Error("Job not found");
    }
    
    const job = jobCheck.rows[0];
    
    // Check if client is trying to quote their own job
    if (job.client_id === artisanId) {
        throw new Error("Cannot quote your own job");
    }
    
    // Check if job is open for quotes
    if (job.current_state !== 'DRAFT' && job.current_state !== 'OPEN_FOR_QUOTES' && job.current_state !== 'QUOTED') {
        throw new Error(`Job is no longer accepting quotes. Current state: ${job.current_state}`);
    }
    
    // Check quote deadline
    if (job.quotes_deadline && new Date(job.quotes_deadline) < new Date()) {
        throw new Error("Quote deadline has passed");
    }
    
    // Check max quotes limit
    if (job.quote_count >= job.max_quotes) {
        throw new Error(`Maximum number of quotes (${job.max_quotes}) reached for this job`);
    }
    
    // 2. Check if artisan already quoted
    const existingQuote = await client.query(
        `SELECT id, status FROM job_quotes 
         WHERE job_id = $1 AND artisan_id = $2`,
        [jobId, artisanId]
    );
    
    if (existingQuote.rows.length > 0) {
        const existing = existingQuote.rows[0];
        if (existing.status === 'WITHDRAWN') {
            // Allow re-quoting if previously withdrawn
        } else {
            throw new Error("You have already submitted a quote for this job. Use edit endpoint to modify it.");
        }
    }
    
    // 3. Calculate fees
    const fees = calculateQuoteFees(quoteData.quoted_fee_pesewas);
    
    // 4. Create quote
    const insertSql = `
        INSERT INTO job_quotes (
            job_id, artisan_id, 
            quoted_fee_pesewas, quote_message, estimated_duration_hours,
            warranty_fee_pesewas, total_client_pays_pesewas, 
            artisan_payout_pesewas, platform_commission_pesewas, riviaco_premium_pesewas,
            status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING')
        ON CONFLICT (job_id, artisan_id) 
        DO UPDATE SET
            quoted_fee_pesewas = EXCLUDED.quoted_fee_pesewas,
            quote_message = EXCLUDED.quote_message,
            estimated_duration_hours = EXCLUDED.estimated_duration_hours,
            warranty_fee_pesewas = EXCLUDED.warranty_fee_pesewas,
            total_client_pays_pesewas = EXCLUDED.total_client_pays_pesewas,
            artisan_payout_pesewas = EXCLUDED.artisan_payout_pesewas,
            platform_commission_pesewas = EXCLUDED.platform_commission_pesewas,
            riviaco_premium_pesewas = EXCLUDED.riviaco_premium_pesewas,
            status = 'PENDING',
            updated_at = NOW()
        RETURNING *`;
    
    const quoteResult = await client.query(insertSql, [
        jobId, artisanId,
        fees.quoted_fee_pesewas, quoteData.quote_message, quoteData.estimated_duration_hours,
        fees.warranty_fee_pesewas, fees.total_client_pays_pesewas,
        fees.artisan_payout_pesewas, fees.platform_commission_pesewas, fees.riviaco_premium_pesewas
    ]);
    
    // 5. Update job state and quote count
    const updateJobSql = `
        UPDATE job_transactions 
        SET current_state = CASE 
                WHEN current_state = 'DRAFT' THEN 'OPEN_FOR_QUOTES'
                ELSE current_state
            END,
            quote_count = (SELECT COUNT(*) FROM job_quotes WHERE job_id = $1 AND status = 'PENDING'),
            updated_at = NOW()
        WHERE id = $1
        RETURNING current_state, quote_count`;
    
    const jobUpdate = await client.query(updateJobSql, [jobId]);
    
    // Update state if this is the first quote
    if (jobUpdate.rows[0].quote_count === 1 && jobUpdate.rows[0].current_state === 'OPEN_FOR_QUOTES') {
        await client.query(
            `UPDATE job_transactions SET current_state = 'QUOTED' WHERE id = $1`,
            [jobId]
        );
    }
    
    return quoteResult.rows[0];
}

/**
 * Get all quotes for a job (client view)
 * @param {object} client - Database client
 * @param {string} jobId - Job ID
 * @param {string} clientId - Client ID (for authorization)
 * @returns {array} List of quotes with artisan details
 */
async function getJobQuotes(client, jobId, clientId) {
    // Verify client owns this job
    const jobCheck = await client.query(
        `SELECT client_id FROM job_transactions WHERE id = $1`,
        [jobId]
    );
    
    if (jobCheck.rows.length === 0) {
        throw new Error("Job not found");
    }
    
    if (jobCheck.rows[0].client_id !== clientId) {
        throw new Error("Unauthorized to view quotes for this job");
    }
    
    // Get all pending quotes with artisan details
    const sql = `
        SELECT 
            jq.*,
            ap.full_name as artisan_name,
            ap.profile_picture_url as artisan_picture,
            ap.phone_primary as artisan_phone,
            COALESCE(ar.avg_rating, 0) as artisan_rating,
            COALESCE(ar.total_reviews, 0) as artisan_reviews,
            (SELECT COUNT(*) FROM job_transactions jt 
             WHERE jt.artisan_id = ap.id 
             AND jt.current_state = 'PAYOUT_SUCCESS') as completed_jobs
        FROM job_quotes jq
        JOIN artisan_profiles ap ON jq.artisan_id = ap.id
        LEFT JOIN (
            SELECT artisan_id, 
                   AVG(rating) as avg_rating,
                   COUNT(*) as total_reviews
            FROM artisan_reviews
            GROUP BY artisan_id
        ) ar ON ap.id = ar.artisan_id
        WHERE jq.job_id = $1 
        AND jq.status = 'PENDING'
        ORDER BY jq.quoted_fee_pesewas ASC, ar.avg_rating DESC
    `;
    
    const result = await client.query(sql, [jobId]);
    return result.rows;
}

/**
 * Accept a quote (client selects an artisan)
 * @param {object} client - Database client
 * @param {string} jobId - Job ID
 * @param {string} quoteId - Quote ID to accept
 * @param {string} clientId - Client ID (for authorization)
 * @returns {object} Updated job with payment details
 */
async function acceptQuote(client, jobId, quoteId, clientId) {
    // 1. Verify quote exists and belongs to this job WITH ROW-LEVEL LOCK to prevent concurrent modifications
    // Use SELECT FOR UPDATE to lock the quote row (prevents concurrent acceptance)
    const quoteCheck = await client.query(
        `SELECT jq.*, jt.client_id, jt.current_state, jq.total_client_pays_pesewas
         FROM job_quotes jq
         JOIN job_transactions jt ON jq.job_id = jt.id
         WHERE jq.id = $1 AND jq.job_id = $2
         FOR UPDATE OF jq`,
        [quoteId, jobId]
    );
    
    if (quoteCheck.rows.length === 0) {
        throw new Error("Quote not found");
    }
    
    const quote = quoteCheck.rows[0];
    
    // 2. Verify client authorization
    if (quote.client_id !== clientId) {
        throw new Error("Unauthorized to accept this quote");
    }
    
    // 3. Verify job state
    if (quote.current_state !== 'OPEN_FOR_QUOTES' && quote.current_state !== 'QUOTED') {
        throw new Error(`Cannot accept quote. Job state: ${quote.current_state}`);
    }
    
    // 4. Verify quote status
    if (quote.status !== 'PENDING') {
        throw new Error(`Quote is no longer available. Status: ${quote.status}`);
    }
    
    // 5. Update quote status to ACCEPTED (now locked, so this should be fast)
    await client.query(
        `UPDATE job_quotes SET status = 'ACCEPTED', updated_at = NOW() WHERE id = $1`,
        [quoteId]
    );
    
    // 6. Reject all other quotes for this job
    await client.query(
        `UPDATE job_quotes 
         SET status = 'REJECTED', 
             rejection_reason = 'Client selected another artisan',
             updated_at = NOW()
         WHERE job_id = $1 AND id != $2 AND status = 'PENDING'`,
        [jobId, quoteId]
    );
    
    // 7. Update job with selected quote details
    const updateJobSql = `
        UPDATE job_transactions
        SET selected_quote_id = $1,
            artisan_id = $2,
            gross_fee_pesewas = $3,
            warranty_fee_pesewas = $4,
            platform_commission_pesewas = $5,
            riviaco_premium_pesewas = $6,
            artisan_payout_pesewas = $7,
            current_state = 'MATCHED',
            updated_at = NOW()
        WHERE id = $8
        RETURNING *`;
    
    const jobResult = await client.query(updateJobSql, [
        quoteId,
        quote.artisan_id,
        quote.quoted_fee_pesewas,
        quote.warranty_fee_pesewas,
        quote.platform_commission_pesewas,
        quote.riviaco_premium_pesewas,
        quote.artisan_payout_pesewas,
        jobId
    ]);
    
    // 8. Record acceptance in job_artisan_acceptances table (for tracking/history)
    await client.query(
        `INSERT INTO job_artisan_acceptances (job_id, artisan_id, is_selected)
         VALUES ($1, $2, TRUE)
         ON CONFLICT (job_id, artisan_id) 
         DO UPDATE SET is_selected = TRUE, accepted_at = NOW()`,
        [jobId, quote.artisan_id]
    );
    
    // Notification will be sent via background task service (not here)
    
    return jobResult.rows[0];
}

/**
 * Withdraw a quote (artisan cancels their quote)
 * @param {object} client - Database client
 * @param {string} quoteId - Quote ID
 * @param {string} artisanId - Artisan ID (for authorization)
 */
async function withdrawQuote(client, quoteId, artisanId) {
    const result = await client.query(
        `UPDATE job_quotes 
         SET status = 'WITHDRAWN', updated_at = NOW()
         WHERE id = $1 AND artisan_id = $2 AND status = 'PENDING'
         RETURNING *`,
        [quoteId, artisanId]
    );
    
    if (result.rows.length === 0) {
        throw new Error("Quote not found or cannot be withdrawn");
    }
    
    // Update job quote count
    await client.query(
        `UPDATE job_transactions 
         SET quote_count = (SELECT COUNT(*) FROM job_quotes WHERE job_id = $1 AND status = 'PENDING')
         WHERE id = $1`,
        [result.rows[0].job_id]
    );
    
    return result.rows[0];
}

/**
 * Edit a pending quote
 * @param {object} client - Database client
 * @param {string} quoteId - Quote ID
 * @param {string} artisanId - Artisan ID (for authorization)
 * @param {object} updates - Updated quote data
 */
async function editQuote(client, quoteId, artisanId, updates) {
    // 1. Verify quote exists and is editable
    const quoteCheck = await client.query(
        `SELECT * FROM job_quotes WHERE id = $1 AND artisan_id = $2 AND status = 'PENDING'`,
        [quoteId, artisanId]
    );
    
    if (quoteCheck.rows.length === 0) {
        throw new Error("Quote not found or cannot be edited");
    }
    
    // 2. Recalculate fees if price changed
    const fees = calculateQuoteFees(updates.quoted_fee_pesewas);
    
    // 3. Update quote
    const updateSql = `
        UPDATE job_quotes
        SET quoted_fee_pesewas = $1,
            quote_message = $2,
            estimated_duration_hours = $3,
            warranty_fee_pesewas = $4,
            total_client_pays_pesewas = $5,
            artisan_payout_pesewas = $6,
            platform_commission_pesewas = $7,
            riviaco_premium_pesewas = $8,
            updated_at = NOW()
        WHERE id = $9
        RETURNING *`;
    
    const result = await client.query(updateSql, [
        fees.quoted_fee_pesewas,
        updates.quote_message,
        updates.estimated_duration_hours,
        fees.warranty_fee_pesewas,
        fees.total_client_pays_pesewas,
        fees.artisan_payout_pesewas,
        fees.platform_commission_pesewas,
        fees.riviaco_premium_pesewas,
        quoteId
    ]);
    
    return result.rows[0];
}

/**
 * Get artisan's own quotes
 * @param {object} client - Database client
 * @param {string} artisanId - Artisan ID
 * @param {string} filter - Filter: 'all', 'pending', 'accepted', 'rejected'
 */
async function getArtisanQuotes(client, artisanId, filter = 'all') {
    let statusFilter = '';
    if (filter === 'pending') statusFilter = `AND jq.status = 'PENDING'`;
    else if (filter === 'accepted') statusFilter = `AND jq.status = 'ACCEPTED'`;
    else if (filter === 'rejected') statusFilter = `AND jq.status = 'REJECTED'`;
    
    const sql = `
        SELECT 
            jq.*,
            jt.job_description,
            jt.location_gps_address,
            jt.current_state as job_state,
            cp.full_name as client_name,
            cp.phone_primary as client_phone
        FROM job_quotes jq
        JOIN job_transactions jt ON jq.job_id = jt.id
        JOIN client_profiles cp ON jt.client_id = cp.id
        WHERE jq.artisan_id = $1
        ${statusFilter}
        ORDER BY jq.created_at DESC
    `;
    
    const result = await client.query(sql, [artisanId]);
    return result.rows;
}

module.exports = {
    calculateQuoteFees,
    submitQuote,
    getJobQuotes,
    acceptQuote,
    withdrawQuote,
    editQuote,
    getArtisanQuotes
};
