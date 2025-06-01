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
    existing_user RECORD;
    validation_error TEXT;
BEGIN
    SELECT * INTO existing_user FROM users WHERE email = u_email;

    IF FOUND THEN
        IF NOT existing_user.email_verified THEN
            validation_error := validate_password(u_password);
            IF validation_error IS NOT NULL THEN
                RETURN validation_error;
            END IF;

            hashed_password := crypt(u_password, gen_salt('bf'));

            UPDATE users SET 
                name = u_name,
                last_name = u_last_name,
                organization = u_organization,
                password_hash = hashed_password
            WHERE email = u_email;

            DELETE FROM email_verification_tokens WHERE user_id = existing_user.id;

            RETURN 'User registered successfully';
        ELSE
            RETURN 'Email already exists';
        END IF;
    END IF;

    validation_error := validate_password(u_password);
    IF validation_error IS NOT NULL THEN
        RETURN validation_error;
    END IF;

    hashed_password := crypt(u_password, gen_salt('bf'));

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
    validation_error TEXT;
BEGIN
    SELECT * INTO user_record FROM users WHERE email = u_email;

    IF NOT FOUND THEN
        RETURN 'User not found';
    END IF;

    IF user_record.password_hash <> crypt(current_password, user_record.password_hash) THEN
        RETURN 'Incorrect current password';
    END IF;

    validation_error := validate_password(new_password);
    IF validation_error IS NOT NULL THEN
        RETURN validation_error;
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
    validation_error TEXT;
BEGIN
    SELECT * INTO user_record FROM users WHERE email = u_email;

    IF NOT FOUND THEN
        RETURN 'User not found';
    END IF;

    IF user_record.password_hash <> crypt(current_password, user_record.password_hash) THEN
        RETURN 'Incorrect current password';
    END IF;

    validation_error := validate_password(new_password);
    IF validation_error IS NOT NULL THEN
        RETURN validation_error;
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

CREATE OR REPLACE FUNCTION create_password_reset_token(
  u_email TEXT,
  u_token TEXT,
  u_expires_at TIMESTAMPTZ
)
RETURNS TEXT AS $$
DECLARE
  uid INT;
BEGIN
  -- Check if user exists and get their ID
  SELECT id INTO uid FROM users WHERE email = u_email;

  IF uid IS NULL THEN
    -- Don't reveal if email exists or not for security reasons
    RETURN 'If your email is registered, you will receive a password reset link.';
  END IF;

  -- Revoke any existing password reset tokens for this user
  UPDATE password_reset_tokens 
  SET revoked = TRUE 
  WHERE user_id = uid AND revoked = FALSE;

  -- Insert new password reset token
  INSERT INTO password_reset_tokens (user_id, token, expires_at)
  VALUES (uid, u_token, u_expires_at);

  RETURN 'Password reset token created successfully';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION reset_password_with_token(
  u_token TEXT,
  u_new_password TEXT
)
RETURNS TEXT AS $$
DECLARE
  resolved_user_id INT;
  validation_error TEXT;
BEGIN
  SELECT user_id INTO resolved_user_id
  FROM password_reset_tokens
  WHERE token = u_token AND revoked = FALSE AND expires_at > NOW();

  IF resolved_user_id IS NULL THEN
    RETURN 'Invalid or expired token';
  END IF;

  validation_error := validate_password(u_new_password);
  IF validation_error IS NOT NULL THEN
    RETURN validation_error;
  END IF;

  UPDATE users
  SET password_hash = crypt(u_new_password, gen_salt('bf'))
  WHERE id = resolved_user_id;

  UPDATE password_reset_tokens
  SET revoked = TRUE
  WHERE token = u_token;

  RETURN 'Password reset successful';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_or_replace_api_key(
  _user_id INT,
  _api_key TEXT,
  _expires_at TIMESTAMPTZ
)
RETURNS api_keys AS $$
INSERT INTO api_keys (user_id, api_key, expires_at)
VALUES (_user_id, _api_key, _expires_at)
ON CONFLICT (user_id)
DO UPDATE SET 
  api_key = EXCLUDED.api_key,
  expires_at = EXCLUDED.expires_at,
  created_at = NOW()
RETURNING *;
$$ LANGUAGE sql;


CREATE OR REPLACE FUNCTION find_api_key(p_api_key TEXT)
RETURNS TABLE (
  user_id INT
) AS $$
SELECT user_id
FROM api_keys
WHERE api_key = p_api_key
  AND revoked = false
  AND expires_at > now();
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
BEGIN
  BEGIN
    -- Delete previous temp API keys
    DELETE FROM temp_api_keys WHERE user_id = -1000;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to delete previous temp API keys: %', SQLERRM;
  END;

  BEGIN
    -- Update or Insert into api_keys (main table) - store the actual key
    INSERT INTO api_keys (user_id, api_key, expires_at, revoked)
    VALUES (-1000, new_uuid::text, NOW() + INTERVAL '1 hour', FALSE)
    ON CONFLICT (user_id)
    DO UPDATE SET 
      api_key = EXCLUDED.api_key,
      expires_at = EXCLUDED.expires_at,
      created_at = NOW(),
      revoked = FALSE;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to upsert api_keys: %', SQLERRM;
  END;

  BEGIN
    -- Insert into temp_api_keys (keeping this for backward compatibility)
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
    RAISE EXCEPTION 'No temp API key found.';
  END IF;

  RETURN temp_key;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_api_key_by_user_id(_user_id INT)
RETURNS TEXT AS $$
DECLARE
  key_value TEXT;
BEGIN
  SELECT api_key INTO key_value
  FROM api_keys
  WHERE user_id = _user_id
    AND revoked = false
    AND (expires_at IS NULL OR expires_at > NOW());
  
  RETURN key_value; -- Will return NULL if no valid key is found
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION verify_password(
  _user_id INT,
  _password TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  is_valid BOOLEAN;
BEGIN
  SELECT (password_hash = crypt(_password, password_hash)) INTO is_valid
  FROM users
  WHERE id = _user_id;
  
  RETURN COALESCE(is_valid, FALSE);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_password(p_password TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Password Policy Enforcement
    IF LENGTH(p_password) < 8 THEN
        RETURN 'Password must be at least 8 characters long';
    END IF;
    
    IF NOT p_password ~ '[A-Z]' THEN
        RETURN 'Password must contain at least one uppercase letter';
    END IF;
    
    IF NOT p_password ~ '[a-z]' THEN
        RETURN 'Password must contain at least one lowercase letter';
    END IF;
    
    IF NOT p_password ~ '[0-9]' THEN
        RETURN 'Password must contain at least one number';
    END IF;
    
    IF NOT p_password ~ '[!@#$%^&*(),.?":{}|<>]' THEN
        RETURN 'Password must contain at least one special character';
    END IF;
    
    -- If all validations pass
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
