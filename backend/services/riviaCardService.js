const AppError = require('../utils/appError');

class RiviaCardService {
    
    /**
     * Get an unassigned free card from the database
     * @param {Object} client - Database client
     * @returns {Object|null} - Card object if found, null otherwise
     */
    async getUnassignedFreeCard(client) {
        try {
            const query = `
                SELECT id, card_code, brand, valid_till, price, is_free, status 
                FROM rivia_cards 
                WHERE member_id IS NULL 
                AND is_free = TRUE 
                AND status = 'pending'
                ORDER BY created_on ASC
                LIMIT 1
                FOR UPDATE SKIP LOCKED
            `;
            
            const result = await client.query(query);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return result.rows[0];
        } catch (error) {
            console.error('Error fetching unassigned free card:', error);
            throw new AppError('Failed to fetch unassigned free card', 500);
        }
    }

    /**
     * Assign a card to a member
     * @param {Object} client - Database client
     * @param {string} cardId - Card ID to assign
     * @param {string} memberId - Member ID to assign the card to
     * @returns {Object} - Updated card object
     */
    async assignCardToMember(client, cardId, memberId) {
        try {
            const query = `
                UPDATE rivia_cards 
                SET member_id = $1, 
                    status = 'assigned'
                WHERE id = $2
                RETURNING id, card_code, brand, valid_till, price, is_free, status, member_id
            `;
            
            const result = await client.query(query, [memberId, cardId]);
            
            if (result.rows.length === 0) {
                throw new AppError('Card not found or already assigned', 404);
            }
            
            return result.rows[0];
        } catch (error) {
            console.error('Error assigning card to member:', error);
            throw new AppError('Failed to assign card to member', 500);
        }
    }

    /**
     * Create a new card in the database
     * @param {Object} client - Database client
     * @param {Object} cardData - Card data
     * @returns {Object} - Created card object
     */
    async createCard(client, cardData) {
        try {
            const query = `
                INSERT INTO rivia_cards 
                (created_on, card_code, brand, valid_till, price, is_free, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id, card_code, brand, valid_till, price, is_free, status, member_id
            `;
            
            const values = [
                cardData.created_on || new Date(),
                cardData.card_code,
                cardData.brand,
                cardData.valid_till,
                cardData.price,
                cardData.is_free || false,
                cardData.status || 'pending'
            ];
            
            const result = await client.query(query, values);
            
            return result.rows[0];
        } catch (error) {
            console.error('Error creating card:', error);
            if (error.code === '23505') { // Unique violation
                throw new AppError('Card with this code already exists', 409);
            }
            throw new AppError('Failed to create card', 500);
        }
    }

    /**
     * Get card by card code
     * @param {Object} client - Database client
     * @param {string} cardCode - Card code to search for
     * @returns {Object|null} - Card object if found, null otherwise
     */
    async getCardByCode(client, cardCode) {
        try {
            const query = `
                SELECT id, card_code, brand, valid_till, price, is_free, status, member_id 
                FROM rivia_cards 
                WHERE card_code = $1
            `;
            
            const result = await client.query(query, [cardCode]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return result.rows[0];
        } catch (error) {
            console.error('Error fetching card by code:', error);
            throw new AppError('Failed to fetch card by code', 500);
        }
    }

    /**
     * Get all unassigned free cards
     * @param {Object} client - Database client
     * @returns {Array} - Array of unassigned free cards
     */
    async getAllUnassignedFreeCards(client) {
        try {
            const query = `
                SELECT id, card_code, brand, valid_till, price, is_free, status 
                FROM rivia_cards 
                WHERE member_id IS NULL 
                AND is_free = TRUE 
                AND status = 'pending'
                ORDER BY created_on ASC
            `;
            
            const result = await client.query(query);
            
            return result.rows;
        } catch (error) {
            console.error('Error fetching all unassigned free cards:', error);
            throw new AppError('Failed to fetch unassigned free cards', 500);
        }
    }

    /**
     * Get cards assigned to a specific member
     * @param {Object} client - Database client
     * @param {string} memberId - Member ID to search for
     * @returns {Array} - Array of cards assigned to the member
     */
    async getCardsByMemberId(client, memberId) {
        try {
            const query = `
                SELECT id, card_code, brand, valid_till, price, is_free, status 
                FROM rivia_cards 
                WHERE member_id = $1
                ORDER BY created_on ASC
            `;
            
            const result = await client.query(query, [memberId]);
            
            return result.rows;
        } catch (error) {
            console.error('Error fetching cards by member ID:', error);
            throw new AppError('Failed to fetch cards by member ID', 500);
        }
    }
}

module.exports = new RiviaCardService();