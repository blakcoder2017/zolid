-- Migration: Add RiviaCo member and card tracking fields to artisan_profiles
-- Date: 2025-12-30
-- Description: Adds RiviaCo member ID and access card code columns for Free plan enrollment

-- Add riviaco_member_id column
ALTER TABLE artisan_profiles ADD riviaco_member_id VARCHAR(50);

-- Add riviaco_card_code column
ALTER TABLE artisan_profiles ADD riviaco_card_code VARCHAR(50);

-- Create index for riviaco_member_id
CREATE INDEX idx_artisan_profiles_riviaco_member_id ON artisan_profiles(riviaco_member_id);

-- Create index for riviaco_card_code
CREATE INDEX idx_artisan_profiles_riviaco_card_code ON artisan_profiles(riviaco_card_code);