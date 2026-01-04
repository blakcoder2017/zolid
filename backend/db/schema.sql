-- =========================================================================================
-- ZOLID SYSTEMS: MVP DATABASE SCHEMA (GHANA MARKET)
-- Focus: Modular Monolith, Double-Entry Ledger, PWA Trust
-- Dialect: PostgreSQL 14+
-- =========================================================================================

-- === 0. IDEMPOTENCY: DROP DEPENDENT OBJECTS FIRST (CRITICAL FIX) ===

-- Drop Triggers/Functions
DROP TRIGGER IF EXISTS trigger_update_balance ON postings;
DROP FUNCTION IF EXISTS update_account_balance() CASCADE;

-- Drop Tables (Reverse order of creation/dependency to avoid FOREIGN KEY errors)
-- Note: benefits_ledger references remittance_batch, so drop it first
DROP TABLE IF EXISTS benefits_ledger CASCADE;
DROP TABLE IF EXISTS remittance_batch CASCADE;
DROP TABLE IF EXISTS job_transactions CASCADE;
DROP TABLE IF EXISTS artisan_guarantors CASCADE;
DROP TABLE IF EXISTS postings CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS financial_config CASCADE;
DROP TABLE IF EXISTS artisan_profiles CASCADE;
DROP TABLE IF EXISTS client_profiles CASCADE;

-- Drop Types (Must be dropped last, after all dependent tables are gone)
DROP TYPE IF EXISTS job_state_enum;
DROP TYPE IF EXISTS posting_direction_enum;
DROP TYPE IF EXISTS account_type_enum;


-- Enable UUID extension for secure primary keys
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================================
-- 1. ENUMS & CONSTANTS
-- =========================================================================================

CREATE TYPE account_type_enum AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');
CREATE TYPE posting_direction_enum AS ENUM ('DEBIT', 'CREDIT');

-- Job Transaction State Machine (JTM)
CREATE TYPE job_state_enum AS ENUM (
    'DRAFT',                    -- Job created, no payment required yet
    'MATCHED_PENDING_PAYMENT',  -- Artisan(s) accepted, client selected preferred artisan, waiting for payment
    'ESCROW_PENDING',           -- DEPRECATED: Legacy state, use MATCHED_PENDING_PAYMENT instead
    'ESCROW_HELD',              -- Client paid, funds locked in Escrow (artisan can now start)
    'STARTED',                  -- Artisan onsite/working
    'COMPLETED_PENDING',        -- Work done, waiting for Client Signoff
    'DISPUTED',                 -- Client or Artisan raised issue
    'DISPUTE_NEGOTIATION',      -- Mutual resolution phase
    'PAYOUT_SUCCESS',           -- Client Signed Off, Funds released to Artisan
    'CANCELLED'                 -- Refund processed
);

-- =========================================================================================
-- 2. USER PROFILES (IDENTITY & TRUST)
-- =========================================================================================

