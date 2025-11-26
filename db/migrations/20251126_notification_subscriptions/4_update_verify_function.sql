DROP FUNCTION IF EXISTS verify_email_by_token(TEXT);

CREATE FUNCTION verify_email_by_token(u_token TEXT)
RETURNS TEXT AS $$
DECLARE
  target_user_id INT;
  user_email TEXT;
BEGIN
  SELECT user_id INTO target_user_id
  FROM email_verification_tokens
  WHERE token = u_token 
    AND expires_at > NOW()
    AND revoked = FALSE;

  IF target_user_id IS NULL THEN
    RETURN 'Invalid or expired token';
  END IF;

  SELECT email INTO user_email FROM users WHERE id = target_user_id;

  UPDATE users SET email_verified = TRUE WHERE id = target_user_id;
  
  UPDATE email_verification_tokens SET revoked = TRUE WHERE token = u_token;

  PERFORM subscribe_notifications(user_email);

  RETURN 'Email verified successfully';
END;
$$ LANGUAGE plpgsql;

