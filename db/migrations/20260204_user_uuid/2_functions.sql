drop function if exists create_or_replace_api_key(int, text, timestamptz);
drop function if exists create_or_replace_api_key(uuid, text, timestamptz);

create or replace function create_or_replace_api_key(
  _user_uuid uuid,
  _api_key text,
  _expires_at timestamptz
)
returns table (
  api_key text,
  created_at timestamptz,
  expires_at timestamptz
) as $$
declare
  _user_id int;
begin
  select id into _user_id from users where uuid = _user_uuid;
  
  if _user_id is null then
    raise exception 'user not found';
  end if;

  update api_keys
  set revoked = true
  where user_id = _user_id
    and revoked = false;

  return query
  insert into api_keys (user_id, api_key, expires_at, revoked)
  values (_user_id, _api_key, _expires_at, false)
  returning api_keys.api_key, api_keys.created_at, api_keys.expires_at;
end;
$$ language plpgsql;

drop function if exists delete_api_key_by_user(int);
drop function if exists delete_api_key_by_user(uuid);

create or replace function delete_api_key_by_user(_user_uuid uuid)
returns void as $$
  update api_keys
  set revoked = true,
      expires_at = least(expires_at, now())
  where user_id = (select id from users where uuid = _user_uuid)
    and revoked = false;
$$ language sql;


drop function if exists verify_password(int, text);
drop function if exists verify_password(uuid, text);

create or replace function verify_password(
  _user_uuid uuid,
  _password text
)
returns boolean as $$
declare
  is_valid boolean;
begin
  select (password_hash = crypt(_password, password_hash)) into is_valid
  from users
  where uuid = _user_uuid;
  
  return coalesce(is_valid, false);
end;
$$ language plpgsql;

drop function if exists login_user(text, text);
create or replace function login_user(
  u_email text,
  u_password text
)
returns table (
  id int,
  uuid uuid,
  email text,
  email_verified boolean,
  is_admin boolean
) as $$
begin
  return query
  select 
    users.id,
    users.uuid,
    users.email,
    users.email_verified,
    users.is_admin
  from users
  where 
    users.email = u_email and
    users.password_hash = crypt(u_password, users.password_hash);
end;
$$ language plpgsql;