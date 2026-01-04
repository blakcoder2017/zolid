// const { v4: uuidv4 } = require('uuid');
// const PaystackService = require('./paystackService');
// const RiviaService = require('./riviacoService');
// const RiviaCardService = require('./riviaCardService');

// /**
//  * Records a RiviaCo premium deduction for an artisan after job sign-off.
//  * F.S.4 - Benefits Module: Accumulates premiums for batch remittance.
//  * For Standard Plan: Also tracks monthly contributions (20 cedis/month = 2000 pesewas/month toward 500 GHS/year).
//  * 
//  * @param {object} client - Database client (within a transaction)
//  * @param {string} artisanId - UUID of the artisan
//  * @param {string} jobId - UUID of the job
//  * @param {number} premiumAmountPesewas - Premium amount in pesewas (typically 5% of job quote)
//  * @returns {string} The ledger_id of the created record
//  */
// async function recordPremiumDeduction(client, artisanId, jobId, premiumAmountPesewas) {
//     if (!artisanId || !jobId || premiumAmountPesewas <= 0) {
//         throw new Error("Invalid parameters for premium deduction recording.");
//     }

//     // Record premium in benefits ledger
//     const sql = `
//         INSERT INTO benefits_ledger (
//             artisan_id, job_id, premium_amount_pesewas, status
//         )
//         VALUES ($1, $2, $3, 'PENDING')
//         RETURNING ledger_id;
//     `;

//     const result = await client.query(sql, [artisanId, jobId, premiumAmountPesewas]);
//     const ledgerId = result.rows[0].ledger_id;
    
//     // For Standard Plan: Track contribution toward annual fee (500 GHS = 50000 pesewas)
//     // Each premium payment contributes toward the annual fee (20 cedis/month = 2000 pesewas/month)
//     // We accumulate the premium amount (which is 5% of job quote, typically ~20 cedis for 400 GHS job)
//     const updateContributionSql = `
//         UPDATE artisan_profiles
//         SET riviaco_standard_plan_contribution_pesewas = 
//             COALESCE(riviaco_standard_plan_contribution_pesewas, 0) + $1,
//             updated_at = NOW()
//         WHERE id = $2 
//           AND riviaco_plan = 'STANDARD'
//         RETURNING riviaco_standard_plan_contribution_pesewas;
//     `;
    
//     // This is non-critical - if it fails, we continue (contribution tracking can be fixed later)
//     try {
//         await client.query(updateContributionSql, [premiumAmountPesewas, artisanId]);
//     } catch (error) {
//         console.warn(`Failed to update Standard Plan contribution for artisan ${artisanId}:`, error.message);
//         // Don't throw - contribution tracking is non-critical
//     }
    
//     return ledgerId;
// }

// /**
//  * Gets all pending premium deductions for a specific artisan.
//  * 
//  * @param {object} client - Database client
//  * @param {string} artisanId - UUID of the artisan
//  * @returns {Array} Array of pending premium records
//  */
// async function getPendingPremiums(client, artisanId) {
//     const sql = `
//         SELECT 
//             ledger_id, job_id, premium_amount_pesewas, created_at
//         FROM benefits_ledger
//         WHERE artisan_id = $1 AND status = 'PENDING'
//         ORDER BY created_at ASC;
//     `;

//     const result = await client.query(sql, [artisanId]);
//     return result.rows;
// }

// /**
//  * Gets all pending premiums across all artisans for batch remittance.
//  * 
//  * @param {object} client - Database client
//  * @returns {Array} Array of all pending premium records
//  */
// async function getAllPendingPremiums(client) {
//     const sql = `
//         SELECT 
//             bl.ledger_id, bl.artisan_id, bl.job_id, bl.premium_amount_pesewas, bl.created_at,
//             ap.full_name as artisan_name, ap.riviaco_policy_id
//         FROM benefits_ledger bl
//         JOIN artisan_profiles ap ON bl.artisan_id = ap.id
//         WHERE bl.status = 'PENDING'
//         ORDER BY bl.created_at ASC;
//     `;

