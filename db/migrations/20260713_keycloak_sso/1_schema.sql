ALTER TABLE users
  ALTER COLUMN password_hash DROP NOT NULL,
  ADD COLUMN keycloak_sub TEXT UNIQUE;

CREATE INDEX idx_users_keycloak_sub ON users(keycloak_sub);
