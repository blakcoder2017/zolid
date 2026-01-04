-- Migration: Add RiviaCo plan tracking fields to artisan_profiles
-- Purpose: Track RiviaCo enrollment plan (FREE/STANDARD), enrollment date, and contribution tracking

-- Add new columns to artisan_profiles table
ALTER TABLE artisan_profiles
ADD COLUMN IF NOT EXISTS riviaco_plan VARCHAR(20) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS riviaco_enrollment_date TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS riviaco_standard_plan_contribution_pesewas BIGINT DEFAULT 0;

-- Create index for querying by plan
CREATE INDEX IF NOT EXISTS idx_artisan_profiles_riviaco_plan ON artisan_profiles(riviaco_plan);

-- Add comment for documentation
COMMENT ON COLUMN artisan_profiles.riviaco_plan IS 'RiviaCo plan type: FREE (upon verification) or STANDARD (after first gig earnings)';
COMMENT ON COLUMN artisan_profiles.riviaco_enrollment_date IS 'Date when artisan enrolled in RiviaCo (Free plan)';
COMMENT ON COLUMN artisan_profiles.riviaco_standard_plan_contribution_pesewas IS 'Total contribution toward Standard plan annual fee (500 GHS = 50000 pesewas). 20 cedis/month = 2000 pesewas/month';