//     const result = await client.query(sql);
//     return result.rows;
// }

// /**
//  * Creates a remittance batch for processing.
//  * F.S.4 - Batch Remittance: Creates a batch record for scheduled remittance.
//  * 
//  * @param {object} client - Database client (within a transaction)
//  * @param {string} partnerName - Partner name (e.g., 'RiviaCo')
//  * @param {number} totalAmountPesewas - Total amount to remit
//  * @param {Date} scheduledDate - Date when batch should be processed
//  * @returns {string} The batch_id
//  */
// async function createRemittanceBatch(client, partnerName, totalAmountPesewas, scheduledDate) {
//     const sql = `
//         INSERT INTO remittance_batch (
//             partner_name, total_amount_pesewas, scheduled_date, status
//         )
//         VALUES ($1, $2, $3, 'PENDING')
//         RETURNING batch_id;
//     `;

//     const result = await client.query(sql, [partnerName, totalAmountPesewas, scheduledDate]);
//     return result.rows[0].batch_id;
// }

// /**
//  * Links pending premiums to a remittance batch.
//  * 
//  * @param {object} client - Database client (within a transaction)
//  * @param {string} batchId - UUID of the remittance batch
//  * @param {Array<string>} ledgerIds - Array of ledger IDs to link
//  */
// async function linkPremiumsToBatch(client, batchId, ledgerIds) {
//     if (!ledgerIds || ledgerIds.length === 0) {
//         return;
//     }

//     const placeholders = ledgerIds.map((_, index) => `$${index + 2}`).join(',');
//     const sql = `
//         UPDATE benefits_ledger
//         SET remittance_batch_id = $1
//         WHERE ledger_id IN (${placeholders})
//         AND status = 'PENDING';
//     `;

//     await client.query(sql, [batchId, ...ledgerIds]);
// }

// /**
//  * Processes a remittance batch by executing Paystack transfer to partner.
//  * F.S.4 - Batch Remittance: Executes the actual remittance via Paystack.
//  * 
//  * @param {object} client - Database client (within a transaction)
//  * @param {string} batchId - UUID of the remittance batch
//  * @param {string} partnerRecipientCode - Paystack recipient code for the partner
//  * @returns {object} Result with transfer reference
//  */
// async function processRemittanceBatch(client, batchId, partnerRecipientCode) {
//     // Get batch details
//     const batchSql = `
//         SELECT batch_id, partner_name, total_amount_pesewas
//         FROM remittance_batch
//         WHERE batch_id = $1 AND status = 'PENDING';
//     `;
    
//     const batchResult = await client.query(batchSql, [batchId]);
//     if (batchResult.rows.length === 0) {
//         throw new Error("Remittance batch not found or already processed.");
//     }

//     const batch = batchResult.rows[0];

//     // Update batch status to PROCESSING
//     await client.query(
//         `UPDATE remittance_batch SET status = 'PROCESSING', updated_at = NOW() WHERE batch_id = $1`,
//         [batchId]
//     );

//     try {
//         // Execute Paystack transfer
//         const transferResult = await PaystackService.initializeTransfer(
//             partnerRecipientCode,
//             batch.total_amount_pesewas,
//             `ZOLID ${batch.partner_name} Batch Remittance ${batchId}`,
//             batchId
//         );

//         // Update batch with transfer reference
//         await client.query(
//             `UPDATE remittance_batch 
//              SET status = 'SUCCESS', 
//                  paystack_transfer_ref = $1,
//                  paystack_batch_code = $2,
//                  processed_at = NOW(),
//                  updated_at = NOW()
//              WHERE batch_id = $3`,
//             [
//                 transferResult.reference || transferResult.paystack_transfer_id,
//                 transferResult.transfer_code || null,
//                 batchId
//             ]
//         );

//         // Mark linked premiums as REMITTED
//         await client.query(
//             `UPDATE benefits_ledger 
//              SET status = 'REMITTED', remitted_at = NOW()
//              WHERE remittance_batch_id = $1`,
//             [batchId]
//         );

