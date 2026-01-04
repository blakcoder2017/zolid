-- Create reviews table for rating artisans
-- This migration adds the artisan_reviews table for the rating system
CREATE TABLE IF NOT EXISTS artisan_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_transaction_id UUID NOT NULL REFERENCES job_transactions(id) ON DELETE CASCADE,
    artisan_id UUID NOT NULL REFERENCES artisan_profiles(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(job_transaction_id) -- One review per job
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_artisan_reviews_artisan_id ON artisan_reviews(artisan_id);
CREATE INDEX IF NOT EXISTS idx_artisan_reviews_client_id ON artisan_reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_artisan_reviews_job_transaction_id ON artisan_reviews(job_transaction_id);
