INSERT INTO result_fields ("order", id, type, unit, description, period, source, comments, power_bi_metadata, commodity_metadata, analysis_metadata, created_by)
VALUES
    (5050, 'TMF_def_2025', 'numeric', 'ha / %', 'Area of Deforestation', '2025', 'Vancutsem 2021', NULL, '{}'::jsonb, '{"pcrop":{"usedForRisk":false},"acrop":{"usedForRisk":false},"timber":{"usedForRisk":false}}'::jsonb, '{"type":"float32","excludeFromOutput":false,"isNullable":true,"isRequired":false,"correspondingVariable":"g_tmf_def_per_year_prep"}'::jsonb, 'migration'),
    (7550, 'TMF_deg_2025', 'numeric', 'ha / %', 'Area of Degradation', '2025', 'Vancutsem 2021', NULL, '{}'::jsonb, '{"pcrop":{"usedForRisk":false},"acrop":{"usedForRisk":false},"timber":{"usedForRisk":false}}'::jsonb, '{"type":"float32","excludeFromOutput":false,"isNullable":true,"isRequired":false,"correspondingVariable":"g_tmf_deg_per_year_prep"}'::jsonb, 'migration'),
    (9950, 'GFC_loss_year_2025', 'numeric', 'ha / %', 'Area of Tree cover loss', '2025', 'Hansen 2013', NULL, '{}'::jsonb, '{"pcrop":{"usedForRisk":false},"acrop":{"usedForRisk":false},"timber":{"usedForRisk":false}}'::jsonb, '{"type":"float32","excludeFromOutput":false,"isNullable":true,"isRequired":false,"correspondingVariable":"g_glad_gfc_loss_per_year_prep"}'::jsonb, 'migration'),
    (17650, 'MODIS_fire_2026', 'numeric', 'ha / %', 'Area of Fire event', '2026', 'Giglio 2021', NULL, '{}'::jsonb, '{"pcrop":{"usedForRisk":false},"acrop":{"usedForRisk":false},"timber":{"usedForRisk":false}}'::jsonb, '{"type":"float32","excludeFromOutput":false,"isNullable":true,"isRequired":false,"correspondingVariable":"g_modis_fire_prep"}'::jsonb, 'migration')
ON CONFLICT (id) DO NOTHING;

UPDATE result_fields SET
    id = 'TMF_regrowth_2024',
    period = '2024',
    analysis_metadata = jsonb_set(COALESCE(analysis_metadata, '{}'::jsonb), '{correspondingVariable}', '"g_tmf_regrowth_prep"'::jsonb),
    updated_by = 'migration'
WHERE id = 'TMF_regrowth_2023';

UPDATE result_fields SET
    id = 'ESRI_2024_TC',
    period = '2024',
    analysis_metadata = '{"type":"float32","excludeFromOutput":false,"isNullable":true,"isRequired":false,"correspondingVariable":"g_esri_2024_tc_prep"}'::jsonb,
    updated_by = 'migration'
WHERE id = 'ESRI_2023_TC';

UPDATE result_fields SET
    id = 'ESRI_crop_gain_2020_2024',
    period = '2020 and 2024',
    description = 'Area of Crop',
    analysis_metadata = '{"type":"float32","excludeFromOutput":false,"isNullable":true,"isRequired":false,"correspondingVariable":"g_esri_2020_2024_crop_prep"}'::jsonb,
    updated_by = 'migration'
WHERE id = 'ESRI_crop_gain_2020_2023';

UPDATE result_fields SET
    id = 'Oil_palm_2024_FDaP',
    period = '2024',
    analysis_metadata = '{"type":"float32","excludeFromOutput":false,"isNullable":true,"isRequired":false,"correspondingVariable":"g_fdap_palm_2024_prep"}'::jsonb,
    updated_by = 'migration'
WHERE id = 'Oil_palm_2023_FDaP';

UPDATE result_fields SET
    id = 'Rubber_2024_FDaP',
    period = '2024',
    analysis_metadata = '{"type":"float32","excludeFromOutput":false,"isNullable":true,"isRequired":false,"correspondingVariable":"g_fdap_rubber_2024_prep"}'::jsonb,
    updated_by = 'migration'
WHERE id = 'Rubber_2023_FDaP';

UPDATE result_fields SET
    id = 'Coffee_FDaP_2024',
    period = '2024',
    analysis_metadata = '{"type":"float32","excludeFromOutput":false,"isNullable":true,"isRequired":false,"correspondingVariable":"g_fdap_coffee_2024_prep"}'::jsonb,
    updated_by = 'migration'
WHERE id = 'Coffee_FDaP_2023';

UPDATE result_fields SET
    id = 'Cocoa_2024_FDaP',
    period = '2024',
    analysis_metadata = '{"type":"float32","excludeFromOutput":false,"isNullable":true,"isRequired":false,"correspondingVariable":"g_fdap_cocoa_2024_prep"}'::jsonb,
    updated_by = 'migration'
WHERE id = 'Cocoa_2023_FDaP';

UPDATE result_fields SET
    analysis_metadata = jsonb_set(COALESCE(analysis_metadata, '{}'::jsonb), '{correspondingVariable}', '"g_fdap_coffee_2020_prep"'::jsonb),
    updated_by = 'migration'
