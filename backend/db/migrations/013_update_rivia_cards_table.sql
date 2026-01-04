-- Migration: Update rivia_cards table to support lazy activation
-- Date: 2025-12-30
-- Description: Adds assigned_to and member_id columns to rivia_cards table

-- Add assigned_to column as foreign key to artisan_profiles
ALTER TABLE rivia_cards
ADD COLUMN assigned_to UUID REFERENCES artisan_profiles(id) ON DELETE SET NULL;

-- Add member_id column for Rivia membership ID
ALTER TABLE rivia_cards
ADD COLUMN member_id VARCHAR(50);

-- Create index for assigned_to column
CREATE INDEX idx_rivia_cards_assigned_to ON rivia_cards(assigned_to);

-- Create index for member_id column
CREATE INDEX idx_rivia_cards_member_id ON rivia_cards(member_id);