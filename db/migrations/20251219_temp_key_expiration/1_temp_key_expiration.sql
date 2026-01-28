DROP FUNCTION IF EXISTS get_temp_api_key();

CREATE OR REPLACE FUNCTION get_temp_api_key()
RETURNS TABLE (
  api_key UUID,
  expires_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT ak.api_key::uuid AS api_key, ak.expires_at AS expires_at
  FROM api_keys ak
  WHERE ak.user_id = -1000
    AND ak.revoked = FALSE
    AND (ak.expires_at IS NULL OR ak.expires_at > NOW())
  ORDER BY ak.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY
    INSERT INTO api_keys (user_id, api_key, expires_at, revoked)
    VALUES (-1000, uuid_generate_v4()::text, NOW() + INTERVAL '10 minutes', FALSE)
    ON CONFLICT (user_id) WHERE revoked = FALSE
    DO UPDATE SET
      api_key = EXCLUDED.api_key,
      expires_at = EXCLUDED.expires_at,
      created_at = NOW(),
      revoked = FALSE
    RETURNING api_keys.api_key::uuid AS api_key, api_keys.expires_at AS expires_at;
  END IF;
END;
$$ LANGUAGE plpgsql;

