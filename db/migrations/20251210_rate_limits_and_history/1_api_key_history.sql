-- Preserve API key history by revoking instead of deleting/replacing rows

CREATE OR REPLACE FUNCTION create_or_replace_api_key(
  _user_id INT,
  _api_key TEXT,
  _expires_at TIMESTAMPTZ
)
RETURNS api_keys AS $$
WITH revoke_old AS (
  UPDATE api_keys
    SET revoked = TRUE,
        expires_at = LEAST(expires_at, now())
  WHERE user_id = _user_id
    AND revoked = FALSE
),
insert_new AS (
  INSERT INTO api_keys (user_id, api_key, expires_at, revoked)
  VALUES (_user_id, _api_key, _expires_at, FALSE)
  RETURNING *
)
SELECT * FROM insert_new;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION delete_api_key_by_user(_user_id INT)
RETURNS VOID AS $$
UPDATE api_keys
  SET revoked = TRUE,
      expires_at = LEAST(expires_at, now())
WHERE user_id = _user_id
  AND revoked = FALSE;
$$ LANGUAGE sql;

ALTER TABLE api_keys
  DROP CONSTRAINT IF EXISTS api_keys_user_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS api_keys_one_active_per_user
  ON api_keys(user_id)
  WHERE revoked = FALSE;

