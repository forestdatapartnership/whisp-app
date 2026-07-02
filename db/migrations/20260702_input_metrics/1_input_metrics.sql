ALTER TABLE analysis_jobs
  ADD COLUMN IF NOT EXISTS input_metrics JSONB;