WHERE id = 'Coffee_FDaP';

UPDATE result_fields SET
    analysis_metadata = jsonb_set(COALESCE(analysis_metadata, '{}'::jsonb), '{correspondingVariable}', '"g_logging_concessions_before_2020_prep"'::jsonb),
    updated_by = 'migration'
WHERE id = 'GFW_logging_before_2020';

UPDATE result_fields SET
    analysis_metadata = jsonb_set(COALESCE(analysis_metadata, '{}'::jsonb), '{excludeFromOutput}', 'true'::jsonb),
    updated_by = 'migration'
WHERE id IN ('DIST_year_2024', 'DIST_year_2025', 'DIST_year_2026', 'DIST_after_2020');

UPDATE result_fields SET
    commodity_metadata = '{"pcrop":{"usedForRisk":true,"dataTheme":"disturbance_before"},"acrop":{"usedForRisk":true,"dataTheme":"disturbance_before"},"timber":{"usedForRisk":true}}'::jsonb,
    updated_by = 'migration'
WHERE id = 'GLAD-L_before_2020';

WITH layer_data (id, category, comments, source, gee_assets) AS (
  VALUES
    ('TMF_regrowth_2024', 'Tree cover post 2020', 'Binary map of Regrowth class (4) for the TMF Annual change year 2024', 'Vancutsem, C., Achard, F., Pekel, J.-F., Vieilledent, G., Carboni, S., Simonetti, D., Gallego, J., Aragão, L. E. O. C., & Nasi, R. (2021). Long-term (1990–2019) monitoring of forest cover changes in the humid tropics. Science Advances, 7(10). https://doi.org/10.1126/sciadv.abe1603', '["ee.ImageCollection(\"projects/JRC/TMF/v1_2024/AnnualChanges\")"]'::jsonb),
    ('ESRI_2024_TC', 'Tree cover post 2020', 'Tree cover class (2) of the 2024 ESRI LC map', 'Karra, Kontgis, et al. "Global land use/land cover with Sentinel-2 and deep learning."IGARSS 2021-2021 IEEE International Geoscience and Remote Sensing Symposium. IEEE, 2021.', '["ee.ImageCollection(\"projects/sat-io/open-datasets/landcover/ESRI_Global-LULC_10m_TS\")"]'::jsonb),
    ('ESRI_crop_gain_2020_2024', 'Agricultural land post 2020', 'Crop gain in 2024 compared to year 2020 of the ESRI LC map (class 5)', 'Karra, Kontgis, et al. "Global land use/land cover with Sentinel-2 and deep learning."IGARSS 2021-2021 IEEE International Geoscience and Remote Sensing Symposium. IEEE, 2021.', '["ee.ImageCollection(\"projects/sat-io/open-datasets/landcover/ESRI_Global-LULC_10m_TS\")"]'::jsonb),
    ('Oil_palm_2024_FDaP', 'Agricultural land post 2020', 'Palm probability model. Filtered collection to 2024 data. Threshold set for Whisp based on the intersection of recall and precision in charts for accuracy.', 'FDaP (2025). Forest Data Partnership https://developers.google.com/earth-engine/datasets/publisher/forestdatapartnership', '["ee.ImageCollection(\"projects/forestdatapartnership/assets/palm/model_2025a\")"]'::jsonb),
    ('Rubber_2024_FDaP', 'Agricultural land post 2020', 'Rubber probability model. Filtered collection to 2024 data. Threshold set for Whisp based on the intersection of recall and precision in charts for accuracy.', 'FDaP (2025). Forest Data Partnership https://developers.google.com/earth-engine/datasets/publisher/forestdatapartnership', '["ee.ImageCollection(\"projects/forestdatapartnership/assets/rubber/model_2025a\")"]'::jsonb),
    ('Coffee_FDaP_2024', 'Agricultural land post 2020', 'Coffee probability model. Filtered collection to 2024 data. Threshold set for Whisp based on the intersection of recall and precision in charts for accuracy.', 'FDaP (2025). Forest Data Partnership https://developers.google.com/earth-engine/datasets/publisher/forestdatapartnership', '["ee.ImageCollection(\"projects/forestdatapartnership/assets/coffee/model_2025a\")"]'::jsonb),
    ('Cocoa_2024_FDaP', 'Agricultural land post 2020', 'Cocoa probability model. Filtered collection to 2024 data. Threshold set for Whisp based on the intersection of recall and precision in charts for accuracy.', 'FDaP (2025). Forest Data Partnership https://developers.google.com/earth-engine/datasets/publisher/forestdatapartnership', '["ee.ImageCollection(\"projects/forestdatapartnership/assets/cocoa/model_2025a\")"]'::jsonb)
)
UPDATE result_fields rf
SET
    category = ld.category,
    comments = ld.comments,
    source = ld.source,
    analysis_metadata = jsonb_set(COALESCE(rf.analysis_metadata, '{}'::jsonb), '{geeAssets}', ld.gee_assets),
    updated_by = 'migration'
FROM layer_data ld
WHERE rf.id = ld.id;
