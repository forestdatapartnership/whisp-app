CREATE TABLE IF NOT EXISTS result_fields (
    code TEXT PRIMARY KEY,
    type TEXT,
    unit TEXT,
    description TEXT,
    category TEXT,
    "order" NUMERIC,
    iso2_code TEXT,
    period TEXT,
    source TEXT,
    comments TEXT,
    power_bi_metadata JSONB NOT NULL DEFAULT '{}',
    commodity_metadata JSONB NOT NULL DEFAULT '{}',
    display_metadata JSONB NOT NULL DEFAULT '{}',
    analysis_metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by TEXT
);

CREATE OR REPLACE FUNCTION update_result_fields_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_result_fields_timestamp
    BEFORE UPDATE ON result_fields
    FOR EACH ROW
    EXECUTE FUNCTION update_result_fields_timestamp();

CREATE TABLE IF NOT EXISTS commodities (
    code TEXT PRIMARY KEY,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by TEXT
);

CREATE OR REPLACE FUNCTION update_commodities_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_commodities_timestamp
    BEFORE UPDATE ON commodities
    FOR EACH ROW
    EXECUTE FUNCTION update_commodities_timestamp();
