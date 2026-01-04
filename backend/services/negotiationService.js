/**
 * Quote Negotiation Service
 * Handles counter-offers between clients and artisans
 */

const jobQuoteService = require('./jobQuoteService');

/**
 * Validate counter-offer amount (must be within ±30% of original quote)
 * @param {number} originalAmount - Original quoted amount
 * @param {number} counterAmount - Counter-offer amount
 * @returns {boolean}
 */
function validateCounterOfferRange(originalAmount, counterAmount) {
  const minAllowed = originalAmount * 0.7; // 70%
  const maxAllowed = originalAmount * 1.3; // 130%
  
  return counterAmount >= minAllowed && counterAmount <= maxAllowed;
}

/**
 * Client sends counter-offer to artisan's quote
 * @param {object} dbClient - Database client
 * @param {string} quoteId - Quote ID
 * @param {string} clientId - Client ID (authorization)
 * @param {object} offerData - Counter-offer data
 * @returns {object} Created negotiation
 */
async function sendCounterOffer(dbClient, quoteId, clientId, offerData) {
  // 1. Get quote and verify ownership
  const quoteCheck = await dbClient.query(
    `SELECT jq.*, jt.client_id, jq.allows_negotiation, jq.negotiation_rounds
     FROM job_quotes jq
     JOIN job_transactions jt ON jq.job_id = jt.id
     WHERE jq.id = $1 AND jq.status = 'PENDING'`,
    [quoteId]
  );
  
  if (quoteCheck.rows.length === 0) {
    throw new Error('Quote not found or no longer available');
  }
  
  const quote = quoteCheck.rows[0];
  
  // Authorization
  if (quote.client_id !== clientId) {
    throw new Error('Unauthorized to negotiate this quote');
  }
  
  // Check if negotiation is allowed
  if (!quote.allows_negotiation) {
    throw new Error('This artisan has disabled negotiations');
  }
  
  // Check max rounds
  if (quote.negotiation_rounds >= 3) {
    throw new Error('Maximum negotiation rounds (3) reached. Please accept or reject the current offer.');
  }
  
  // Validate counter-offer range (±30%)
  if (!validateCounterOfferRange(quote.quoted_fee_pesewas, offerData.offered_amount_pesewas)) {
    const minAllowed = Math.floor(quote.quoted_fee_pesewas * 0.7);
    const maxAllowed = Math.floor(quote.quoted_fee_pesewas * 1.3);
    throw new Error(`Counter-offer must be within ±30% of original quote (GHS ${(minAllowed/100).toFixed(2)} - GHS ${(maxAllowed/100).toFixed(2)})`);
  }
  
  // 2. Create negotiation record
  const nextRound = quote.negotiation_rounds + 1;
  
  const insertSql = `
    INSERT INTO quote_negotiations (
      quote_id, round_number, offered_by, offered_amount_pesewas, message
    ) VALUES ($1, $2, 'client', $3, $4)
    RETURNING *`;
  
  const negotiationResult = await dbClient.query(insertSql, [
    quoteId,
    nextRound,
    offerData.offered_amount_pesewas,
    offerData.message || null
  ]);
  
  const negotiation = negotiationResult.rows[0];
  
  // 3. Update quote with current negotiation
  await dbClient.query(
    `UPDATE job_quotes
     SET negotiation_rounds = $1,
         current_negotiation_id = $2,
         updated_at = NOW()
     WHERE id = $3`,
    [nextRound, negotiation.id, quoteId]
  );
  
  // 4. Track analytics
  const analyticsService = require('./analyticsService');
  await analyticsService.trackEvent(dbClient, analyticsService.EVENTS.COUNTER_OFFER_SENT, {
    quote_id: quoteId,
    job_id: quote.job_id,
    user_id: clientId,
    user_type: 'client',
    original_amount: quote.quoted_fee_pesewas,
    counter_amount: offerData.offered_amount_pesewas,
    round: nextRound
  });
  
  return negotiation;
}

