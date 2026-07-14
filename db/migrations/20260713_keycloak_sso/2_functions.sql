CREATE OR REPLACE FUNCTION find_or_create_sso_user(
  u_keycloak_sub TEXT,
  u_email TEXT,
  u_name TEXT,
  u_last_name TEXT
)
RETURNS TABLE (
  uuid UUID,
  name TEXT,
  last_name TEXT,
  organization TEXT,
  email TEXT,
  email_verified BOOLEAN,
  is_admin BOOLEAN
) AS $$
DECLARE
  existing_by_sub RECORD;
  existing_by_email RECORD;
BEGIN
  SELECT * INTO existing_by_sub FROM users WHERE users.keycloak_sub = u_keycloak_sub;
  IF FOUND THEN
    RETURN QUERY
    SELECT existing_by_sub.uuid, existing_by_sub.name, existing_by_sub.last_name,
           existing_by_sub.organization, existing_by_sub.email,
           existing_by_sub.email_verified, existing_by_sub.is_admin;
    RETURN;
  END IF;

  SELECT * INTO existing_by_email FROM users WHERE users.email = u_email;
  IF FOUND THEN
    IF existing_by_email.keycloak_sub IS NOT NULL THEN
      RAISE EXCEPTION 'Email % is already linked to a different SSO account', u_email;
    END IF;

    UPDATE users SET
      keycloak_sub = u_keycloak_sub,
      email_verified = TRUE
    WHERE users.email = u_email;

    RETURN QUERY
    SELECT existing_by_email.uuid, existing_by_email.name, existing_by_email.last_name,
           existing_by_email.organization, existing_by_email.email,
           existing_by_email.email_verified, TRUE, existing_by_email.is_admin;
    RETURN;
  END IF;

  RETURN QUERY
  INSERT INTO users (name, last_name, organization, email, password_hash, email_verified, keycloak_sub)
  VALUES (u_name, u_last_name, NULL, u_email, NULL, TRUE, u_keycloak_sub)
  RETURNING users.uuid, users.name, users.last_name, users.organization,
            users.email, users.email_verified, users.is_admin;
END;
$$ LANGUAGE plpgsql;
