ALTER TABLE analysis_jobs
  ADD COLUMN IF NOT EXISTS timeout_seconds INT;

CREATE OR REPLACE FUNCTION release_stuck_analysis_jobs(
  _processing_margin_minutes INT DEFAULT 5,
  _queue_max_age_minutes INT DEFAULT 1440
)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  _processing_released INT := 0;
  _queued_released INT := 0;
BEGIN
  UPDATE analysis_jobs
  SET status = 'analysis_error',
      completed_at = NOW(),
      error_message = 'Job automatically marked as failed - exceeded maximum allowed runtime'
  WHERE status = 'analysis_processing'
    AND started_at IS NOT NULL
    AND timeout_seconds IS NOT NULL
    AND started_at + (timeout_seconds + (_processing_margin_minutes * 60)) * INTERVAL '1 second' < NOW();
  GET DIAGNOSTICS _processing_released = ROW_COUNT;

  UPDATE analysis_jobs
  SET status = 'analysis_error',
      completed_at = NOW(),
      error_message = 'Job automatically marked as failed - exceeded maximum time in queue'
  WHERE status = 'analysis_queued'
    AND created_at + (_queue_max_age_minutes * INTERVAL '1 minute') < NOW();
  GET DIAGNOSTICS _queued_released = ROW_COUNT;

  RETURN _processing_released + _queued_released;
END;
$$;
