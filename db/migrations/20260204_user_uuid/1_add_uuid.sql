ALTER TABLE users ADD COLUMN uuid UUID;

UPDATE users SET uuid = uuid_generate_v4() WHERE uuid IS NULL;

ALTER TABLE users 
  ALTER COLUMN uuid SET NOT NULL,
  ALTER COLUMN uuid SET DEFAULT uuid_generate_v4(),
  ADD CONSTRAINT users_uuid_unique UNIQUE (uuid);

CREATE INDEX idx_users_uuid ON users(uuid);

CREATE OR REPLACE FUNCTION prevent_uuid_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.uuid IS DISTINCT FROM NEW.uuid THEN
    RAISE EXCEPTION 'Cannot update uuid column';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_uuid_update
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION prevent_uuid_update();