//         return {
//             batch_id: batchId,
//             status: 'SUCCESS',
//             transfer_reference: transferResult.reference || transferResult.paystack_transfer_id
//         };

//     } catch (error) {
//         // Update batch status to FAILED
//         await client.query(
//             `UPDATE remittance_batch 
//              SET status = 'FAILED', 
//                  error_message = $1,
//                  updated_at = NOW()
//              WHERE batch_id = $2`,
//             [error.message, batchId]
//         );
//         throw error;
//     }
// }

// /**
//  * Gets remittance batches by status.
//  * 
//  * @param {object} client - Database client
//  * @param {string} status - Status filter (optional)
//  * @param {string} partnerName - Partner name filter (optional)
//  * @returns {Array} Array of remittance batches
//  */
// async function getRemittanceBatches(client, status = null, partnerName = null) {
//     let sql = `
//         SELECT 
//             rb.*,
//             COUNT(bl.ledger_id) as premium_count
//         FROM remittance_batch rb
//         LEFT JOIN benefits_ledger bl ON rb.batch_id = bl.remittance_batch_id
//         WHERE 1=1
//     `;
//     const params = [];
//     let paramCount = 1;

//     if (status) {
//         sql += ` AND rb.status = $${paramCount}`;
//         params.push(status);
//         paramCount++;
//     }

//     if (partnerName) {
//         sql += ` AND rb.partner_name = $${paramCount}`;
//         params.push(partnerName);
//         paramCount++;
//     }

//     sql += ` GROUP BY rb.batch_id ORDER BY rb.created_at DESC;`;

//     const result = await client.query(sql, params);
//     return result.rows;
// }

// /**
//  * Calculates total pending premiums for a partner.
//  * Used for batch remittance preparation.
//  * 
//  * @param {object} client - Database client
//  * @param {string} partnerName - Partner name (e.g., 'RiviaCo')
//  * @returns {number} Total pending amount in pesewas
//  */
// async function getTotalPendingPremiums(client, partnerName = 'RiviaCo') {
//     // For now, we only handle RiviaCo. This can be extended for other partners.
//     const sql = `
//         SELECT COALESCE(SUM(premium_amount_pesewas), 0) as total_pending
//         FROM benefits_ledger
//         WHERE status = 'PENDING';
//     `;

//     const result = await client.query(sql);
//     return parseInt(result.rows[0].total_pending, 10);
// }

// /**
//  * Gets artisan's benefits summary.
//  * F.A.6 - Benefits Dashboard: Shows RiviaCo status and earnings.
//  * 
//  * @param {object} client - Database client
//  * @param {string} artisanId - UUID of the artisan
//  * @returns {object} Benefits summary
//  */
// async function getArtisanBenefitsSummary(client, artisanId) {
//     // Get artisan profile with RiviaCo plan info
//     const profileSql = `
//         SELECT 
//             riviaco_policy_id, 
//             riviaco_plan,
//             riviaco_enrollment_date,
//             riviaco_standard_plan_contribution_pesewas,
//             full_name
//         FROM artisan_profiles
//         WHERE id = $1;
//     `;
//     const profileResult = await client.query(profileSql, [artisanId]);
    
//     if (profileResult.rows.length === 0) {
//         throw new Error("Artisan profile not found.");
//     }

//     const profile = profileResult.rows[0];

//     // Get total premiums paid (from benefits_ledger - these are REMITTED)
//     const premiumsSql = `
//         SELECT 
//             COUNT(*) as total_premiums,
//             COALESCE(SUM(premium_amount_pesewas), 0) as total_premium_amount
//         FROM benefits_ledger
//         WHERE artisan_id = $1 AND status = 'REMITTED';
//     `;
//     const premiumsResult = await client.query(premiumsSql, [artisanId]);

//     // Get pending premiums
//     const pendingSql = `
//         SELECT COALESCE(SUM(premium_amount_pesewas), 0) as pending_premium_amount
//         FROM benefits_ledger
//         WHERE artisan_id = $1 AND status = 'PENDING';
//     `;
//     const pendingResult = await client.query(pendingSql, [artisanId]);

