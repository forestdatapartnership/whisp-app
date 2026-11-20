-- Columns the library computes, so the sync skips them: the new timber indicators, and
-- risk_timber_pathway, which is temporary (removed in openforis-whisp 3.0.0a25) and kept out of the UI.
INSERT INTO result_fields ("order", id, type, unit, description, period, source, comments, power_bi_metadata, commodity_metadata, category, created_by)
VALUES
    (25910, 'Ind_12_other_land_2020', 'char', 'Yes / No', 'Indicator for other land', '2020', 'Generated internally', 'Derived from applying decision tree. See readme on github for details', '{"dashboard": true}'::jsonb, '{}'::jsonb, 'Analysis results', 'system'),
    (25920, 'Ind_13_other_land_gain_after_2020', 'char', 'Yes / No', 'Indicator for other land gain', '2020-present', 'Generated internally', 'Derived from applying decision tree. See readme on github for details', '{"dashboard": true}'::jsonb, '{}'::jsonb, 'Analysis results', 'system'),
    (25930, 'Ind_14_planted_forest_2020', 'char', 'Yes / No', 'Indicator for planted forest', '2020', 'Generated internally', 'Derived from applying decision tree. See readme on github for details', '{"dashboard": true}'::jsonb, '{}'::jsonb, 'Analysis results', 'system'),
    (25940, 'Ind_15_cropland_2020', 'char', 'Yes / No', 'Indicator for cropland', '2020', 'Generated internally', 'Derived from applying decision tree. See readme on github for details', '{"dashboard": true}'::jsonb, '{}'::jsonb, 'Analysis results', 'system'),
    (25950, 'Ind_16_plantation_forest_2020', 'char', 'Yes / No', 'Indicator for plantation forest', '2020', 'Generated internally', 'Derived from applying decision tree. See readme on github for details', '{"dashboard": true}'::jsonb, '{}'::jsonb, 'Analysis results', 'system'),
    (25960, 'Ind_17_plantation_forest_gain_after_2020', 'char', 'Yes / No', 'Indicator for plantation forest gain', '2020-present', 'Generated internally', 'Derived from applying decision tree. See readme on github for details', '{"dashboard": true}'::jsonb, '{}'::jsonb, 'Analysis results', 'system'),
    (26250, 'risk_timber_pathway', 'char', NULL, 'End point reached in the timber decision tree', NULL, 'Generated internally', 'Temporary, removed in openforis-whisp 3.0.0a25', '{}'::jsonb, '{}'::jsonb, 'Analysis results', 'system')
ON CONFLICT (id) DO NOTHING;

UPDATE result_fields SET display_metadata = display_metadata || '{"excludeFromResults": true}'::jsonb WHERE id = 'risk_timber_pathway';