/**
 * Artisan responds to counter-offer
 * @param {object} dbClient - Database client
 * @param {string} negotiationId - Negotiation ID
 * @param {string} artisanId - Artisan ID (authorization)
 * @param {object} responseData - Response data
 * @returns {object} Updated negotiation or new negotiation
 */
async function respondToCounterOffer(dbClient, negotiationId, artisanId, responseData) {
  // 1. Get negotiation and verify
  const negotiationCheck = await dbClient.query(
    `SELECT qn.*, jq.artisan_id, jq.job_id, jq.quoted_fee_pesewas, jq.negotiation_rounds
     FROM quote_negotiations qn
     JOIN job_quotes jq ON qn.quote_id = jq.id
     WHERE qn.id = $1 AND qn.status = 'PENDING'`,
    [negotiationId]
  );
  
  if (negotiationCheck.rows.length === 0) {
    throw new Error('Negotiation not found or expired');
  }
  
  const negotiation = negotiationCheck.rows[0];
  
  // Authorization
  if (negotiation.artisan_id !== artisanId) {
    throw new Error('Unauthorized to respond to this negotiation');
  }
  
  const action = responseData.action; // 'accept', 'reject', 'counter'
  
  // 2. Handle response based on action
  if (action === 'accept') {
    // Artisan accepts client's counter-offer
    await dbClient.query(
      `UPDATE quote_negotiations
       SET status = 'ACCEPTED', responded_at = NOW()
       WHERE id = $1`,
      [negotiationId]
    );
    
    // Update the original quote with negotiated amount
    const fees = jobQuoteService.calculateQuoteFees(negotiation.offered_amount_pesewas);
    await dbClient.query(
      `UPDATE job_quotes
       SET quoted_fee_pesewas = $1,
           warranty_fee_pesewas = $2,
           total_client_pays_pesewas = $3,
           artisan_payout_pesewas = $4,
           platform_commission_pesewas = $5,
           riviaco_premium_pesewas = $6,
           updated_at = NOW()
       WHERE id = $7`,
      [
        fees.quoted_fee_pesewas,
        fees.warranty_fee_pesewas,
        fees.total_client_pays_pesewas,
        fees.artisan_payout_pesewas,
        fees.platform_commission_pesewas,
        fees.riviaco_premium_pesewas,
        negotiation.quote_id
      ]
    );
    
    return { action: 'accepted', negotiation };
    
  } else if (action === 'reject') {
    // Artisan rejects - keeps original quote
    await dbClient.query(
      `UPDATE quote_negotiations
       SET status = 'REJECTED', responded_at = NOW()
       WHERE id = $1`,
      [negotiationId]
    );
    
    return { action: 'rejected', negotiation };
    
  } else if (action === 'counter') {
    // Artisan sends another counter-offer
    if (negotiation.negotiation_rounds >= 3) {
      throw new Error('Maximum negotiation rounds reached');
    }
    
    if (!responseData.counter_amount_pesewas) {
      throw new Error('Counter amount is required');
    }
    
    // Validate counter range
    if (!validateCounterOfferRange(negotiation.quoted_fee_pesewas, responseData.counter_amount_pesewas)) {
      throw new Error('Counter-offer must be within ±30% of original quote');
    }
    
    // Mark current negotiation as countered
    await dbClient.query(
      `UPDATE quote_negotiations
       SET status = 'COUNTER', responded_at = NOW()
       WHERE id = $1`,
      [negotiationId]
    );
    
    // Create new negotiation round
    const nextRound = negotiation.negotiation_rounds + 1;
    const newNegotiation = await dbClient.query(
      `INSERT INTO quote_negotiations (
        quote_id, round_number, offered_by, offered_amount_pesewas, message
      ) VALUES ($1, $2, 'artisan', $3, $4)
      RETURNING *`,
      [
        negotiation.quote_id,
        nextRound,
        responseData.counter_amount_pesewas,
        responseData.message || null
      ]
    );
    
    // Update quote
    await dbClient.query(
      `UPDATE job_quotes
       SET negotiation_rounds = $1,
           current_negotiation_id = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [nextRound, newNegotiation.rows[0].id, negotiation.quote_id]
    );
    
    return { action: 'counter', negotiation: newNegotiation.rows[0] };
  } else {
    throw new Error('Invalid action. Must be: accept, reject, or counter');
  }
}

/**
 * Get negotiation history for a quote
 * @param {object} dbClient - Database client
 * @param {string} quoteId - Quote ID
 * @param {string} userId - User ID (for authorization)
 * @returns {array} Negotiation history
 */
async function getNegotiationHistory(dbClient, quoteId, userId) {
  // Verify user is involved in this quote
  const authCheck = await dbClient.query(
    `SELECT jq.artisan_id, jt.client_id
     FROM job_quotes jq
     JOIN job_transactions jt ON jq.job_id = jt.id
     WHERE jq.id = $1`,
    [quoteId]
  );
  
  if (authCheck.rows.length === 0) {
    throw new Error('Quote not found');
  }
  
  const { artisan_id, client_id } = authCheck.rows[0];
  if (userId !== artisan_id && userId !== client_id) {
    throw new Error('Unauthorized to view negotiations');
  }
  
  // Get all negotiations for this quote
  const result = await dbClient.query(
    `SELECT * FROM quote_negotiations
     WHERE quote_id = $1
     ORDER BY round_number ASC, created_at ASC`,
    [quoteId]
  );
  
  return result.rows;
}

/**
 * Client accepts current negotiation offer
 * @param {object} dbClient - Database client
 * @param {string} negotiationId - Negotiation ID
 * @param {string} clientId - Client ID
 */
async function clientAcceptsNegotiation(dbClient, negotiationId, clientId) {
  const negotiation = await dbClient.query(
    `SELECT qn.*, jq.job_id, jq.artisan_id, jt.client_id
     FROM quote_negotiations qn
     JOIN job_quotes jq ON qn.quote_id = jq.id
     JOIN job_transactions jt ON jq.job_id = jt.id
     WHERE qn.id = $1 AND qn.status = 'PENDING'`,
    [negotiationId]
  );
  
  if (negotiation.rows.length === 0) {
    throw new Error('Negotiation not found or expired');
  }
  
  const neg = negotiation.rows[0];
  
  if (neg.client_id !== clientId) {
    throw new Error('Unauthorized');
  }
  
  if (neg.offered_by !== 'artisan') {
    throw new Error('Can only accept artisan offers');
  }
  
  // Accept the negotiation
  await dbClient.query(
    `UPDATE quote_negotiations SET status = 'ACCEPTED', responded_at = NOW() WHERE id = $1`,
    [negotiationId]
  );
  
  // Update quote with final price
  const fees = jobQuoteService.calculateQuoteFees(neg.offered_amount_pesewas);
  await dbClient.query(
    `UPDATE job_quotes
     SET quoted_fee_pesewas = $1,
         warranty_fee_pesewas = $2,
         total_client_pays_pesewas = $3,
         artisan_payout_pesewas = $4,
         platform_commission_pesewas = $5,
         riviaco_premium_pesewas = $6,
         updated_at = NOW()
     WHERE id = $7`,
    [
      fees.quoted_fee_pesewas,
      fees.warranty_fee_pesewas,
      fees.total_client_pays_pesewas,
      fees.artisan_payout_pesewas,
      fees.platform_commission_pesewas,
      fees.riviaco_premium_pesewas,
      neg.quote_id
    ]
  );
  
  return neg;
}

module.exports = {
  validateCounterOfferRange,
  sendCounterOffer,
  respondToCounterOffer,
  getNegotiationHistory,
  clientAcceptsNegotiation
};