//     // Get total earnings (gross - includes all payouts, before deductions)
//     const earningsSql = `
//         SELECT 
//             COALESCE(SUM(artisan_payout_pesewas), 0) as total_earnings_net,
//             COALESCE(SUM(gross_fee_pesewas), 0) as total_earnings_gross
//         FROM job_transactions
//         WHERE artisan_id = $1 AND current_state = 'PAYOUT_SUCCESS';
//     `;
//     const earningsResult = await client.query(earningsSql, [artisanId]);
    
//     const totalEarningsNet = parseInt(earningsResult.rows[0].total_earnings_net, 10);
//     const totalEarningsGross = parseInt(earningsResult.rows[0].total_earnings_gross, 10);
    
//     // Calculate monthly premium paid (for Standard plan: 20 cedis/month = 2000 pesewas/month)
//     // Count months from enrollment date (or first gig if Standard plan)
//     let monthlyPremiumPaidPesewas = 0;
//     if (profile.riviaco_plan === 'STANDARD') {
//         // Standard plan: 20 cedis/month = 2000 pesewas/month
//         // Calculate based on contribution tracking (already accumulated in riviaco_standard_plan_contribution_pesewas)
//         const contributionPesewas = parseInt(profile.riviaco_standard_plan_contribution_pesewas || 0, 10);
//         // Round down to nearest month (2000 pesewas = 1 month)
//         monthlyPremiumPaidPesewas = Math.floor(contributionPesewas / 2000) * 2000;
//     }

//     return {
//         artisan_id: artisanId,
//         artisan_name: profile.full_name,
//         riviaco_policy_id: profile.riviaco_policy_id,
//         riviaco_plan: profile.riviaco_plan || null, // 'FREE' or 'STANDARD'
//         riviaco_enrolled: !!profile.riviaco_policy_id,
//         riviaco_enrollment_date: profile.riviaco_enrollment_date,
//         total_premiums_paid: parseInt(premiumsResult.rows[0].total_premiums, 10),
//         total_premium_amount_pesewas: parseInt(premiumsResult.rows[0].total_premium_amount, 10),
//         pending_premium_amount_pesewas: parseInt(pendingResult.rows[0].pending_premium_amount, 10),
//         monthly_premium_paid_pesewas: monthlyPremiumPaidPesewas,
//         standard_plan_contribution_pesewas: parseInt(profile.riviaco_standard_plan_contribution_pesewas || 0, 10),
//         total_lifetime_earnings_pesewas: totalEarningsNet, // Net earnings (after deductions)
//         total_lifetime_earnings_gross_pesewas: totalEarningsGross // Gross earnings (before deductions)
//     };
// }

// /**
//  * Claim Rivia Insurance for an artisan (Lazy Activation)
//  * This function implements the lazy activation model where artisans claim their insurance
//  * after registration rather than getting it automatically.
//  *
//  * @param {object} client - Database client (within a transaction)
//  * @param {string} userId - UUID of the artisan
//  * @returns {object} Result with memberId, cardCode, and status
//  */
// async function claimRiviaInsurance(client, userId) {
//     // 1. Check eligibility: Ensure riviaco_member_id is NULL (not already enrolled)
//     const checkEligibilitySql = `
//         SELECT
//             riviaco_member_id, riviaco_card_code,
//             full_name, phone_primary, dob, gender, email
//         FROM artisan_profiles
//         WHERE id = $1
//         FOR UPDATE;
//     `;

//     const eligibilityResult = await client.query(checkEligibilitySql, [userId]);
//     if (eligibilityResult.rows.length === 0) {
//         throw new Error("Artisan profile not found.");
//     }

//     const artisan = eligibilityResult.rows[0];
    
//     // Check if already enrolled
//     if (artisan.riviaco_member_id) {
//         throw new Error("Artisan already has Rivia insurance activated.");
//     }

//     // 2. Lock a card: Query rivia_cards for a card where status is 'pending' or 'available'
//     // member_id is null, is_free is true AND assigned_to is NULL
//     const unassignedCard = await RiviaCardService.getUnassignedFreeCard(client);
    
