CREATE OR REPLACE FUNCTION register_user(
  u_name TEXT,
  u_last_name TEXT,
  u_organization TEXT,
  u_email TEXT,
  u_password TEXT
)
RETURNS TEXT AS $$
DECLARE
    hashed_password TEXT;
BEGIN
    -- Check if the email already exists
    IF EXISTS (SELECT 1 FROM users WHERE email = u_email) THEN
        RETURN 'Email already exists';
    END IF;

    -- Password Policy Enforcement
    IF LENGTH(u_password) < 8 OR
       NOT u_password ~ '[A-Z]' OR
       NOT u_password ~ '[a-z]' OR
       NOT u_password ~ '[0-9]' OR
       NOT u_password ~ '[!@#$%^&*(),.?":{}|<>]' THEN
       RETURN 'Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character.';
    END IF;

    -- Hash the password using bcrypt
    hashed_password := crypt(u_password, gen_salt('bf'));

    -- Insert the new user
    INSERT INTO users (name, last_name, organization, email, password_hash)
    VALUES (u_name, u_last_name, u_organization, u_email, hashed_password);

    RETURN 'User registered successfully';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION login_user(
  u_email TEXT,
  u_password TEXT
)
RETURNS TABLE (
  id INT,
  email TEXT,
  email_verified BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    users.id,
    users.email,
    users.email_verified
  FROM users
  WHERE 
    users.email = u_email AND
    users.password_hash = crypt(u_password, users.password_hash);
    
  -- If no rows are returned, the credentials were invalid
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Note: The email verification check is done in the route handler
  -- This function just returns the verification status
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION change_password(
    u_email TEXT,
    current_password TEXT,
    new_password TEXT
)
RETURNS TEXT AS $$
DECLARE
    user_record RECORD;
BEGIN
    SELECT * INTO user_record FROM users WHERE email = u_email;

    IF NOT FOUND THEN
        RETURN 'User not found';
    END IF;

    IF user_record.password_hash <> crypt(current_password, user_record.password_hash) THEN
        RETURN 'Incorrect current password';
    END IF;

    IF LENGTH(new_password) < 8 OR
       NOT new_password ~ '[A-Z]' OR
       NOT new_password ~ '[a-z]' OR
       NOT new_password ~ '[0-9]' OR
       NOT new_password ~ '[!@#$%^&*(),.?":{}|<>]' THEN
       RETURN 'Password does not meet policy';
    END IF;

    UPDATE users SET password_hash = crypt(new_password, gen_salt('bf'))
    WHERE email = u_email;

    RETURN 'Password changed successfully';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION change_password(
    u_email TEXT,
    current_password TEXT,
    new_password TEXT
)
RETURNS TEXT AS $$
DECLARE
    user_record RECORD;
BEGIN
    SELECT * INTO user_record FROM users WHERE email = u_email;

    IF NOT FOUND THEN
        RETURN 'User not found';
    END IF;

    IF user_record.password_hash <> crypt(current_password, user_record.password_hash) THEN
        RETURN 'Incorrect current password';
    END IF;

    IF LENGTH(new_password) < 8 OR
       NOT new_password ~ '[A-Z]' OR
       NOT new_password ~ '[a-z]' OR
       NOT new_password ~ '[0-9]' OR
       NOT new_password ~ '[!@#$%^&*(),.?":{}|<>]' THEN
       RETURN 'Password does not meet policy';
    END IF;

    UPDATE users SET password_hash = crypt(new_password, gen_salt('bf'))
    WHERE email = u_email;

    RETURN 'Password changed successfully';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION insert_email_verification_token(
  u_email TEXT,
  u_token TEXT,
  u_expires_at TIMESTAMPTZ
) RETURNS VOID AS $$
DECLARE
  uid INT;
BEGIN
  SELECT id INTO uid FROM users WHERE email = u_email;

  IF uid IS NULL THEN
    RAISE EXCEPTION 'User with email % does not exist', u_email;
  END IF;

  INSERT INTO email_verification_tokens (user_id, token, expires_at)
  VALUES (uid, u_token, u_expires_at);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION verify_email_by_token(u_token TEXT)
RETURNS TEXT AS $$
DECLARE
  target_user_id INT;
BEGIN
  SELECT user_id INTO target_user_id
  FROM email_verification_tokens
  WHERE token = u_token 
    AND expires_at > NOW()
    AND revoked = FALSE;

  IF target_user_id IS NULL THEN
    RETURN 'Invalid or expired token';
  END IF;

  UPDATE users SET email_verified = TRUE WHERE id = target_user_id;
  
  -- Mark the token as revoked instead of deleting it
  UPDATE email_verification_tokens SET revoked = TRUE WHERE token = u_token;

  RETURN 'Email verified successfully';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_or_replace_api_key(
  _user_id INT,
  _api_key_hash TEXT,
  _expires_at TIMESTAMPTZ
)
RETURNS api_keys AS $$
INSERT INTO api_keys (user_id, api_key_hash, expires_at)
VALUES (_user_id, _api_key_hash, _expires_at)
ON CONFLICT (user_id)
DO UPDATE SET 
  api_key_hash = EXCLUDED.api_key_hash, 
  expires_at = EXCLUDED.expires_at,
  created_at = NOW()
RETURNING *;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION find_api_key(p_hashed_key TEXT)
RETURNS BOOLEAN AS $$
SELECT EXISTS (
  SELECT 1
  FROM api_keys
  WHERE api_key_hash = p_hashed_key
    AND revoked = false
    AND expires_at > now()
);
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION delete_api_key_by_user(_user_id INT)
RETURNS VOID AS $$
DELETE FROM api_keys WHERE user_id = _user_id;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION get_api_key_metadata(_user_id INT)
RETURNS TABLE (
  id INT,
  user_id INT,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  revoked BOOLEAN
) AS $$
SELECT 
  id, 
  user_id,
  created_at, 
  expires_at, 
  revoked
FROM api_keys
WHERE user_id = _user_id;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION get_user_profile(_user_id INT)
RETURNS TABLE (
  id INT,
  name TEXT,
  last_name TEXT,
  organization TEXT,
  email TEXT,
  email_verified BOOLEAN
) AS $$
SELECT 
  id, 
  name, 
  last_name, 
  organization, 
  email, 
  email_verified
FROM users
WHERE id = _user_id;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION generate_temp_api_key()
RETURNS VOID AS $$
DECLARE
  new_uuid UUID := uuid_generate_v4();
  new_hashed TEXT;
BEGIN
  BEGIN
    -- Delete previous temp API keys
    DELETE FROM temp_api_keys WHERE user_id = -1000;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to delete previous temp API keys: %', SQLERRM;
  END;

  BEGIN
    -- Generate SHA-256 hash
    new_hashed := encode(digest(new_uuid::text, 'sha256'), 'hex');
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to generate hash: %', SQLERRM;
  END;

  BEGIN
    -- Update or Insert into api_keys (main table)
    INSERT INTO api_keys (user_id, api_key_hash, expires_at, revoked)
    VALUES (-1000, new_hashed, NOW() + INTERVAL '1 hour', FALSE)
    ON CONFLICT (user_id)
    DO UPDATE SET 
      api_key_hash = EXCLUDED.api_key_hash,
      expires_at = EXCLUDED.expires_at,
      created_at = NOW(),
      revoked = FALSE;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to upsert api_keys: %', SQLERRM;
  END;

  BEGIN
    -- Insert into temp_api_keys (raw key)
    INSERT INTO temp_api_keys (user_id, raw_api_key)
    VALUES (-1000, new_uuid);
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to insert into temp_api_keys: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_temp_api_key()
RETURNS UUID AS $$
DECLARE
  temp_key UUID;
BEGIN
  SELECT raw_api_key
  INTO temp_key
  FROM temp_api_keys
  WHERE user_id = -1000
  ORDER BY created_at DESC
  LIMIT 1;

  IF temp_key IS NULL THEN
    RAISE EXCEPTION 'No temp API key found for user -1000';
  END IF;

  RETURN temp_key;
END;
$$ LANGUAGE plpgsql;
