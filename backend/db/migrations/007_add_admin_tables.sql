-- =========================================================================================
-- ZOLID ADMIN SYSTEM: DATABASE SCHEMA EXTENSIONS
-- Adds admin user management, audit logging, and system settings
-- =========================================================================================

-- Start transaction for atomic migration
BEGIN;

-- =========================================================================================
-- 1. EXTEND USER ROLE ENUM (if not already extended)
-- =========================================================================================

-- Check if 'admin' role already exists in user_role_enum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'user_role_enum'
        AND e.enumlabel = 'admin'
        AND n.nspname = 'public'
    ) THEN
        ALTER TYPE user_role_enum ADD VALUE 'admin';
    END IF;
END $$;

-- =========================================================================================
-- 2. ADMIN USERS TABLE
-- =========================================================================================

CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    role VARCHAR(20) DEFAULT 'admin',
    permissions JSONB DEFAULT '{"dashboard": true, "users": true, "jobs": true, "finance": true, "analytics": true, "settings": true}',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_admin_role CHECK (role IN ('admin', 'super_admin'))
);

-- Create indexes for admin_users
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_phone ON admin_users(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);

-- =========================================================================================
-- 3. ADMIN AUDIT LOG
-- =========================================================================================

CREATE TABLE IF NOT EXISTS admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(50),
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for admin_audit_log
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_entity ON admin_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created ON admin_audit_log(created_at DESC);

-- =========================================================================================
-- 4. SYSTEM SETTINGS
-- =========================================================================================

CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(50) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    data_type VARCHAR(20) DEFAULT 'string',
    updated_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_system_settings_type CHECK (data_type IN ('string', 'number', 'boolean', 'json'))
);

-- Create indexes for system_settings
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);

-- =========================================================================================
-- 5. ADMIN NOTIFICATIONS
-- =========================================================================================

CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    related_entity_type VARCHAR(50),
    related_entity_id VARCHAR(50),
    action_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    CONSTRAINT fk_admin_notification_type CHECK (type IN ('info', 'warning', 'error', 'success'))
);

