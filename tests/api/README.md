# Result export checks

These tests use temporary result files and a mocked result-field catalog. They do not
connect to PostgreSQL, Redis or Earth Engine, and do not submit an analysis.

Install the API dependencies with `uv sync` from `api/`, and the frontend dependencies
with `npm ci` from `app/`. With Node.js on `PATH`, run from `api/`:

```bash
uv run python -m unittest discover -s ../tests/api -v
```

The parity test invokes the actual TypeScript browser report builder and compares its
output with the Python builder in all four supported languages, across all 8,192
boolean indicator combinations and additional mixed-value cases. It is skipped if
Node.js or TypeScript is unavailable; check for skips before reporting full coverage.

The engine snapshot test reads the installed `openforis-whisp` distribution's display
tree inputs without importing its package or initializing Earth Engine. It verifies
the pinned version, indicator columns and risk outcomes for all boolean combinations.
This test is skipped if the library distribution is missing. Neither parity check
asserts that report questions or translations match the library's labels verbatim.

The route tests exercise the export router in a FastAPI test app, including aliases,
filters, response headers, missing files, corrupt results and OpenAPI deprecation.
They do not exercise the full application lifecycle or the deployed reverse proxy.
They also check CORS with the example development origins and the HTML security headers.

Run the browser export helper's seven functional tests from the repository root:

```bash
node tests/ui/report-export.test.cjs
```

They cover API URL construction, filenames, response errors, expiry, header/body
timeouts and local generation with locale/CSP. They use mocked browser downloads
and fetch; [the Chromium check](../browser/README.md) exercises the real boundary.
These suites are manual; they have not been added to CI.

To test the packaged report assets, build the API wheel within the full checkout with
`python -m build --wheel` from `api/`, install it into an isolated environment, and
render a report from outside the checkout. The wheel must contain the HTML shell,
decision trees and all four translation files.
