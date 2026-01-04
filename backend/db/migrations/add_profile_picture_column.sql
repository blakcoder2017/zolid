-- Migration: Add profile_picture_url column to artisan_profiles
-- Date: 2025-01-XX
-- Description: Adds profile picture URL column to store artisan profile images

-- Add the column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'artisan_profiles' 
        AND column_name = 'profile_picture_url'
    ) THEN
        ALTER TABLE artisan_profiles 
        ADD COLUMN profile_picture_url TEXT;
        
        RAISE NOTICE 'Column profile_picture_url added successfully to artisan_profiles';
    ELSE
        RAISE NOTICE 'Column profile_picture_url already exists in artisan_profiles';
    END IF;
END $$;
