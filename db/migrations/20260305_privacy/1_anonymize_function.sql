CREATE OR REPLACE FUNCTION anonymize_expired_pii(_retention_days INT DEFAULT 90)
RETURNS TABLE (
  target TEXT,
  rows_affected INT
) AS $$
DECLARE
  cutoff TIMESTAMPTZ := NOW() - (_retention_days || ' days')::INTERVAL;
  _rows INT;
BEGIN
  -- analysis_jobs.ip_address
  UPDATE analysis_jobs
  SET ip_address = NULL
  WHERE ip_address IS NOT NULL
    AND created_at < cutoff;
  GET DIAGNOSTICS _rows = ROW_COUNT;
  IF _rows > 0 THEN
    target := 'analysis_jobs.ip_address';
    rows_affected := _rows;
    RETURN NEXT;
  END IF;

  -- extend: add more PII anonymization blocks here
END;
$$ LANGUAGE plpgsql;