-- Create indexes for admin_notifications
CREATE INDEX IF NOT EXISTS idx_admin_notifications_admin_id ON admin_notifications(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON admin_notifications(admin_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created ON admin_notifications(created_at DESC);

-- =========================================================================================
-- 6. ADMIN DASHBOARD METRICS (for performance)
-- =========================================================================================

CREATE TABLE IF NOT EXISTS admin_dashboard_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(50) NOT NULL,
    metric_value NUMERIC,
    metric_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(metric_name, metric_date)
);

-- Create indexes for admin_dashboard_metrics
CREATE INDEX IF NOT EXISTS idx_admin_metrics_name ON admin_dashboard_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_admin_metrics_date ON admin_dashboard_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_admin_metrics_name_date ON admin_dashboard_metrics(metric_name, metric_date);

-- =========================================================================================
-- 7. ADMIN SESSIONS (for security tracking)
-- =========================================================================================

CREATE TABLE IF NOT EXISTS admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_info TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for admin_sessions
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_active ON admin_sessions(admin_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

-- =========================================================================================
-- 8. INITIAL DATA INSERTION
-- =========================================================================================

-- Insert default system settings if they don't exist
INSERT INTO system_settings (key, value, description, data_type)
VALUES 
    ('platform_name', 'ZOLID Systems', 'Name of the platform', 'string'),
    ('platform_email', 'admin@zolid.online', 'Platform contact email', 'string'),
    ('platform_phone', '+233244123456', 'Platform contact phone', 'string'),
    ('max_job_value', '1000000', 'Maximum job value in pesewas (GHS 10,000)', 'number'),
    ('min_job_value', '1000', 'Minimum job value in pesewas (GHS 10)', 'number'),
    ('platform_fee_percent', '5', 'Platform commission percentage', 'number'),
    ('warranty_fee_percent', '15', 'Warranty fee percentage', 'number'),
    ('riviaco_premium_pesewas', '2000', 'RiviaCo premium amount in pesewas', 'number'),
    ('job_expiry_hours', '72', 'Hours before job expires (quote system)', 'number'),
    ('max_quotes_per_job', '10', 'Maximum number of quotes per job', 'number')
ON CONFLICT (key) DO NOTHING;

-- =========================================================================================
-- 9. TRIGGERS FOR AUDIT LOGGING
-- =========================================================================================

-- Trigger for logging admin user changes
CREATE OR REPLACE FUNCTION log_admin_user_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO admin_audit_log (
            admin_id, action, entity_type, entity_id, new_value, ip_address, user_agent
        ) VALUES (
            NEW.id, 'create', 'admin_user', NEW.id::text, 
            to_jsonb(NEW), 'system', 'database_trigger'
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO admin_audit_log (
            admin_id, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent
        ) VALUES (
            NEW.id, 'update', 'admin_user', NEW.id::text,
            to_jsonb(OLD), to_jsonb(NEW), 'system', 'database_trigger'
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO admin_audit_log (
            admin_id, action, entity_type, entity_id, old_value, ip_address, user_agent
        ) VALUES (
            OLD.id, 'delete', 'admin_user', OLD.id::text,
            to_jsonb(OLD), 'system', 'database_trigger'
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_admin_user_audit ON admin_users;
CREATE TRIGGER trigger_admin_user_audit
AFTER INSERT OR UPDATE OR DELETE ON admin_users
FOR EACH ROW
EXECUTE FUNCTION log_admin_user_changes();

-- =========================================================================================
-- 10. VIEWS FOR COMMON ADMIN QUERIES
-- =========================================================================================

-- View for platform statistics
CREATE OR REPLACE VIEW admin_platform_stats AS
SELECT 
    (SELECT COUNT(*) FROM client_profiles) AS total_clients,
    (SELECT COUNT(*) FROM artisan_profiles) AS total_artisans,
    (SELECT COUNT(*) FROM job_transactions) AS total_jobs,
    (SELECT COUNT(*) FROM job_transactions WHERE current_state = 'PAYOUT_SUCCESS') AS completed_jobs,
    (SELECT COUNT(*) FROM job_transactions WHERE current_state IN ('OPEN_FOR_QUOTES', 'QUOTED')) AS open_jobs,
    (SELECT COUNT(*) FROM job_transactions WHERE current_state = 'DISPUTED') AS disputed_jobs,
    (SELECT SUM(gross_fee_pesewas) FROM job_transactions WHERE current_state = 'PAYOUT_SUCCESS') AS total_revenue_pesewas,
    (SELECT COUNT(*) FROM admin_users WHERE is_active = TRUE) AS active_admins;

-- View for recent activity
CREATE OR REPLACE VIEW admin_recent_activity AS
SELECT 
    'job' AS entity_type,
    jt.id AS entity_id,
    jt.created_at AS activity_time,
    'Job created' AS activity_description,
    'client' AS user_type,
    jt.client_id AS user_id,
    cp.full_name AS user_name
FROM job_transactions jt
JOIN client_profiles cp ON jt.client_id = cp.id
WHERE jt.created_at > NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
    'quote' AS entity_type,
    jq.id AS entity_id,
    jq.created_at AS activity_time,
    'Quote submitted' AS activity_description,
    'artisan' AS user_type,
    jq.artisan_id AS user_id,
    ap.full_name AS user_name
FROM job_quotes jq
JOIN artisan_profiles ap ON jq.artisan_id = ap.id
WHERE jq.created_at > NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
    'payment' AS entity_type,
    jt.id AS entity_id,
    jt.updated_at AS activity_time,
    'Payment completed' AS activity_description,
    'client' AS user_type,
    jt.client_id AS user_id,
    cp.full_name AS user_name
FROM job_transactions jt
JOIN client_profiles cp ON jt.client_id = cp.id
WHERE jt.current_state = 'PAYOUT_SUCCESS'
AND jt.updated_at > NOW() - INTERVAL '7 days'

ORDER BY activity_time DESC
LIMIT 100;

-- =========================================================================================
-- 11. COMMIT TRANSACTION
-- =========================================================================================

COMMIT;

-- =========================================================================================
-- MIGRATION COMPLETE
-- =========================================================================================

-- Migration: 007_add_admin_tables.sql
-- Description: Adds admin user management, audit logging, and system settings
-- Applied: [timestamp]
-- Status: ✅ COMPLETE