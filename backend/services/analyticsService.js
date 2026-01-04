/**
 * Analytics Service
 * Tracks quote acceptance rates and other platform metrics
 */

const db = require('../db/db');

// Event type constants
const EVENTS = {
  // Quote events
  QUOTE_SUBMITTED: 'quote.submitted',
  QUOTE_VIEWED: 'quote.viewed',
  QUOTE_ACCEPTED: 'quote.accepted',
  QUOTE_REJECTED: 'quote.rejected',
  QUOTE_WITHDRAWN: 'quote.withdrawn',
  QUOTE_EDITED: 'quote.edited',
  
  // Job events
  JOB_CREATED: 'job.created',
  JOB_VIEWED: 'job.viewed',
  JOB_CANCELLED: 'job.cancelled',
  JOB_EXPIRED: 'job.expired',
  
  // Payment events
  PAYMENT_INITIATED: 'payment.initiated',
  PAYMENT_COMPLETED: 'payment.completed',
  PAYMENT_FAILED: 'payment.failed',
  
  // Negotiation events
  NEGOTIATION_STARTED: 'negotiation.started',
  COUNTER_OFFER_SENT: 'counter_offer.sent',
  NEGOTIATION_COMPLETED: 'negotiation.completed'
};

/**
 * Track an analytics event
 * @param {object} dbClient - Database client
 * @param {string} eventType - Event type from EVENTS
 * @param {object} eventData - Event data
 */
