CREATE TABLE IF NOT EXISTS result_columns (
    id SERIAL PRIMARY KEY,
    column_name VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(50),
    unit VARCHAR(100),
    description TEXT,
    period VARCHAR(100),
    source VARCHAR(255),
    dashboard VARCHAR(10),
    crop_metadata JSONB DEFAULT '{}'::jsonb,
    comments TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255)
);

CREATE INDEX idx_result_columns_column_name ON result_columns(column_name);
CREATE INDEX idx_result_columns_updated_at ON result_columns(updated_at);
CREATE INDEX idx_result_columns_crop_metadata ON result_columns USING GIN (crop_metadata);

CREATE OR REPLACE FUNCTION update_result_columns_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_result_columns_timestamp
    BEFORE UPDATE ON result_columns
    FOR EACH ROW
    EXECUTE FUNCTION update_result_columns_timestamp();
