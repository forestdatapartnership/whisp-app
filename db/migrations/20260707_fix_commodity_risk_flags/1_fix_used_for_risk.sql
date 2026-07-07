UPDATE result_fields
SET commodity_metadata = jsonb_set(commodity_metadata, '{acrop,usedForRisk}', 'true'::jsonb),
    updated_by = 'migration'
WHERE id = 'Oil_palm_Descals';

UPDATE result_fields
SET commodity_metadata = jsonb_set(commodity_metadata, '{acrop,usedForRisk}', 'true'::jsonb),
    updated_by = 'migration'
WHERE id = 'Cocoa_ETH';

UPDATE result_fields
SET commodity_metadata = jsonb_set(commodity_metadata, '{acrop,usedForRisk}', 'true'::jsonb),
    updated_by = 'migration'
WHERE id = 'Rubber_RBGE';

UPDATE result_fields
SET commodity_metadata = jsonb_set(commodity_metadata, '{acrop,usedForRisk}', 'true'::jsonb),
    updated_by = 'migration'
WHERE id = 'nBR_INPE_TCamz_cer_perennial_2020';

UPDATE result_fields
SET commodity_metadata = jsonb_set(commodity_metadata, '{acrop,usedForRisk}', 'true'::jsonb),
    updated_by = 'migration'
WHERE id = 'nBR_MapBiomas_col9_coffee_2020';

UPDATE result_fields
SET commodity_metadata = jsonb_set(commodity_metadata, '{acrop,usedForRisk}', 'true'::jsonb),
    updated_by = 'migration'
WHERE id = 'nBR_MapBiomas_col9_palmoil_2020';

UPDATE result_fields
SET commodity_metadata = jsonb_set(commodity_metadata, '{acrop,usedForRisk}', 'true'::jsonb),
    updated_by = 'migration'
WHERE id = 'nBR_MapBiomas_col9_pc_2020';

UPDATE result_fields
SET commodity_metadata = jsonb_set(commodity_metadata, '{acrop,usedForRisk}', 'true'::jsonb),
    updated_by = 'migration'
WHERE id = 'nCI_Cocoa_bnetd';

UPDATE result_fields
SET commodity_metadata = jsonb_set(commodity_metadata, '{pcrop,usedForRisk}', 'true'::jsonb),
    updated_by = 'migration'
WHERE id = 'Soy_Song_2020';

UPDATE result_fields
SET commodity_metadata = jsonb_set(commodity_metadata, '{pcrop,usedForRisk}', 'true'::jsonb),
    updated_by = 'migration'
WHERE id = 'nBR_INPE_TCamz_cer_annual_2020';

UPDATE result_fields
SET commodity_metadata = jsonb_set(commodity_metadata, '{pcrop,usedForRisk}', 'true'::jsonb),
    updated_by = 'migration'
WHERE id = 'nBR_MapBiomas_col9_soy_2020';

UPDATE result_fields
SET commodity_metadata = jsonb_set(commodity_metadata, '{pcrop,usedForRisk}', 'true'::jsonb),
    updated_by = 'migration'
WHERE id = 'nBR_MapBiomas_col9_annual_crops_2020';