//     if (!unassignedCard) {
//         throw new Error("No unassigned free cards available");
//     }

//     // 3. Call Rivia API to activate the card
//     // Split full name into first and last names
//     const nameParts = artisan.full_name.trim().split(' ');
//     const firstName = nameParts[0];
//     const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

//     // Register artisan as member on Rivia
//     const memberData = {
//         firstName,
//         lastName,
//         contact: artisan.phone_primary,
//         dob: artisan.dob || null,
//         email: artisan.email || null,
//         gender: artisan.gender || null
//     };

//     let memberId, cardCode = unassignedCard.card_code;

//     try {
//         const memberResult = await RiviaService.registerMember(memberData);
//         memberId = memberResult.data.id;

//         // 4. Update Records (Success)
//         // Set rivia_cards.assigned_to = user.id
//         // Set rivia_cards.status = 'active'
//         // Set rivia_cards.member_id = rivia member id
//         // Set artisan_profiles.riviaco_card_code = card_code
//         // Set artisan_profiles.riviaco_member_id = rivia member id

//         // Update the card record
//         await client.query(`
//             UPDATE rivia_cards
//             SET
//                 assigned_to = $1,
//                 status = 'active',
//                 member_id = $2
//             WHERE id = $3
//         `, [userId, memberId, unassignedCard.id]);

//         // Update artisan profile with RiviaCo membership info
//         await client.query(`
//             UPDATE artisan_profiles
//             SET
//                 riviaco_member_id = $1,
//                 riviaco_card_code = $2,
//                 riviaco_enrollment_date = NOW(),
//                 riviaco_plan = 'FREE',
//                 riviaco_sync_status = 'synced',
//                 updated_at = NOW()
//             WHERE id = $3
//         `, [memberId, cardCode, userId]);

//         return {
//             success: true,
//             memberId,
//             cardCode,
//             message: "Rivia insurance successfully claimed and activated"
//         };

//     } catch (riviaError) {
//         // 5. Error Handling: If the API call fails, rollback the DB transaction
//         console.error(`Failed to register artisan on Rivia for artisan ${userId}:`, riviaError.message);
//         throw new Error(`Rivia API error: ${riviaError.message}`);
//     }
// }



// module.exports = {
//     recordPremiumDeduction,
//     getPendingPremiums,
//     getAllPendingPremiums,
//     createRemittanceBatch,
//     linkPremiumsToBatch,
//     processRemittanceBatch,
//     getRemittanceBatches,
//     getTotalPendingPremiums,
//     getArtisanBenefitsSummary,
//     claimRiviaInsurance
// };

const { v4: uuidv4 } = require('uuid');
const PaystackService = require('./paystackService');
const RiviaService = require('./riviacoService');
const RiviaCardService = require('./riviaCardService');
const configService = require('./configService'); // Import configService
const db = require('../db/db');

class BenefitsService {

