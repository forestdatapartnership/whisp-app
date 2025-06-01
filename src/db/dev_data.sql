-- Ensure temp user exists
INSERT INTO users (id, name, last_name, email, password_hash, email_verified)
VALUES (-1000, 'Temp', 'User', 'temp@temp.com', crypt('strongPassword123', gen_salt('bf')), TRUE)
ON CONFLICT (id) DO NOTHING;