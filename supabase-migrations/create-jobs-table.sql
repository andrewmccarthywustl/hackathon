-- Create jobs table for async task tracking
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  progress_message TEXT,
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);

-- Create index on created_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);

-- Enable Row Level Security
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role (backend) to do everything
CREATE POLICY "Service role has full access to jobs"
  ON jobs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Allow anyone to read all jobs (for now - you can restrict this later)
-- This allows the frontend to poll job status
CREATE POLICY "Anyone can read jobs"
  ON jobs
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Optional: If you want to restrict users to only see their own jobs,
-- you would need to add a user_id column and change the policies.
-- For a public research tool, allowing read access to all jobs is fine.

-- Optional: Add a policy to auto-delete old completed jobs after 24 hours
-- This can be done with a scheduled function or cron job
-- For now, we'll just add a comment as a reminder
-- COMMENT ON TABLE jobs IS 'Consider adding a cleanup policy to delete jobs older than 24 hours';
