DROP FUNCTION IF EXISTS get_user_profile(INT);

CREATE FUNCTION get_user_profile(_user_id INT)
RETURNS TABLE (
  id INT,
  name TEXT,
  last_name TEXT,
  organization TEXT,
  email TEXT,
  email_verified BOOLEAN,
  is_admin BOOLEAN
) AS $$
SELECT 
  id, 
  name, 
  last_name, 
  organization, 
  email, 
  email_verified,
  is_admin
FROM users
WHERE id = _user_id;
$$ LANGUAGE sql;
