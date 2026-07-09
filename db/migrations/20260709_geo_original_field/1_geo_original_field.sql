INSERT INTO result_fields ("order", id, type, unit, description, period, source, comments, power_bi_metadata, commodity_metadata, category, created_by)
VALUES
    (26400, 'geo_original', 'char', NULL, 'Original input geometry (before Earth Engine processing), stored as GeoJSON', NULL, 'User defined', 'Only present when geometry audit trail option is enabled', '{}'::jsonb, '{}'::jsonb, 'Analysis results', 'system')
ON CONFLICT (id) DO NOTHING;

UPDATE result_fields SET display_metadata = display_metadata || '{"excludeFromResults": true}'::jsonb WHERE id = 'geo_original';
