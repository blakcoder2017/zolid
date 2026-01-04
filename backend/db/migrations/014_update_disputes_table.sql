-- Update the disputes table to use separate columns for client and artisan
-- This migration alters the existing table structure

-- 1. First, drop the existing constraint if it exists
ALTER TABLE disputes DROP CONSTRAINT IF EXISTS check_raiser_exists;

-- 2. Add the new nullable columns
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS raised_by_client_id UUID REFERENCES client_profiles(id);
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS raised_by_artisan_id UUID REFERENCES artisan_profiles(id);

-- 3. Create the new constraint for XOR logic
ALTER TABLE disputes ADD CONSTRAINT check_raiser_exists CHECK (
    (raised_by_client_id IS NOT NULL AND raised_by_artisan_id IS NULL) OR
    (raised_by_client_id IS NULL AND raised_by_artisan_id IS NOT NULL)
);

-- 4. Create indexes for both columns
CREATE INDEX IF NOT EXISTS idx_disputes_client ON disputes(raised_by_client_id);
CREATE INDEX IF NOT EXISTS idx_disputes_artisan ON disputes(raised_by_artisan_id);

-- 5. Migrate existing data from raised_by_id to the new columns
-- This assumes raised_by_id references either client_profiles or artisan_profiles
-- We'll need to determine which table each raised_by_id belongs to
DO $$
DECLARE
    dispute_record RECORD;
    is_client BOOLEAN;
    is_artisan BOOLEAN;
BEGIN
    FOR dispute_record IN SELECT id, raised_by_id FROM disputes WHERE raised_by_id IS NOT NULL LOOP
        -- Check if the raised_by_id exists in client_profiles
        SELECT EXISTS(SELECT 1 FROM client_profiles WHERE id = dispute_record.raised_by_id) INTO is_client;
        
        -- Check if the raised_by_id exists in artisan_profiles
        SELECT EXISTS(SELECT 1 FROM artisan_profiles WHERE id = dispute_record.raised_by_id) INTO is_artisan;
        
        IF is_client THEN
            UPDATE disputes SET raised_by_client_id = dispute_record.raised_by_id WHERE id = dispute_record.id;
        ELSIF is_artisan THEN
            UPDATE disputes SET raised_by_artisan_id = dispute_record.raised_by_id WHERE id = dispute_record.id;
        END IF;
    END LOOP;
END $$;

-- 6. Drop the old raised_by_id column (after data migration)
ALTER TABLE disputes DROP COLUMN IF EXISTS raised_by_id;