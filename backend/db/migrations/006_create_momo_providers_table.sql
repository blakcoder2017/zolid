-- Create table for Mobile Money provider codes
CREATE TABLE IF NOT EXISTS momo_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name VARCHAR(50) NOT NULL,
    provider_code VARCHAR(10) NOT NULL,  -- Paystack code (e.g., 'mtn', 'atl', 'vod')
    country VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider_name, country)  -- Same provider can exist in different countries
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_momo_providers_code_country ON momo_providers(provider_code, country) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_momo_providers_name_country ON momo_providers(provider_name, country) WHERE is_active = TRUE;

-- Seed data for mobile money providers
-- Based on official Paystack provider codes
INSERT INTO momo_providers (provider_name, provider_code, country) VALUES
    ('MTN', 'mtn', 'Ghana'),
    ('ATMoney', 'atl', 'Ghana'),
    ('Airtel Money', 'atl', 'Ghana'),
    ('Telecel', 'vod', 'Ghana'),
    ('MTN', 'mtn', 'CIV'),
    ('Orange', 'orange', 'CIV'),
    ('Wave', 'wave', 'CIV'),
    ('Airtel Money', 'atl', 'Kenya'),
    ('M-PESA', 'mpesa', 'Kenya')
ON CONFLICT (provider_name, country) DO NOTHING;

-- Add comment
COMMENT ON TABLE momo_providers IS 'Mobile Money provider codes for Paystack transfers. Maps provider names to Paystack codes.';
COMMENT ON COLUMN momo_providers.provider_code IS 'The code used by Paystack API (e.g., mtn, atl, vod, mpesa, orange, wave)';
COMMENT ON COLUMN momo_providers.country IS 'ISO country code or country name where this provider operates';
