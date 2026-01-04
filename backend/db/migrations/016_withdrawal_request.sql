CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- Client ID
    user_role VARCHAR(20) DEFAULT 'CLIENT',
    amount_pesewas BIGINT NOT NULL CHECK (amount_pesewas > 0),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'PROCESSED')),
    
    -- Transaction that locked the funds
    transaction_id UUID REFERENCES transactions(id), 
    
    -- Admin Processing Info
    admin_notes TEXT,
    processed_at TIMESTAMP,
    processed_by UUID, 
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster history lookups
CREATE INDEX idx_withdrawal_user ON withdrawal_requests(user_id);

ALTER TYPE job_state_enum ADD VALUE IF NOT EXISTS 'CANCELLED_REFUNDED';