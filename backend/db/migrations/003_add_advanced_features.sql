-- Migration 003: Advanced Features
BEGIN;

-- FCM tokens
ALTER TABLE artisan_profiles 
ADD COLUMN IF NOT EXISTS fcm_token TEXT,
ADD COLUMN IF NOT EXISTS fcm_token_updated_at TIMESTAMPTZ;

ALTER TABLE client_profiles 
ADD COLUMN IF NOT EXISTS fcm_token TEXT,
ADD COLUMN IF NOT EXISTS fcm_token_updated_at TIMESTAMPTZ;

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('artisan', 'client')),
    notification_type VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivered BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    fcm_message_id TEXT
);

CREATE INDEX idx_notifications_user ON notifications(user_id, user_type);
CREATE INDEX idx_notifications_sent ON notifications(sent_at DESC);

-- Analytics
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    user_id UUID,
    user_type VARCHAR(20),
    job_id UUID,
    quote_id UUID,
    event_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created ON analytics_events(created_at DESC);

-- Quote Negotiations
CREATE TABLE IF NOT EXISTS quote_negotiations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES job_quotes(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL CHECK (round_number BETWEEN 1 AND 3),
    offered_by VARCHAR(20) NOT NULL CHECK (offered_by IN ('client', 'artisan')),
    offered_amount_pesewas INTEGER NOT NULL,
    message TEXT,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'COUNTER')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    responded_at TIMESTAMPTZ
);

CREATE INDEX idx_negotiation_quote ON quote_negotiations(quote_id);
CREATE INDEX idx_negotiation_status ON quote_negotiations(status);

ALTER TABLE job_quotes
ADD COLUMN IF NOT EXISTS allows_negotiation BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS negotiation_rounds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_negotiation_id UUID REFERENCES quote_negotiations(id);

COMMIT;
