const db = require('../db/db');
const benefitsService = require('./benefitsService');
const cron = require('node-cron');

/**
 * Batch Remittance Scheduler
 * F.S.4 - Processes weekly/monthly remittances to RiviaCo and other partners.
 * 
 * This service should be run as a separate process or scheduled task.
 */

// Configuration
const RIVIACO_RECIPIENT_CODE = process.env.RIVIACO_RECIPIENT_CODE || null; // Paystack recipient code for RiviaCo
const REMITTANCE_FREQUENCY = process.env.REMITTANCE_FREQUENCY || 'weekly'; // 'weekly' or 'monthly'
const REMITTANCE_DAY = process.env.REMITTANCE_DAY || 'monday'; // Day of week for weekly, or day of month for monthly

/**
 * Processes pending RiviaCo premiums into a batch remittance.
 * 
 * @returns {object} Result of batch processing
 */
async function processRiviaCoBatchRemittance() {
    let client;
    
    try {
        console.log('🔄 Starting RiviaCo batch remittance processing...');
        
        client = await db.getClient();
        await client.query('BEGIN');

        // Get all pending premiums
        const pendingPremiums = await benefitsService.getAllPendingPremiums(client);
        
        if (pendingPremiums.length === 0) {
            await client.query('COMMIT');
            console.log('✅ No pending premiums to remit.');
            return { success: true, message: 'No pending premiums', batch_id: null };
        }

        // Calculate total amount
        const totalAmount = pendingPremiums.reduce((sum, premium) => {
            return sum + parseInt(premium.premium_amount_pesewas, 10);
        }, 0);

        console.log(`📊 Found ${pendingPremiums.length} pending premiums totaling ${totalAmount} pesewas (GHS ${totalAmount / 100}).`);

        // Check if recipient code is configured
        if (!RIVIACO_RECIPIENT_CODE) {
            throw new Error('RiviaCo recipient code not configured. Set RIVIACO_RECIPIENT_CODE environment variable.');
        }

        // Calculate scheduled date (today)
        const scheduledDate = new Date();
        scheduledDate.setHours(0, 0, 0, 0);

        // Create remittance batch
        const batchId = await benefitsService.createRemittanceBatch(
            client,
            'RiviaCo',
            totalAmount,
            scheduledDate
        );

        console.log(`📦 Created remittance batch: ${batchId}`);

        // Link premiums to batch
        const ledgerIds = pendingPremiums.map(p => p.ledger_id);
        await benefitsService.linkPremiumsToBatch(client, batchId, ledgerIds);

        // Process the batch (execute Paystack transfer)
        const result = await benefitsService.processRemittanceBatch(
            client,
            batchId,
            RIVIACO_RECIPIENT_CODE
        );

        await client.query('COMMIT');

        console.log(`✅ Batch remittance processed successfully.`);
        console.log(`   Batch ID: ${batchId}`);
        console.log(`   Total Amount: ${totalAmount} pesewas (GHS ${totalAmount / 100})`);
        console.log(`   Premiums Processed: ${pendingPremiums.length}`);
        console.log(`   Transfer Reference: ${result.transfer_reference}`);

        return {
            success: true,
            batch_id: batchId,
            total_amount_pesewas: totalAmount,
            premium_count: pendingPremiums.length,
            transfer_reference: result.transfer_reference
        };

    } catch (error) {
        if (client) {
            await client.query('ROLLBACK');
        }
        console.error('❌ Batch remittance processing failed:', error.message);
        throw error;
    } finally {
        if (client) {
            client.release();
        }
    }
}

/**
 * Gets the cron schedule string based on configuration.
 * 
 * @returns {string} Cron expression
 */
function getCronSchedule() {
    if (REMITTANCE_FREQUENCY === 'weekly') {
        // Run every Monday at 9 AM
        const dayMap = {
            'sunday': 0,
            'monday': 1,
            'tuesday': 2,
            'wednesday': 3,
            'thursday': 4,
            'friday': 5,
            'saturday': 6
        };
        const day = dayMap[REMITTANCE_DAY.toLowerCase()] || 1;
        return `0 9 * * ${day}`; // 9 AM on specified day
    } else if (REMITTANCE_FREQUENCY === 'monthly') {
        // Run on 1st of each month at 9 AM
        const day = parseInt(REMITTANCE_DAY, 10) || 1;
        return `0 9 ${day} * *`; // 9 AM on specified day of month
    } else {
        // Default: Weekly on Monday
        return '0 9 * * 1';
    }
}

/**
 * Starts the scheduled batch remittance processing.
 * This should be called when the application starts.
 */
function startScheduler() {
    if (process.env.DISABLE_BATCH_SCHEDULER === 'true') {
        console.log('⏸️  Batch remittance scheduler is disabled.');
        return;
    }

    const schedule = getCronSchedule();
    console.log(`⏰ Starting batch remittance scheduler with schedule: ${schedule}`);
    console.log(`   Frequency: ${REMITTANCE_FREQUENCY}`);
    console.log(`   Day: ${REMITTANCE_DAY}`);

    // Schedule the task
    cron.schedule(schedule, async () => {
        try {
            await processRiviaCoBatchRemittance();
        } catch (error) {
            console.error('❌ Scheduled batch remittance failed:', error.message);
            // In production, you might want to send alerts here
        }
    });

    console.log('✅ Batch remittance scheduler started.');
}

/**
 * Manual trigger for testing or immediate processing.
 * Can be called via admin endpoint or CLI.
 */
async function triggerManualRemittance() {
    return await processRiviaCoBatchRemittance();
}

module.exports = {
    processRiviaCoBatchRemittance,
    startScheduler,
    triggerManualRemittance,
    getCronSchedule
};
