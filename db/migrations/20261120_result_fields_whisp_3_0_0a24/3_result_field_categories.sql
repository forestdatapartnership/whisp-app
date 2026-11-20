-- National layers get their own tab, and the yearly disturbance and fire layers, which layers_description.md
-- doesn't list, leave "Other". Runs after 1_sync_result_fields.sql, which files national layers under that
-- file's thematic headings.
UPDATE result_fields SET category = 'National layers', updated_by = 'migration'
WHERE id ~ '^n[A-Z]{2}_';

UPDATE result_fields SET category = 'Disturbances', updated_by = 'migration'
WHERE id ~ '^(TMF_def|TMF_deg|GFC_loss_year|RADD_year|GLAD-L_year|GLAD-S2_year)_[0-9]{4}$';

UPDATE result_fields SET category = 'Fire', updated_by = 'migration'
WHERE id ~ '^(ESA_fire|MODIS_fire)_[0-9]{4}$';
