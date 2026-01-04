-- Migration 002: Add Quote-Based Job System
BEGIN;

-- 1. CREATE JOB_QUOTES TABLE
CREATE TABLE IF NOT EXISTS job_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES job_transactions(id) ON DELETE CASCADE,
    artisan_id UUID NOT NULL REFERENCES artisan_profiles(id) ON DELETE CASCADE,
    
    quoted_fee_pesewas INTEGER NOT NULL CHECK (quoted_fee_pesewas >= 1000 AND quoted_fee_pesewas <= 1000000),
    quote_message TEXT,
    estimated_duration_hours INTEGER CHECK (estimated_duration_hours > 0),
    
    warranty_fee_pesewas INTEGER NOT NULL,
    total_client_pays_pesewas INTEGER NOT NULL,
    artisan_payout_pesewas INTEGER NOT NULL,
    platform_commission_pesewas INTEGER NOT NULL,
    riviaco_premium_pesewas INTEGER NOT NULL,
    
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN')),
    rejection_reason VARCHAR(100),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(job_id, artisan_id)
);

CREATE INDEX idx_job_quotes_job_id ON job_quotes(job_id);
CREATE INDEX idx_job_quotes_artisan_id ON job_quotes(artisan_id);
CREATE INDEX idx_job_quotes_status ON job_quotes(status);
CREATE INDEX idx_job_quotes_created_at ON job_quotes(created_at);

-- 2. MODIFY JOB_TRANSACTIONS TABLE
ALTER TABLE job_transactions
ADD COLUMN IF NOT EXISTS selected_quote_id UUID REFERENCES job_quotes(id),
ADD COLUMN IF NOT EXISTS quotes_deadline TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '48 hours'),
ADD COLUMN IF NOT EXISTS max_quotes INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS quote_count INTEGER DEFAULT 0;

ALTER TABLE job_transactions 
ALTER COLUMN gross_fee_pesewas DROP NOT NULL;

-- 3. CREATE TRIGGER FOR UPDATED_AT
CREATE OR REPLACE FUNCTION update_job_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_quotes_updated_at
    BEFORE UPDATE ON job_quotes
    FOR EACH ROW
    EXECUTE FUNCTION update_job_quotes_updated_at();

-- 4. CLEAN UP EXISTING TEST DATA
TRUNCATE TABLE job_transactions CASCADE;
TRUNCATE TABLE job_artisan_acceptances CASCADE;
TRUNCATE TABLE postings CASCADE;
TRUNCATE TABLE transactions CASCADE;

COMMIT;
