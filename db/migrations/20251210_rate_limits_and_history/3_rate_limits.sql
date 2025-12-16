CREATE TABLE IF NOT EXISTS rate_limits_global (
  id INT PRIMARY KEY DEFAULT 1,
  rate_limit_window_ms INTEGER,
  rate_limit_max_requests INTEGER,
  max_concurrent_analyses INTEGER
);

INSERT INTO rate_limits_global (id, rate_limit_window_ms, rate_limit_max_requests, max_concurrent_analyses)
VALUES (1, 60000, 30, 2)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS user_rate_limits (
  user_id INT PRIMARY KEY,
  rate_limit_window_ms INTEGER,
  rate_limit_max_requests INTEGER,
  max_concurrent_analyses INTEGER
);

INSERT INTO user_rate_limits (user_id, rate_limit_window_ms, rate_limit_max_requests, max_concurrent_analyses)
VALUES (-1000, 6000, 1000, 1000)
ON CONFLICT (user_id) DO NOTHING;

UPDATE users
SET name = 'System',
    last_name = 'User',
    organization = 'FAO',
    email = 'Open-Foris@fao.org'
WHERE id = -1000;

DROP FUNCTION IF EXISTS find_api_key(TEXT);

CREATE OR REPLACE FUNCTION find_api_key(p_api_key TEXT)
RETURNS TABLE (
  id INT,
  user_id INT,
  user_email TEXT,
  rate_limit_window_ms INT,
  rate_limit_max_requests INT,
  max_concurrent_analyses INT
) AS $$
SELECT 
  ak.id,
  ak.user_id,
  u.email AS user_email,
  COALESCE(ur.rate_limit_window_ms, rg.rate_limit_window_ms) AS rate_limit_window_ms,
  COALESCE(ur.rate_limit_max_requests, rg.rate_limit_max_requests) AS rate_limit_max_requests,
  COALESCE(ur.max_concurrent_analyses, rg.max_concurrent_analyses) AS max_concurrent_analyses
FROM api_keys ak
INNER JOIN users u ON u.id = ak.user_id
LEFT JOIN user_rate_limits ur ON ur.user_id = ak.user_id
LEFT JOIN rate_limits_global rg ON rg.id = 1
WHERE ak.api_key = p_api_key
  AND ak.revoked = false
  AND ak.expires_at > now();
$$ LANGUAGE sql;

