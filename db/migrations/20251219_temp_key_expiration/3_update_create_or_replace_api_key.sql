DROP FUNCTION IF EXISTS create_or_replace_api_key(INT, TEXT, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION create_or_replace_api_key(
  _user_id INT,
  _api_key TEXT,
  _expires_at TIMESTAMPTZ
)
RETURNS TABLE (
  api_key TEXT,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
) AS $$
BEGIN
  UPDATE api_keys ak
  SET revoked = TRUE
  WHERE ak.user_id = _user_id
    AND ak.revoked = FALSE;

  RETURN QUERY
  INSERT INTO api_keys (user_id, api_key, expires_at, revoked)
  VALUES (_user_id, _api_key, _expires_at, FALSE)
  RETURNING api_keys.api_key AS api_key,
            api_keys.created_at AS created_at,
            api_keys.expires_at AS expires_at;
END;
$$ LANGUAGE plpgsql;

