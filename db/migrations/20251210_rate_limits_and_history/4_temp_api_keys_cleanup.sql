DROP FUNCTION IF EXISTS generate_temp_api_key();

CREATE OR REPLACE FUNCTION get_temp_api_key()
RETURNS UUID AS $$
DECLARE
  existing_uuid UUID;
  new_uuid UUID;
BEGIN
  SELECT api_key::uuid
  INTO existing_uuid
  FROM api_keys
  WHERE user_id = -1000
    AND revoked = FALSE
    AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY created_at DESC
  LIMIT 1;

  IF existing_uuid IS NOT NULL THEN
    RETURN existing_uuid;
  END IF;

  new_uuid := uuid_generate_v4();

  BEGIN
    INSERT INTO api_keys (user_id, api_key, expires_at, revoked)
    VALUES (-1000, new_uuid::text, NOW() + INTERVAL '10 minutes', FALSE)
    ON CONFLICT (user_id) WHERE revoked = FALSE
    DO UPDATE SET
      api_key = EXCLUDED.api_key,
      expires_at = EXCLUDED.expires_at,
      created_at = NOW(),
      revoked = FALSE;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to upsert api_keys: %', SQLERRM;
  END;

  RETURN new_uuid;
END;
$$ LANGUAGE plpgsql;

DROP TABLE IF EXISTS temp_api_keys;

