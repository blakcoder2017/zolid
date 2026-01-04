-- Migration: Create rivia_cards table for tracking all RiviaCo access cards
-- Date: 2025-12-30
-- Description: Creates table to manage all RiviaCo cards (free, 500, 1000) and their assignment status

-- Create rivia_cards table
CREATE TABLE rivia_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_on TIMESTAMP NOT NULL,
    card_code VARCHAR(20) UNIQUE NOT NULL,
    brand VARCHAR(50) NOT NULL,
    valid_till DATE,
    member_id UUID,
    price NUMERIC(10,2),
    is_free BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
);

-- Create index for card_code for quick lookup
CREATE INDEX idx_rivia_cards_card_code ON rivia_cards(card_code);

-- Create index for member_id to find cards assigned to specific members
CREATE INDEX idx_rivia_cards_member_id ON rivia_cards(member_id);

-- Create index for status to filter unassigned cards
CREATE INDEX idx_rivia_cards_status ON rivia_cards(status);

-- Create index for is_free to quickly find free cards
CREATE INDEX idx_rivia_cards_is_free ON rivia_cards(is_free);