-- Clients (The Payers)
CREATE TABLE client_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_primary VARCHAR(15) UNIQUE NOT NULL, -- E.164 Format (e.g., +233244xxxxxx)
    full_name VARCHAR(100),
    email VARCHAR(100) UNIQUE, -- Required by Paystack for initiation
    password_hash VARCHAR(255) NOT NULL,
    
    -- Localization
    home_gps_address VARCHAR(255),
    home_lat DECIMAL(9,6),         -- Latitude coordinate
    home_lon DECIMAL(9,6),         -- Longitude coordinate
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Artisans (The Earners)
CREATE TABLE artisan_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_primary VARCHAR(15) UNIQUE NOT NULL, -- E.164 Format
    
    -- AUTHENTICATION & CORE IDENTITY
    full_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    profile_picture_url TEXT,
    
    -- FINANCIAL & VERIFICATION MOAT (Unlock for Jobs)
    momo_network VARCHAR(20) NOT NULL,
    is_momo_verified BOOLEAN DEFAULT FALSE,
    paystack_resolved_name VARCHAR(100),
    paystack_recipient_code VARCHAR(50),
    
    -- SECONDARY VERIFICATION (Tier 2/Post-Login)
    gh_card_number VARCHAR(20) UNIQUE, 
    gh_card_image_url TEXT,
    is_identity_verified BOOLEAN DEFAULT FALSE,
    
    -- SKILLS & OPERATIONS (Updated at Gig Gate)
    primary_trade VARCHAR(50),
    primary_language VARCHAR(20) DEFAULT 'ENGLISH',
    home_gps_address VARCHAR(255),
    home_lat DECIMAL(9,6),
    home_lon DECIMAL(9,6),
    accept_terms BOOLEAN DEFAULT FALSE,
    accept_privacy BOOLEAN DEFAULT FALSE,

    -- BENEFITS (RiviaCo)
    riviaco_policy_id VARCHAR(50),
    riviaco_member_id VARCHAR(50),
    riviaco_card_code VARCHAR(50),
    riviaco_enrollment_date TIMESTAMPTZ,
    riviaco_plan VARCHAR(20),
    
    -- REPUTATION LADDER (Market Verification)
    tier_level INTEGER DEFAULT 1,
    reputation_score NUMERIC(3, 2) DEFAULT 0.00,
    total_review_count INTEGER DEFAULT 0, 
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guarantors (The "Social Trust" Layer)
CREATE TABLE artisan_guarantors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artisan_id UUID REFERENCES artisan_profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    relationship VARCHAR(50), 
    is_verified BOOLEAN DEFAULT FALSE, 
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mobile Money Providers (Provider codes for Paystack)
CREATE TABLE momo_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name VARCHAR(50) NOT NULL,
    provider_code VARCHAR(10) NOT NULL,  -- Paystack code (e.g., 'mtn', 'atl', 'vod')
    country VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider_name, country)  -- Same provider can exist in different countries
);

-- Indexes for momo_providers
CREATE INDEX idx_momo_providers_code_country ON momo_providers(provider_code, country) WHERE is_active = TRUE;
CREATE INDEX idx_momo_providers_name_country ON momo_providers(provider_name, country) WHERE is_active = TRUE;

-- Artisan Reviews (Rating & Review System)
CREATE TABLE artisan_reviews (
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

-- Indexes for artisan_reviews
CREATE INDEX idx_artisan_reviews_artisan_id ON artisan_reviews(artisan_id);
CREATE INDEX idx_artisan_reviews_client_id ON artisan_reviews(client_id);
CREATE INDEX idx_artisan_reviews_job_transaction_id ON artisan_reviews(job_transaction_id);

-- Job Artisan Acceptances (Multiple artisans can accept, client selects preferred)
CREATE TABLE job_artisan_acceptances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES job_transactions(id) ON DELETE CASCADE,
    artisan_id UUID NOT NULL REFERENCES artisan_profiles(id) ON DELETE CASCADE,
    
    -- Acceptance details
    accepted_at TIMESTAMPTZ DEFAULT NOW(),
    is_selected BOOLEAN DEFAULT FALSE,  -- True when client selects this artisan
    
    -- Prevent duplicate acceptances
    UNIQUE(job_id, artisan_id)
);

-- Indexes for job_artisan_acceptances
CREATE INDEX idx_job_artisan_acceptances_job_id ON job_artisan_acceptances(job_id);
CREATE INDEX idx_job_artisan_acceptances_artisan_id ON job_artisan_acceptances(artisan_id);
CREATE INDEX idx_job_artisan_acceptances_selected ON job_artisan_acceptances(job_id, is_selected) WHERE is_selected = TRUE;


-- =========================================================================================
-- 3. FINANCIAL CORE (DOUBLE-ENTRY LEDGER)
-- =========================================================================================

