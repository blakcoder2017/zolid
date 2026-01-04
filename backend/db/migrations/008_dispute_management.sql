-- 1. Add 'DISPUTED' to your job state enum check (if using postgres enums)
-- Or just allow the string 'DISPUTED' in your application logic.

-- 2. Create the Disputes Table
CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES job_transactions(id),

    -- 1. Create two nullable columns instead of one
    raised_by_client_id UUID REFERENCES client_profiles(id),          -- Links to Clients
    raised_by_artisan_id UUID REFERENCES artisan_profiles(id), -- Links to Artisans

    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    evidence_urls TEXT[],
    status VARCHAR(20) DEFAULT 'OPEN',
    resolution_notes TEXT,
    proposed_refund_amount INTEGER,
    artisan_counter_offer INTEGER,
    current_turn VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- 2. Add a Constraint: Ensure exactly one of them is set (XOR logic)
    CONSTRAINT check_raiser_exists CHECK (
        (raised_by_client_id IS NOT NULL AND raised_by_artisan_id IS NULL) OR
        (raised_by_client_id IS NULL AND raised_by_artisan_id IS NOT NULL)
    )
);

-- 3. Create indexes for both so lookups are fast
CREATE INDEX idx_disputes_client ON disputes(raised_by_client_id);
CREATE INDEX idx_disputes_artisan ON disputes(raised_by_artisan_id);

-- 3. Add index for faster lookups
CREATE INDEX idx_disputes_job_id ON disputes(job_id);