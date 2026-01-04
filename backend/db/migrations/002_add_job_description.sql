-- Add job_description field to job_transactions table
ALTER TABLE job_transactions 
ADD COLUMN IF NOT EXISTS job_description TEXT;