    /**
     * Records a RiviaCo premium deduction for an artisan after job sign-off.
     * F.S.4 - Benefits Module: Accumulates premiums for batch remittance.
     * For Standard Plan: Also tracks monthly contributions toward annual fee.
     * * @param {object} client - Database client (within a transaction)
     * @param {string} artisanId - UUID of the artisan
     * @param {string} jobId - UUID of the job
     * @param {number} premiumAmountPesewas - Premium amount in pesewas
     * @returns {string} The ledger_id of the created record
     */
    async recordPremiumDeduction(client, artisanId, jobId, premiumAmountPesewas) {
        if (!artisanId || !jobId) {
            throw new Error("Invalid parameters for premium deduction recording.");
        }

        // --- NEW: Get Fixed Premium from Database Config ---
        // Defaults to 2000 (20 GHS) via configService fallback if DB fetch fails
        const config = configService.getConfig();
        const FIXED_PREMIUM = config.RIVIACO_PREMIUM_PESEWAS;
        
        // Use the passed amount if > 0, otherwise use the fixed/configured amount
        const actualPremium = premiumAmountPesewas > 0 ? premiumAmountPesewas : FIXED_PREMIUM;

        // 1. Record premium in benefits ledger
        const sql = `
            INSERT INTO benefits_ledger (
                artisan_id, job_id, premium_amount_pesewas, status
            )
            VALUES ($1, $2, $3, 'PENDING')
            RETURNING ledger_id;
        `;

        const result = await client.query(sql, [artisanId, jobId, actualPremium]);
        const ledgerId = result.rows[0].ledger_id;
        
        // 2. Update Artisan's Cumulative Contribution
        // This tracks progress towards the 500 GHS (50,000 Pesewas) annual fee
        const updateContributionSql = `
            UPDATE artisan_profiles
            SET riviaco_standard_plan_contribution_pesewas = 
                COALESCE(riviaco_standard_plan_contribution_pesewas, 0) + $1,
                updated_at = NOW()
            WHERE id = $2 
            RETURNING *;
        `;
        
        try {
            const updateRes = await client.query(updateContributionSql, [actualPremium, artisanId]);
            const artisan = updateRes.rows[0];

            // 3. AUTO-UPGRADE CHECK
            // If contribution reaches 500 GHS (50,000 Pesewas) and NOT yet Standard, trigger upgrade
            if (artisan.riviaco_plan !== 'STANDARD' && artisan.riviaco_standard_plan_contribution_pesewas >= 50000) {
                console.log(`[BenefitsService] Artisan ${artisanId} reached contribution threshold. Triggering Auto-Upgrade.`);
                
                try {
                    // Use existing card code or generate mock one if missing
                    const cardCode = artisan.rivia_card_code || `ZOLID-${artisan.id.substring(0,8).toUpperCase()}`;
                    
                    // Call Rivia API to activate Standard Plan
                    await RiviaService.activateCard(cardCode, {
                        firstName: artisan.full_name.split(' ')[0],
                        lastName: artisan.full_name.split(' ').slice(1).join(' '),
                        phone: artisan.phone_primary
                    });

                    // Update Local DB Status
                    await client.query(`
                        UPDATE artisan_profiles 
                        SET riviaco_plan = 'STANDARD', 
                            rivia_card_code = $1,
                            updated_at = NOW()
                        WHERE id = $2
                    `, [cardCode, artisanId]);

                } catch (apiError) {
                    console.error(`[BenefitsService] Rivia Auto-Upgrade API failed for ${artisanId}:`, apiError.message);
                    // We do NOT rollback the transaction here. The contribution money was deducted safely.
                    // The "Standard" status update can be retried by Admin later.
                }
            }

        } catch (error) {
            console.warn(`Failed to update Standard Plan contribution for artisan ${artisanId}:`, error.message);
            // Non-critical failure for contribution tracking logic, core financial transaction proceeds
        }
        
        return ledgerId;
    }

    /**
     * Gets all pending premium deductions for a specific artisan.
     */
    async getPendingPremiums(client, artisanId) {
        const sql = `
            SELECT 
                ledger_id, job_id, premium_amount_pesewas, created_at
            FROM benefits_ledger
            WHERE artisan_id = $1 AND status = 'PENDING'
            ORDER BY created_at ASC;
        `;

        const result = await client.query(sql, [artisanId]);
        return result.rows;
    }

    /**
     * Gets all pending premiums across all artisans for batch remittance.
     */
    async getAllPendingPremiums(client) {
        const sql = `
            SELECT 
                bl.ledger_id, bl.artisan_id, bl.job_id, bl.premium_amount_pesewas, bl.created_at,
                ap.full_name as artisan_name, ap.riviaco_policy_id
            FROM benefits_ledger bl
            JOIN artisan_profiles ap ON bl.artisan_id = ap.id
            WHERE bl.status = 'PENDING'
            ORDER BY bl.created_at ASC;
        `;

        const result = await client.query(sql);
        return result.rows;
    }

    /**
     * Creates a remittance batch for processing.
     */
    async createRemittanceBatch(client, partnerName, totalAmountPesewas, scheduledDate) {
        const sql = `
            INSERT INTO remittance_batch (
                partner_name, total_amount_pesewas, scheduled_date, status
            )
            VALUES ($1, $2, $3, 'PENDING')
            RETURNING batch_id;
        `;

        const result = await client.query(sql, [partnerName, totalAmountPesewas, scheduledDate]);
        return result.rows[0].batch_id;
    }