-- Configuration Table (For Super Admin Module)
CREATE TABLE financial_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- COMMISSIONS AND FEES (Stored as DECIMAL percentage, e.g., 0.15 = 15%)
    platform_commission_percent DECIMAL(3,2) NOT NULL, -- Artisan Micro-Fee (e.g., 0.05 = 5%)
    warranty_fee_percent DECIMAL(3,2) NOT NULL,      -- Client Service Fee (e.g., 0.10 = 10%)
    riviaco_premium_pesewas BIGINT NOT NULL,          -- Fixed Health/Benefit deduction (e.g., 2000 = GHS 20.00)

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chart of Accounts
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type account_type_enum NOT NULL,
    currency CHAR(3) DEFAULT 'GHS',
    
    is_tax_liability BOOLEAN DEFAULT FALSE,
    
    -- PERFORMANCE
    balance_pesewas BIGINT DEFAULT 0, 
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transaction Headers (The "Event")
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_id VARCHAR(100) UNIQUE NOT NULL, 
    description TEXT,
    metadata JSONB, 
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Postings (The "Movement")
-- The Atomic Lines. Sum of Debits must equal Sum of Credits.
CREATE TABLE postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE RESTRICT,
    account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,
    
    amount_pesewas BIGINT NOT NULL CHECK (amount_pesewas > 0), 
    direction posting_direction_enum NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================================
-- 4. OPERATIONS (JOBS & OFFLINE PROTOCOL)
-- =========================================================================================

CREATE TABLE job_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- ACTORS (client_id MUST be saved)
    client_id UUID REFERENCES client_profiles(id), -- CLIENT ID FIX
    artisan_id UUID REFERENCES artisan_profiles(id),
    
    -- STATE MACHINE
    current_state job_state_enum DEFAULT 'DRAFT',
    
    -- FINANCIALS (Snapshot for this specific job - stored in pesewas)
    gross_fee_pesewas BIGINT NOT NULL,
    warranty_fee_pesewas BIGINT NOT NULL,
    artisan_payout_pesewas BIGINT NOT NULL,
    riviaco_premium_pesewas BIGINT NOT NULL,
    platform_commission_pesewas BIGINT NOT NULL,
    
    -- LOCATION & EVIDENCE (The "Warranty Lock")
    location_gps_address VARCHAR(20),
    location_lat DECIMAL(9,6),
    location_lon DECIMAL(9,6),
    paystack_reference_id VARCHAR(100),
    job_description TEXT,
    photo_evidence_before_url TEXT,
    photo_evidence_after_url TEXT,
    
    -- PWA SIGN-OFF PROTOCOL (Offline OTP)
    is_client_signed_off BOOLEAN DEFAULT FALSE,
    client_otp VARCHAR(6), -- 6-digit OTP for offline sign-off
    otp_generated_at TIMESTAMPTZ, -- When OTP was generated
    otp_expires_at TIMESTAMPTZ, -- OTP expiration time (15 minutes)
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================================
-- 5. AUTOMATION & INTEGRITY (TRIGGERS)
-- =========================================================================================

-- TRIGGER 1: Auto-Update Account Balances (Performance Cache)
CREATE OR REPLACE FUNCTION update_account_balance() RETURNS TRIGGER AS $$
DECLARE
    account_type account_type_enum;
BEGIN
    SELECT type INTO account_type FROM accounts WHERE id = NEW.account_id;
    
    UPDATE accounts
    SET balance_pesewas = balance_pesewas + (
        CASE 
            -- ASSET/EXPENSE: Debit increases, Credit decreases
            WHEN account_type IN ('ASSET', 'EXPENSE') AND NEW.direction = 'DEBIT' THEN NEW.amount_pesewas
            WHEN account_type IN ('ASSET', 'EXPENSE') AND NEW.direction = 'CREDIT' THEN -NEW.amount_pesewas
            -- LIABILITY/EQUITY/REVENUE: Credit increases, Debit decreases
            WHEN account_type IN ('LIABILITY', 'EQUITY', 'REVENUE') AND NEW.direction = 'CREDIT' THEN NEW.amount_pesewas
            WHEN account_type IN ('LIABILITY', 'EQUITY', 'REVENUE') AND NEW.direction = 'DEBIT' THEN -NEW.amount_pesewas
            ELSE 0
        END
    )
    WHERE id = NEW.account_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_balance
