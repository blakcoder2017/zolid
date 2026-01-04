/**
 * Job Expiry Service
 * Handles automatic expiry of jobs with no quotes or unaccepted quotes
 */

const db = require('../db/db');

/**
 * Expire jobs that have no quotes after 72 hours
 */
async function expireJobsWithNoQuotes() {
    const client = await db.pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Find jobs that are OPEN_FOR_QUOTES for more than 72 hours with no quotes
        const findSql = `
            UPDATE job_transactions
            SET current_state = 'CANCELLED',
                updated_at = NOW()
            WHERE current_state IN ('OPEN_FOR_QUOTES', 'DRAFT')
            AND created_at < NOW() - INTERVAL '72 hours'
            AND quote_count = 0
            RETURNING id, client_id, job_description`;
        
        const result = await client.query(findSql);
        
        await client.query('COMMIT');
        
        if (result.rows.length > 0) {
            console.log(`🔴 Auto-cancelled ${result.rows.length} jobs with no quotes after 72 hours`);
            result.rows.forEach(job => {
                console.log(`  - Job ${job.id}: ${job.job_description?.substring(0, 50)}...`);
                // TODO: Send notification to client
                console.log(`    📬 TODO: Notify client ${job.client_id} - Job expired (no quotes received)`);
            });
        }
        
        return result.rows.length;
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error expiring jobs with no quotes:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Expire jobs where client hasn't accepted any quote after 48 hours
 */
async function expireJobsWithUnacceptedQuotes() {
    const client = await db.pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Find jobs in QUOTED state past their quotes_deadline
        const findSql = `
            SELECT jt.id, jt.client_id, jt.job_description, jt.quote_count
            FROM job_transactions jt
            WHERE jt.current_state = 'QUOTED'
            AND jt.quotes_deadline < NOW()
            AND jt.selected_quote_id IS NULL`;
        
        const jobsToExpire = await client.query(findSql);
        
        if (jobsToExpire.rows.length === 0) {
            await client.query('COMMIT');
            return 0;
        }
        
        // Cancel the jobs
        const cancelJobsSql = `
            UPDATE job_transactions
            SET current_state = 'CANCELLED',
                updated_at = NOW()
            WHERE id = ANY($1::uuid[])`;
        
        const jobIds = jobsToExpire.rows.map(j => j.id);
        await client.query(cancelJobsSql, [jobIds]);
        
        // Mark all pending quotes as rejected
        const rejectQuotesSql = `
            UPDATE job_quotes
            SET status = 'REJECTED',
                rejection_reason = 'Client did not accept any quote (deadline passed)',
                updated_at = NOW()
            WHERE job_id = ANY($1::uuid[])
            AND status = 'PENDING'`;
        
        await client.query(rejectQuotesSql, [jobIds]);
        
        await client.query('COMMIT');
        
        console.log(`🔴 Auto-cancelled ${jobsToExpire.rows.length} jobs with unaccepted quotes`);
        jobsToExpire.rows.forEach(job => {
            console.log(`  - Job ${job.id}: ${job.job_description?.substring(0, 50)}... (${job.quote_count} quotes)`);
            // TODO: Send notifications
            console.log(`    📬 TODO: Notify client ${job.client_id} - Job expired (quote deadline passed)`);
            console.log(`    📬 TODO: Notify ${job.quote_count} artisans - Job cancelled (client did not respond)`);
        });
        
        return jobsToExpire.rows.length;
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error expiring jobs with unaccepted quotes:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Run all expiry checks
 */
async function runExpiryChecks() {
    console.log('\n🕐 Running job expiry checks...');
    console.log('═'.repeat(60));
    
    try {
        const noQuotesCount = await expireJobsWithNoQuotes();
        const unacceptedCount = await expireJobsWithUnacceptedQuotes();
        
        console.log('═'.repeat(60));
        console.log(`✅ Expiry checks complete. Cancelled: ${noQuotesCount + unacceptedCount} jobs total`);
        console.log(`   - No quotes (72h): ${noQuotesCount}`);
        console.log(`   - Unaccepted quotes (deadline): ${unacceptedCount}\n`);
        
        return {
            no_quotes: noQuotesCount,
            unaccepted: unacceptedCount,
            total: noQuotesCount + unacceptedCount
        };
        
    } catch (error) {
        console.error('❌ Job expiry check failed:', error.message);
        throw error;
    }
}

module.exports = {
    runExpiryChecks,
    expireJobsWithNoQuotes,
    expireJobsWithUnacceptedQuotes
};
