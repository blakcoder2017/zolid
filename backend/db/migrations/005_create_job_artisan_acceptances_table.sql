-- Create table to track multiple artisan acceptances for a job
-- This allows clients to see multiple artisans who accepted and choose their preferred one

CREATE TABLE IF NOT EXISTS job_artisan_acceptances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES job_transactions(id) ON DELETE CASCADE,
    artisan_id UUID NOT NULL REFERENCES artisan_profiles(id) ON DELETE CASCADE,
    
    -- Acceptance details
    accepted_at TIMESTAMPTZ DEFAULT NOW(),
    is_selected BOOLEAN DEFAULT FALSE,  -- True when client selects this artisan
    
    -- Prevent duplicate acceptances
    UNIQUE(job_id, artisan_id)
);

-- Index for fast lookup of artisans who accepted a job
CREATE INDEX IF NOT EXISTS idx_job_artisan_acceptances_job_id ON job_artisan_acceptances(job_id);
CREATE INDEX IF NOT EXISTS idx_job_artisan_acceptances_artisan_id ON job_artisan_acceptances(artisan_id);
CREATE INDEX IF NOT EXISTS idx_job_artisan_acceptances_selected ON job_artisan_acceptances(job_id, is_selected) WHERE is_selected = TRUE;
