-- Ensure temp user exists
INSERT INTO users (id, name, last_name, email, password_hash, email_verified)
SELECT -1000, 'Temp', 'User', 'temp@temp.com', crypt('strongPassword123', gen_salt('bf')), TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'temp@temp.com'
);