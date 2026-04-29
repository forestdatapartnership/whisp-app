drop function if exists login_user(text, text);

create or replace function login_user(
  u_email text,
  u_password text
)
returns table (
  uuid uuid,
  name text,
  last_name text,
  organization text,
  email text,
  email_verified boolean,
  is_admin boolean
) as $$
begin
  return query
  select
    users.uuid,
    users.name,
    users.last_name,
    users.organization,
    users.email,
    users.email_verified,
    users.is_admin
  from users
  where
    users.email = u_email and
    users.password_hash = crypt(u_password, users.password_hash);
end;
$$ language plpgsql;
