-- Migration: Add required fields to artisan_profiles table
-- Date: 2025-12-30
-- Description: Adds dob, gender, email fields to artisan_profiles table for one-step registration

-- Add new columns to artisan_profiles table
ALTER TABLE artisan_profiles
ADD COLUMN dob DATE,
ADD COLUMN gender VARCHAR(20),
ADD COLUMN email VARCHAR(100);

-- Add unique constraint to email column
CREATE UNIQUE INDEX idx_artisan_email ON artisan_profiles(email);