    /**
     * Links pending premiums to a remittance batch.
     */
    async linkPremiumsToBatch(client, batchId, ledgerIds) {
        if (!ledgerIds || ledgerIds.length === 0) {
            return;
        }

        const placeholders = ledgerIds.map((_, index) => `$${index + 2}`).join(',');
        const sql = `
            UPDATE benefits_ledger
            SET remittance_batch_id = $1
            WHERE ledger_id IN (${placeholders})
            AND status = 'PENDING';
        `;

        await client.query(sql, [batchId, ...ledgerIds]);
    }

    /**
     * Processes a remittance batch by executing Paystack transfer to partner.
     */
    async processRemittanceBatch(client, batchId, partnerRecipientCode) {
        // Get batch details
        const batchSql = `
            SELECT batch_id, partner_name, total_amount_pesewas
            FROM remittance_batch
            WHERE batch_id = $1 AND status = 'PENDING';
        `;
        
        const batchResult = await client.query(batchSql, [batchId]);
        if (batchResult.rows.length === 0) {
            throw new Error("Remittance batch not found or already processed.");
        }

        const batch = batchResult.rows[0];

        // Update batch status to PROCESSING
        await client.query(
            `UPDATE remittance_batch SET status = 'PROCESSING', updated_at = NOW() WHERE batch_id = $1`,
            [batchId]
        );

        try {
            // Execute Paystack transfer
            const transferResult = await PaystackService.initializeTransfer(
                partnerRecipientCode,
                batch.total_amount_pesewas,
                `ZOLID ${batch.partner_name} Batch Remittance ${batchId}`,
                batchId
            );

            // Update batch with transfer reference
            await client.query(
                `UPDATE remittance_batch 
                 SET status = 'SUCCESS', 
                     paystack_transfer_ref = $1,
                     paystack_batch_code = $2,
                     processed_at = NOW(),
                     updated_at = NOW()
                 WHERE batch_id = $3`,
                [
                    transferResult.reference || transferResult.paystack_transfer_id,
                    transferResult.transfer_code || null,
                    batchId
                ]
            );

            // Mark linked premiums as REMITTED
            await client.query(
                `UPDATE benefits_ledger 
                 SET status = 'REMITTED', remitted_at = NOW()
                 WHERE remittance_batch_id = $1`,
                [batchId]
            );

            return {
                batch_id: batchId,
                status: 'SUCCESS',
                transfer_reference: transferResult.reference || transferResult.paystack_transfer_id
            };

        } catch (error) {
            // Update batch status to FAILED
            await client.query(
                `UPDATE remittance_batch 
                 SET status = 'FAILED', 
                     error_message = $1,
                     updated_at = NOW()
                 WHERE batch_id = $2`,
                [error.message, batchId]
            );
            throw error;
        }
    }

    /**
     * Gets remittance batches by status.
     */
    async getRemittanceBatches(client, status = null, partnerName = null) {
        let sql = `
            SELECT 
                rb.*,
                COUNT(bl.ledger_id) as premium_count
            FROM remittance_batch rb
            LEFT JOIN benefits_ledger bl ON rb.batch_id = bl.remittance_batch_id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (status) {
            sql += ` AND rb.status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }

        if (partnerName) {
            sql += ` AND rb.partner_name = $${paramCount}`;
            params.push(partnerName);
            paramCount++;
        }

        sql += ` GROUP BY rb.batch_id ORDER BY rb.created_at DESC;`;