async function trackEvent(dbClient, eventType, eventData) {
  try {
    await dbClient.query(
      `INSERT INTO analytics_events (event_type, user_id, user_type, job_id, quote_id, event_data)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        eventType,
        eventData.user_id || null,
        eventData.user_type || null,
        eventData.job_id || null,
        eventData.quote_id || null,
        JSON.stringify(eventData)
      ]
    );
  } catch (error) {
    console.error('Analytics tracking error:', error.message);
    // Don't throw - analytics failure shouldn't break the main flow
  }
}

/**
 * Track quote submission with analytics data
 * @param {object} dbClient - Database client
 * @param {string} quoteId - Quote ID
 */
async function trackQuoteSubmitted(dbClient, quoteId) {
  try {
    const quote = await dbClient.query(
      `SELECT jq.*, jt.current_state,
              (SELECT COUNT(*) FROM job_quotes WHERE job_id = jq.job_id AND status = 'PENDING') as total_quotes
       FROM job_quotes jq
       JOIN job_transactions jt ON jq.job_id = jt.id
       WHERE jq.id = $1`,
      [quoteId]
    );
    
    if (quote.rows.length === 0) return;
    
    const quoteData = quote.rows[0];
    
    // Insert into quote_analytics for detailed tracking
    await dbClient.query(
      `INSERT INTO quote_analytics (
        quote_id, job_id, artisan_id, submitted_at, total_quotes_for_job
      ) VALUES ($1, $2, $3, NOW(), $4)
      ON CONFLICT (quote_id) DO UPDATE SET
        submitted_at = NOW(),
        total_quotes_for_job = EXCLUDED.total_quotes_for_job`,
      [quoteId, quoteData.job_id, quoteData.artisan_id, quoteData.total_quotes]
    );
    
    // Track event
    await trackEvent(dbClient, EVENTS.QUOTE_SUBMITTED, {
      quote_id: quoteId,
      job_id: quoteData.job_id,
      artisan_id: quoteData.artisan_id,
      user_id: quoteData.artisan_id,
      user_type: 'artisan',
      quoted_amount: quoteData.quoted_fee_pesewas,
      total_quotes_on_job: quoteData.total_quotes
    });
  } catch (error) {
    console.error('Failed to track quote submission:', error.message);
  }
}

/**
 * Track quote acceptance
 * @param {object} dbClient - Database client
 * @param {string} quoteId - Accepted quote ID
 * @param {string} jobId - Job ID
 */
async function trackQuoteAccepted(dbClient, quoteId, jobId) {
  try {
    // Update quote analytics
    await dbClient.query(
      `UPDATE quote_analytics
       SET accepted_at = NOW(),
           time_to_decision_seconds = EXTRACT(EPOCH FROM (NOW() - submitted_at))::INTEGER,
           final_decision = 'accepted'
       WHERE quote_id = $1`,
      [quoteId]
    );
    
    // Mark other quotes as rejected
    await dbClient.query(
      `UPDATE quote_analytics
       SET rejected_at = NOW(),
           time_to_decision_seconds = EXTRACT(EPOCH FROM (NOW() - submitted_at))::INTEGER,
           final_decision = 'rejected'
       WHERE job_id = $1 AND quote_id != $2`,
      [jobId, quoteId]
    );
    
    // Track event
    const quote = await dbClient.query(
      `SELECT * FROM job_quotes WHERE id = $1`,
      [quoteId]
    );
    
    if (quote.rows.length > 0) {
      await trackEvent(dbClient, EVENTS.QUOTE_ACCEPTED, {
        quote_id: quoteId,
        job_id: jobId,
        artisan_id: quote.rows[0].artisan_id,
        user_type: 'client',
        accepted_amount: quote.rows[0].quoted_fee_pesewas
      });
    }
  } catch (error) {
    console.error('Failed to track quote acceptance:', error.message);
  }
}

/**
 * Get quote acceptance rate statistics
 * @param {object} dbClient - Database client
 * @param {object} filters - Optional filters (artisan_id, date_from, date_to)
 * @returns {object} Statistics
 */
async function getQuoteAcceptanceStats(dbClient, filters = {}) {
  let whereClauses = ['1=1'];
  let params = [];
  let paramIndex = 1;
  
  if (filters.artisan_id) {
    whereClauses.push(`artisan_id = $${paramIndex}`);
    params.push(filters.artisan_id);
    paramIndex++;
  }
  
  if (filters.date_from) {
    whereClauses.push(`submitted_at >= $${paramIndex}`);
    params.push(filters.date_from);
    paramIndex++;
  }
  
  if (filters.date_to) {
    whereClauses.push(`submitted_at <= $${paramIndex}`);
    params.push(filters.date_to);
    paramIndex++;
  }
  
  const sql = `
    SELECT 
      COUNT(*) as total_quotes,
      COUNT(CASE WHEN final_decision = 'accepted' THEN 1 END) as accepted_quotes,
      COUNT(CASE WHEN final_decision = 'rejected' THEN 1 END) as rejected_quotes,
      COUNT(CASE WHEN final_decision = 'withdrawn' THEN 1 END) as withdrawn_quotes,
      ROUND(AVG(time_to_decision_seconds)) as avg_decision_time_seconds,
      ROUND(AVG(CASE WHEN final_decision = 'accepted' THEN time_to_decision_seconds END)) as avg_acceptance_time_seconds
    FROM quote_analytics
    WHERE ${whereClauses.join(' AND ')}
  `;
  
  const result = await dbClient.query(sql, params);
  const stats = result.rows[0];
  
  // Calculate acceptance rate
  const acceptanceRate = stats.total_quotes > 0 
    ? ((stats.accepted_quotes / stats.total_quotes) * 100).toFixed(2)
    : 0;
  
  return {
    total_quotes_submitted: parseInt(stats.total_quotes) || 0,
    quotes_accepted: parseInt(stats.accepted_quotes) || 0,
    quotes_rejected: parseInt(stats.rejected_quotes) || 0,
    quotes_withdrawn: parseInt(stats.withdrawn_quotes) || 0,
    acceptance_rate_percent: parseFloat(acceptanceRate),
    avg_decision_time_hours: stats.avg_decision_time_seconds 
      ? (stats.avg_decision_time_seconds / 3600).toFixed(2)
      : null,
    avg_acceptance_time_hours: stats.avg_acceptance_time_seconds
      ? (stats.avg_acceptance_time_seconds / 3600).toFixed(2)
      : null
  };
}

/**
 * Get platform-wide analytics
 * @param {object} dbClient - Database client
 * @returns {object} Platform metrics
 */
async function getPlatformAnalytics(dbClient) {
  const sql = `
    SELECT 
      -- Quote metrics
      (SELECT COUNT(*) FROM job_quotes) as total_quotes_all_time,
      (SELECT COUNT(*) FROM job_quotes WHERE created_at > NOW() - INTERVAL '7 days') as quotes_last_7_days,
      (SELECT COUNT(*) FROM job_quotes WHERE status = 'ACCEPTED') as total_accepted,
      (SELECT AVG(quoted_fee_pesewas) FROM job_quotes) as avg_quote_value,
      
      -- Job metrics
      (SELECT COUNT(*) FROM job_transactions WHERE current_state = 'OPEN_FOR_QUOTES') as jobs_awaiting_quotes,
      (SELECT COUNT(*) FROM job_transactions WHERE current_state = 'QUOTED') as jobs_with_quotes,
      (SELECT COUNT(*) FROM job_transactions WHERE current_state = 'IN_PROGRESS') as jobs_in_progress,
      (SELECT COUNT(*) FROM job_transactions WHERE current_state = 'PAYOUT_SUCCESS') as jobs_completed,
      
      -- Quote acceptance rate
      (SELECT 
        CASE 
          WHEN COUNT(*) > 0 THEN (COUNT(CASE WHEN final_decision = 'accepted' THEN 1 END)::FLOAT / COUNT(*)::FLOAT * 100)
          ELSE 0 
        END
       FROM quote_analytics) as overall_acceptance_rate,
      
      -- Average quotes per job
      (SELECT AVG(quote_count) FROM job_transactions WHERE quote_count > 0) as avg_quotes_per_job
  `;
  
  const result = await dbClient.query(sql);
  return result.rows[0];
}

/**
 * Get artisan-specific analytics
 * @param {object} dbClient - Database client
 * @param {string} artisanId - Artisan ID
 * @returns {object} Artisan metrics
 */
async function getArtisanAnalytics(dbClient, artisanId) {
  const sql = `
    SELECT 
      COUNT(*) as total_quotes_submitted,
      COUNT(CASE WHEN final_decision = 'accepted' THEN 1 END) as quotes_accepted,
      AVG(CASE WHEN final_decision = 'accepted' THEN time_to_decision_seconds / 3600.0 END) as avg_acceptance_time_hours,
      MIN(submitted_at) as first_quote_date,
      MAX(submitted_at) as last_quote_date
    FROM quote_analytics
    WHERE artisan_id = $1
  `;
  
  const result = await dbClient.query(sql, [artisanId]);
  const stats = result.rows[0];
  
  const acceptanceRate = stats.total_quotes_submitted > 0
    ? ((stats.quotes_accepted / stats.total_quotes_submitted) * 100).toFixed(2)
    : 0;
  
  return {
    ...stats,
    acceptance_rate_percent: parseFloat(acceptanceRate),
    total_quotes_submitted: parseInt(stats.total_quotes_submitted) || 0,
    quotes_accepted: parseInt(stats.quotes_accepted) || 0
  };
}

module.exports = {
  EVENTS,
  trackEvent,
  trackQuoteSubmitted,
  trackQuoteAccepted,
  getQuoteAcceptanceStats,
  getPlatformAnalytics,
  getArtisanAnalytics
};
