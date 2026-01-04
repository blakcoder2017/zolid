CREATE TABLE IF NOT EXISTS dispute_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispute_id UUID REFERENCES disputes(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL, -- Can be Client ID, Artisan ID, or Admin ID
    sender_role VARCHAR(20) CHECK (sender_role IN ('CLIENT', 'ARTISAN', 'ADMIN')),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Ensure Client Wallet Liability Account Exists (for holding refunds)
INSERT INTO accounts (id, name, type, code, description)
VALUES (uuid_generate_v4(), 'Liability_Client_Wallet', 'LIABILITY', '2003', 'Wallet for client refunds and disputed funds')
ON CONFLICT (name) DO NOTHING;