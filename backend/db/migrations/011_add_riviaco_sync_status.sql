-- Migration: Add riviaco_sync_status column to artisan_profiles table

ALTER TABLE artisan_profiles
ADD COLUMN riviaco_sync_status VARCHAR(20) DEFAULT 'pending';

-- Create index for riviaco_sync_status
CREATE INDEX idx_artisan_riviaco_sync_status ON artisan_profiles (riviaco_sync_status);

-- Update existing records to have the new column
UPDATE artisan_profiles
SET riviaco_sync_status =
    CASE
        WHEN riviaco_member_id IS NOT NULL AND riviaco_member_id NOT LIKE 'TEMP_%' THEN 'synced'
        ELSE 'pending'
    END
WHERE riviaco_sync_status IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN artisan_profiles.riviaco_sync_status IS 'Status of RiviaCo synchronization: pending, synced, failed';