-- Add indexes to improve query performance for job_transactions
-- These indexes prevent statement timeouts on dashboard queries

-- Index for client_id (used in client balance and jobs queries)
CREATE INDEX IF NOT EXISTS idx_job_transactions_client_id ON job_transactions(client_id);

-- Index for artisan_id (used in artisan jobs and balance queries)
CREATE INDEX IF NOT EXISTS idx_job_transactions_artisan_id ON job_transactions(artisan_id);

-- Composite index for client_id + current_state (optimizes client balance aggregation queries)
CREATE INDEX IF NOT EXISTS idx_job_transactions_client_state ON job_transactions(client_id, current_state);

-- Composite index for artisan_id + current_state (optimizes artisan balance aggregation queries)
CREATE INDEX IF NOT EXISTS idx_job_transactions_artisan_state ON job_transactions(artisan_id, current_state);

-- Index for created_at (used in ORDER BY clauses)
CREATE INDEX IF NOT EXISTS idx_job_transactions_created_at ON job_transactions(created_at DESC);
