-- Align result_fields with openforis-whisp 3.0.0a16
-- https://github.com/forestdatapartnership/whisp/blob/v3.0.0a16/src/openforis_whisp/parameters/lookup_datasets.csv
--
-- ForTy (Nature Trace + IIASA) forest typology 2020, argmax single-label classes.
INSERT INTO result_fields (
    "order", id, type, unit, description, period, source, comments, category,
    power_bi_metadata, commodity_metadata, analysis_metadata, created_by
)
VALUES
    (65, 'ForTy_forest_2020', 'numeric', 'ha / %', 'Area of Forest', '2020', 'Neumann 2026',
     'Forest presence: argmax class is one of the four forest classes (Primary, Naturally Regenerating, Planted, Plantation). Output only, not used in risk metrics.',
     'Tree cover datasets', '{}'::jsonb,
     '{"pcrop": {"dataTheme": "treecover", "usedForRisk": false}, "acrop": {"dataTheme": "treecover", "usedForRisk": false}, "timber": {"usedForRisk": false}}'::jsonb,
     '{"type":"float32","excludeFromOutput":false,"isNullable":true,"isRequired":false,"correspondingVariable":"g_forty_forest_2020_prep","geeAssets":["ee.ImageCollection(\"projects/nature-trace/assets/forest_typology/forest_typology_2020_v1_0_collection\")"]}'::jsonb,
     'migration'),
    (145, 'ForTy_tree_crops_2020', 'numeric', 'ha / %', 'Area of Tree Crops and Agroforestry', '2020', 'Neumann 2026',
     'ForTy Tree Crops / Agroforestry class (argmax over the six ForTy classes). Output only, not used in risk metrics.',
     'Commodity datasets', '{}'::jsonb,
     '{"pcrop": {"dataTheme": "commodities", "usedForRisk": false}, "acrop": {"dataTheme": "commodities", "usedForRisk": false}, "timber": {"usedForRisk": false}}'::jsonb,
     '{"type":"float32","excludeFromOutput":false,"isNullable":true,"isRequired":false,"correspondingVariable":"g_forty_tree_crops_2020_prep","geeAssets":["ee.ImageCollection(\"projects/nature-trace/assets/forest_typology/forest_typology_2020_v1_0_collection\")"]}'::jsonb,
     'migration'),
    (1825, 'ForTy_primary_2020', 'numeric', 'ha / %', 'Area of Primary Forest', '2020', 'Neumann 2026',
     'ForTy Primary Forest class (argmax over the six ForTy classes). Output only, not used in risk metrics.',
     'Primary forests', '{}'::jsonb,
     '{"pcrop": {"usedForRisk": false}, "acrop": {"usedForRisk": false}, "timber": {"dataTheme": "primary", "usedForRisk": false}}'::jsonb,
     '{"type":"float32","excludeFromOutput":false,"isNullable":true,"isRequired":false,"correspondingVariable":"g_forty_primary_2020_prep","geeAssets":["ee.ImageCollection(\"projects/nature-trace/assets/forest_typology/forest_typology_2020_v1_0_collection\")"]}'::jsonb,
     'migration'),
    (1835, 'ForTy_nat_reg_2020', 'numeric', 'ha / %', 'Area of Naturally Regenerating Forest', '2020', 'Neumann 2026',
     'ForTy Naturally Regenerating Forest class (argmax over the six ForTy classes). Output only, not used in risk metrics.',
     'Naturally regenerating forests', '{}'::jsonb,
     '{"pcrop": {"usedForRisk": false}, "acrop": {"usedForRisk": false}, "timber": {"dataTheme": "naturally_reg_2020", "usedForRisk": false}}'::jsonb,
     '{"type":"float32","excludeFromOutput":false,"isNullable":true,"isRequired":false,"correspondingVariable":"g_forty_nat_reg_2020_prep","geeAssets":["ee.ImageCollection(\"projects/nature-trace/assets/forest_typology/forest_typology_2020_v1_0_collection\")"]}'::jsonb,
     'migration'),
    (1852, 'ForTy_planted_2020', 'numeric', 'ha / %', 'Area of Planted Forest', '2020', 'Neumann 2026',
     'ForTy Planted Forest class (argmax over the six ForTy classes). Weakest ForTy class (F1 58.2%), so the planted-vs-plantation split is uncertain. Output only, not used in risk metrics.',
     'Planted/plantation forests', '{}'::jsonb,
     '{"pcrop": {"usedForRisk": false}, "acrop": {"usedForRisk": false}, "timber": {"dataTheme": "planted_plantation_2020", "usedForRisk": false}}'::jsonb,
     '{"type":"float32","excludeFromOutput":false,"isNullable":true,"isRequired":false,"correspondingVariable":"g_forty_planted_2020_prep","geeAssets":["ee.ImageCollection(\"projects/nature-trace/assets/forest_typology/forest_typology_2020_v1_0_collection\")"]}'::jsonb,
     'migration'),
    (1854, 'ForTy_plantation_2020', 'numeric', 'ha / %', 'Area of Plantation Forest', '2020', 'Neumann 2026',
     'ForTy Plantation Forest class (argmax over the six ForTy classes). Output only, not used in risk metrics.',
     'Planted/plantation forests', '{}'::jsonb,
     '{"pcrop": {"usedForRisk": false}, "acrop": {"usedForRisk": false}, "timber": {"dataTheme": "planted_plantation_2020", "usedForRisk": false}}'::jsonb,
     '{"type":"float32","excludeFromOutput":false,"isNullable":true,"isRequired":false,"correspondingVariable":"g_forty_plantation_2020_prep","geeAssets":["ee.ImageCollection(\"projects/nature-trace/assets/forest_typology/forest_typology_2020_v1_0_collection\")"]}'::jsonb,
     'migration')
ON CONFLICT (id) DO NOTHING;

-- GLAD-L_year_2024: missing year in an otherwise contiguous 2017-2026 series.
-- Descriptive fields are copied from the sibling year so the series stays consistent.
INSERT INTO result_fields (
    "order", id, type, unit, description, period, source, comments, category,
    power_bi_metadata, commodity_metadata, analysis_metadata, created_by
)
SELECT
    1095, 'GLAD-L_year_2024', type, unit, description, '2024', source, NULL, category,
    power_bi_metadata,
    '{"pcrop": {"dataTheme": "disturbance_after", "usedForRisk": false}, "acrop": {"dataTheme": "disturbance_after", "usedForRisk": false}, "timber": {"usedForRisk": false}}'::jsonb,
    jsonb_strip_nulls(
        COALESCE(analysis_metadata, '{}'::jsonb)
        || '{"type":"float32","excludeFromOutput":false,"isNullable":true,"isRequired":false,"correspondingVariable":"g_glad_l_year_prep"}'::jsonb
    ),
    'migration'
FROM result_fields
WHERE id = 'GLAD-L_year_2023'
ON CONFLICT (id) DO NOTHING;
