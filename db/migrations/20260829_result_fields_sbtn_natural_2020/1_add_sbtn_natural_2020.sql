-- SBTN Natural Lands 2020, a new "Natural lands" category.
-- theme and theme_timber are NA in the lookup CSV, so no dataTheme key is set for any
-- commodity; the field is output only and stays out of every risk metric.
INSERT INTO result_fields (
    "order", id, type, unit, description, period, source, comments, category,
    power_bi_metadata, commodity_metadata, analysis_metadata, created_by
)
VALUES
    (67, 'SBTN_natural_2020', 'numeric', 'ha / %', 'Area of Natural Lands', '2020',
     'Mazur, E., Sims, M., Goldman, E., Schneider, M., Pirri, M. D., Beatty, C. R., Stolle, F., & Stevenson, M. (2025). SBTN Natural Lands Map v1.1: Technical Documentation. Science Based Targets Network. https://sciencebasedtargetsnetwork.org/wp-content/uploads/2025/02/Technical-Guidance-2025-Step3-Land-v1_1-Natural-Lands-Map.pdf',
     'Binary "natural" band, where 1 is natural land (natural forests, mangroves, short vegetation, water, bare and snow, including their wet and peat variants) and 0 is non-natural. Emitted as an output column only; it feeds no Whisp indicator or risk column.',
     'Natural lands', '{}'::jsonb,
     '{"pcrop": {"usedForRisk": false}, "acrop": {"usedForRisk": false}, "timber": {"usedForRisk": false}}'::jsonb,
     '{"type":"float32","excludeFromOutput":false,"isNullable":true,"isRequired":false,"correspondingVariable":"g_sbtn_natural_2020_prep","geeAssets":["ee.Image(\"WRI/SBTN/naturalLands/v1_1/2020\")"]}'::jsonb,
     'migration')
ON CONFLICT (id) DO NOTHING;
