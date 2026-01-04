-- Add MATCHED_PENDING_PAYMENT state to job_state_enum
-- This state indicates artisan(s) have accepted, client has selected preferred artisan, waiting for payment

-- Note: PostgreSQL doesn't support adding values to ENUM types directly
-- We need to alter the type by creating a new type, migrating data, and replacing the old type

-- Step 1: Create new enum type with the new value
CREATE TYPE job_state_enum_new AS ENUM (
    'DRAFT',
    'MATCHED_PENDING_PAYMENT',  -- NEW: Artisan accepted and selected, waiting for client payment
    'ESCROW_PENDING',            -- DEPRECATED: Keep for backward compatibility during migration
    'ESCROW_HELD',
    'STARTED',
    'COMPLETED_PENDING',
    'DISPUTED',
    'PAYOUT_SUCCESS',
    'CANCELLED'
);

-- Step 2: Drop the default constraint on current_state column
ALTER TABLE job_transactions 
    ALTER COLUMN current_state DROP DEFAULT;

-- Step 3: Alter the job_transactions table to use the new type
ALTER TABLE job_transactions 
    ALTER COLUMN current_state TYPE job_state_enum_new 
    USING current_state::text::job_state_enum_new;

-- Step 4: Re-add the default constraint with the new type
ALTER TABLE job_transactions 
    ALTER COLUMN current_state SET DEFAULT 'DRAFT'::job_state_enum_new;

-- Step 5: Drop the old enum type (this will fail if there are other dependencies, but should work)
DROP TYPE job_state_enum;

-- Step 6: Rename the new enum type to the original name
ALTER TYPE job_state_enum_new RENAME TO job_state_enum;
