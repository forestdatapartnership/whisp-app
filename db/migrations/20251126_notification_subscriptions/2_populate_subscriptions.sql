INSERT INTO notification_subscriptions (email, subscribed, created_at, updated_at)
SELECT 
  email,
  TRUE,
  NOW(),
  NOW()
FROM users
WHERE email_verified = TRUE
ON CONFLICT (email) DO NOTHING;

