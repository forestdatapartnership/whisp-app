# Shared offline report assets

`shell.json` contains the self-contained HTML, CSS and JavaScript used by both exporters.
`policy.json` supplies the CSP for the downloaded file and the API response.

`risk-trees.json` is a display snapshot, checked against **openforis-whisp 3.0.0a25**.
It preserves the existing UI's sequence-of-rules representation, rather than the
question/yes/no representation returned by the library's `decision_tree_recipe()`.
The snapshot describes the displayed risk path; it does not calculate the analysis
results or replace the analysis library.

The engine compatibility test reads the pinned distribution's tree definitions and
column mappings, which feed `decision_tree_recipe()`, without initializing Earth Engine.
It checks indicator columns and final risk outcomes for every yes/no combination.
It does not assert identical question grouping, translations, thresholds or dataset metadata.
For example, the library's repeated "Still other land?" question is compressed in the UI.

When upgrading the library, run `tests/api/test_engine_snapshot.py` and review the
display rules, labels and question grouping together. A green app/API parity test
alone only proves that the two exporters agree with each other.