AFTER INSERT ON postings
FOR EACH ROW
EXECUTE FUNCTION update_account_balance();

-- =========================================================================================
-- 6. BENEFITS (Partner Remittance Tracking)
-- =========================================================================================

-- Remittance Batch: Tracks batch payouts to partners (RiviaCo, SSNIT, etc.)
-- MUST be created BEFORE benefits_ledger since benefits_ledger references it
CREATE TABLE remittance_batch (
    batch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_name VARCHAR(50) NOT NULL, -- RiviaCo, SSNIT (Future)
    total_amount_pesewas BIGINT NOT NULL CHECK (total_amount_pesewas > 0),
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, PROCESSING, SUCCESS, FAILED
    paystack_transfer_ref VARCHAR(100),
    paystack_batch_code VARCHAR(100), -- Batch transfer code from Paystack
    scheduled_date DATE NOT NULL, -- When batch should be processed
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Benefits Ledger: Tracks RiviaCo premiums accumulated per artisan
CREATE TABLE benefits_ledger (
    ledger_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artisan_id UUID REFERENCES artisan_profiles(id) ON DELETE CASCADE,
    job_id UUID REFERENCES job_transactions(id) ON DELETE SET NULL,
    premium_amount_pesewas BIGINT NOT NULL CHECK (premium_amount_pesewas > 0),
    remittance_batch_id UUID REFERENCES remittance_batch(batch_id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, REMITTED
    created_at TIMESTAMPTZ DEFAULT NOW(),
    remitted_at TIMESTAMPTZ
);

-- =========================================================================================
-- 7. INDEXES FOR PERFORMANCE
-- =========================================================================================

CREATE INDEX idx_artisan_phone ON artisan_profiles(phone_primary);
CREATE INDEX idx_client_phone ON client_profiles(phone_primary);
CREATE INDEX idx_job_state ON job_transactions(current_state);
CREATE INDEX idx_job_transactions_client_id ON job_transactions(client_id);
CREATE INDEX idx_job_transactions_artisan_id ON job_transactions(artisan_id);
CREATE INDEX idx_job_transactions_client_state ON job_transactions(client_id, current_state);
CREATE INDEX idx_job_transactions_artisan_state ON job_transactions(artisan_id, current_state);
CREATE INDEX idx_job_transactions_created_at ON job_transactions(created_at DESC);
CREATE INDEX idx_posting_account ON postings(account_id);
CREATE INDEX idx_posting_transaction ON postings(transaction_id);
CREATE INDEX idx_benefits_artisan ON benefits_ledger(artisan_id);
CREATE INDEX idx_benefits_batch ON benefits_ledger(remittance_batch_id);
CREATE INDEX idx_benefits_status ON benefits_ledger(status);
CREATE INDEX idx_remittance_partner ON remittance_batch(partner_name);
CREATE INDEX idx_remittance_status ON remittance_batch(status);
CREATE INDEX idx_remittance_scheduled ON remittance_batch(scheduled_date);

-- 8. INITIAL DATA INSERTION
INSERT INTO financial_config (platform_commission_percent, warranty_fee_percent, riviaco_premium_pesewas)
VALUES (0.05, 0.15, 2000)
ON CONFLICT (id) DO NOTHING; -- Ensure idempotent initial data load
-- Note: warranty_fee_percent = 0.15 (15% markup), platform_commission_percent = 0.05 (5%)
-- RiviaCo premium now uses 5% of artisan quote, but this fixed amount is kept for legacy compatibility