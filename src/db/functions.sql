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
    IF EXISTS (SELECT 1 FROM users WHERE email = u_email) THEN
        RETURN 'Email already exists';
    END IF;

    -- Hash the password using bcrypt
    hashed_password := crypt(u_password, gen_salt('bf'));

    -- Insert the new user
    INSERT INTO users (name, last_name, organization, email, password_hash)
    VALUES (u_name, u_last_name, u_organization, u_email, hashed_password);

    RETURN 'User registered successfully';
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS login_user(TEXT, TEXT);

CREATE OR REPLACE FUNCTION login_user(u_email TEXT, u_password TEXT)
RETURNS TABLE(id INT, email TEXT)
AS $$
BEGIN
  RETURN QUERY
  SELECT users.id, users.email
  FROM users
  WHERE users.email = u_email
    AND users.password_hash = crypt(u_password, users.password_hash);
END;
$$ LANGUAGE plpgsql;