        const result = await client.query(sql, params);
        return result.rows;
    }

    /**
     * Calculates total pending premiums for a partner.
     */
    async getTotalPendingPremiums(client, partnerName = 'RiviaCo') {
        const sql = `
            SELECT COALESCE(SUM(premium_amount_pesewas), 0) as total_pending
            FROM benefits_ledger
            WHERE status = 'PENDING';
        `;

        const result = await client.query(sql);
        return parseInt(result.rows[0].total_pending, 10);
    }

    /**
     * Gets artisan's benefits summary.
     */
    async getArtisanBenefitsSummary(client, artisanId) {
        // Get artisan profile with RiviaCo plan info
        const profileSql = `
            SELECT 
                riviaco_policy_id, 
                riviaco_plan,
                riviaco_enrollment_date,
                riviaco_standard_plan_contribution_pesewas,
                full_name
            FROM artisan_profiles
            WHERE id = $1;
        `;
        const profileResult = await client.query(profileSql, [artisanId]);
        
        if (profileResult.rows.length === 0) {
            throw new Error("Artisan profile not found.");
        }

        const profile = profileResult.rows[0];

        // Get total premiums paid
        const premiumsSql = `
            SELECT 
                COUNT(*) as total_premiums,
                COALESCE(SUM(premium_amount_pesewas), 0) as total_premium_amount
            FROM benefits_ledger
            WHERE artisan_id = $1 AND status = 'REMITTED';
        `;
        const premiumsResult = await client.query(premiumsSql, [artisanId]);

        // Get pending premiums
        const pendingSql = `
            SELECT COALESCE(SUM(premium_amount_pesewas), 0) as pending_premium_amount
            FROM benefits_ledger
            WHERE artisan_id = $1 AND status = 'PENDING';
        `;
        const pendingResult = await client.query(pendingSql, [artisanId]);

        return {
            artisan_id: artisanId,
            artisan_name: profile.full_name,
            riviaco_policy_id: profile.riviaco_policy_id,
            riviaco_plan: profile.riviaco_plan, // 'FREE' or 'STANDARD' or null
            riviaco_enrolled: !!profile.riviaco_plan,
            riviaco_enrollment_date: profile.riviaco_enrollment_date,
            
            // Contribution Tracking
            contribution_balance_pesewas: parseInt(profile.riviaco_standard_plan_contribution_pesewas || 0, 10),
            
            // Ledger Stats
            total_premiums_paid_count: parseInt(premiumsResult.rows[0].total_premiums, 10),
            total_premium_remitted_pesewas: parseInt(premiumsResult.rows[0].total_premium_amount, 10),
            pending_remittance_pesewas: parseInt(pendingResult.rows[0].pending_premium_amount, 10)
        };
    }

    /**
     * Claim Rivia Insurance (Lazy Activation via Admin or User Action)
     */
    async claimRiviaInsurance(client, userId) {
        // 1. Check eligibility
        const checkEligibilitySql = `
            SELECT riviaco_member_id, full_name, phone_primary
            FROM artisan_profiles
            WHERE id = $1 FOR UPDATE;
        `;

        const eligibilityResult = await client.query(checkEligibilitySql, [userId]);
        if (eligibilityResult.rows.length === 0) throw new Error("Artisan profile not found.");
        const artisan = eligibilityResult.rows[0];
        
        if (artisan.riviaco_member_id) {
            throw new Error("Artisan already has Rivia insurance activated.");
        }

        // 2. Call Rivia API to register member
        try {
            const memberResult = await RiviaService.registerMember({
                full_name: artisan.full_name,
                phone_primary: artisan.phone_primary
                // Add other fields if available in profile (dob, gender, etc.)
            });
            const memberId = memberResult.id;

            // 3. Update DB
            await client.query(`
                UPDATE artisan_profiles
                SET
                    riviaco_member_id = $1,
                    riviaco_plan = 'FREE',
                    riviaco_enrollment_date = NOW(),
                    riviaco_sync_status = 'synced',
                    updated_at = NOW()
                WHERE id = $2
            `, [memberId, userId]);

            return {
                success: true,
                memberId,
                message: "Rivia insurance successfully activated (Free Plan)"
            };

        } catch (riviaError) {
            console.error(`Failed to register artisan on Rivia for artisan ${userId}:`, riviaError.message);
            throw new Error(`Rivia API error: ${riviaError.message}`);
        }
    }
}

module.exports = new BenefitsService();