CREATE OR REPLACE FUNCTION subscribe_notifications(_email TEXT)
RETURNS TEXT AS $$
BEGIN
  INSERT INTO notification_subscriptions (email, subscribed, updated_at)
  VALUES (_email, TRUE, NOW())
  ON CONFLICT (email) 
  DO UPDATE SET 
    subscribed = TRUE, 
    updated_at = NOW();
  
  RETURN 'Successfully subscribed to notifications';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION unsubscribe_notifications(_email TEXT)
RETURNS TEXT AS $$
BEGIN
  UPDATE notification_subscriptions
  SET subscribed = FALSE, updated_at = NOW()
  WHERE email = _email;
  
  IF NOT FOUND THEN
    RETURN 'Subscription not found';
  END IF;
  
  RETURN 'Successfully unsubscribed from notifications';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_subscribed_users()
RETURNS TABLE (
  email TEXT
) AS $$
SELECT 
  email
FROM notification_subscriptions
WHERE subscribed = TRUE;
$$ LANGUAGE sql;

