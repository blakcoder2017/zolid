-- Migration 004: Fix job_state_enum
BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'OPEN_FOR_QUOTES' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'job_state_enum')
    ) THEN
        ALTER TYPE job_state_enum ADD VALUE 'OPEN_FOR_QUOTES';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'QUOTED' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'job_state_enum')
    ) THEN
        ALTER TYPE job_state_enum ADD VALUE 'QUOTED';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'MATCHED' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'job_state_enum')
    ) THEN
        ALTER TYPE job_state_enum ADD VALUE 'MATCHED';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'AWAITING_PAYMENT' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'job_state_enum')
    ) THEN
        ALTER TYPE job_state_enum ADD VALUE 'AWAITING_PAYMENT';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'IN_PROGRESS' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'job_state_enum')
    ) THEN
        ALTER TYPE job_state_enum ADD VALUE 'IN_PROGRESS';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'PAYOUT_FAILED' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'job_state_enum')
    ) THEN
        ALTER TYPE job_state_enum ADD VALUE 'PAYOUT_FAILED';
    END IF;
END $$;

COMMIT;
