# Report download browser check

Install the API dependencies and `playwright` in an isolated Python environment,
plus Chromium (`playwright install chromium` or a system Chromium). Install the app
dependencies with `npm ci` and put Node.js on `PATH`. From the repository root:

```bash
python tests/browser/test_report_download.py -v
```

`CHROMIUM_EXECUTABLE` can select a browser executable. Ports 3001 and 8001 must be free.
The test starts its own local fixture servers on those ports and stops them afterward.
It does not connect to PostgreSQL, Redis, Earth Engine or an existing Whisp instance.

The HTML harness bundles the actual `exportHtmlReport` helper and the local report
generator, then calls the real FastAPI export router with a mocked result-field catalog.
Chromium downloads the report across origins using the CORS example configuration.
The test checks server filenames, locale/theme, expiry, timeout, local-file export,
and an offline saved report's tabs, filters, expanded rows, CSV and escaped HTML.
It exercises the CSP in the downloaded file, with no external network requests.

By default this is an isolated browser integration check, not a test of the Next.js
page or React toolbar. To exercise a production build of the actual results page too:

```bash
WHISP_NEXT_APP_DIR=/path/to/built/app python tests/browser/test_report_download.py -v
```

The directory needs `.next`, `node_modules`, `package.json` and `public` for `next start`.
The test replaces its HTML harness server with this app on port 3001, supplies fixture
API configuration on 8001 and intercepts browser status responses with fixture results.
It verifies the actual toolbar's pending state, disabled item, remote download, expiry
toast, Earth Map download URL and IndexedDB-backed `/results/local` export with the API
shut down. PostgreSQL is deliberately pointed at an unused port: the page falls back
to raw column headers. No account, real analysis, database or Earth Engine is used.

This mode covers an unauthenticated page with controlled data; it does not validate
SSO, persisted catalog metadata or a deployed reverse proxy. Both modes run manually,
not in CI. The runner prints `NOT RUN` when the optional Next.js check is not enabled.

## Full application checklist

Run these in a configured development instance before claiming complete UI coverage:

- App on 3001, API on 8001: export a completed result and check the saved report.
- During a slow download, check the spinner/text and disabled HTML menu item; repeated
  clicks must not start duplicate downloads. Check that the control recovers after failure.
- Expire a result already displayed in the app: HTML export must show the expiry message
  and must not silently fall back to the browser's copy of those results.
- Block the API or delay its response beyond 60 seconds: check connection/timeout feedback.
- Open a local GeoJSON result at `/results/local`, then export without an available API.
- Check all supported locales and both themes, including the saved document's `lang`.
- Open the Earth Map action and verify the download URL uses `/api/results/{token}.geojson`,
  preserving the current selection filters. The external map viewer itself is a separate app.
- Repeat the remote export with app/API on different self-hosted origins and an explicit
  `ALLOWED_ORIGINS`; verify the attachment filename is exposed to the browser.

Record which checks were actually performed. The optional Next.js check covers the
remote/local/expired flows, pending state and base Earth Map URL with controlled data.
It does not establish that every locale/theme, selected-map filter, authenticated
deployment or custom self-hosted origin in this checklist passed.
