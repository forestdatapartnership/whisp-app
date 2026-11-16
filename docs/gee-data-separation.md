# GEE Data Separation

This page describes what WHISP sends to Google Earth Engine (GEE), what WHISP keeps, and where to check it in the code. The service code is in [whisp-app](https://github.com/forestdatapartnership/whisp-app) and the analysis code in [openforis-whisp](https://github.com/forestdatapartnership/whisp).

## What Earth Engine receives

- The geometries to analyse, each with a sequential plot number. The openforis-whisp library drops every other GeoJSON property, including external IDs, before it calls Earth Engine.
- No names, email addresses, IP addresses, user IDs or API keys.

Earth Engine runs under WHISP's service account, or under your own Earth Engine credentials if you send them with an API request.

A geometry can still be personal data in context, for example a farm boundary linked to a person. WHISP's safeguard is to keep geometries apart from account details.

## What WHISP keeps

| Data | Where | How long |
|---|---|---|
| Submitted geometries and analysis results | Temporary files on the server | Deleted automatically within 15 minutes |
| Analysis job records: user and API key IDs, IP address, agent (`ui` or `api`), endpoint, analysis options, plot counts, areas and vertex counts, status, error messages, timestamps | Database (`analysis_jobs`) | Kept to run the service; IP addresses are anonymised after 90 days |
| Earth Engine credentials you send | Task queue | Only while the analysis waits or runs; never saved with inputs or job records |

## How an analysis runs

1. The web app or an API client sends geometries to the WHISP API (`api/src/submit/router.py`). GeoIDs are first resolved to geometries through the Asset Registry (`api/src/geoid/client.py`).
2. The API validates the geometries, records the job, saves the input to a temporary file and queues the analysis (`api/src/submit/service.py`).
3. A worker runs openforis-whisp, which sends the geometries to Earth Engine and saves the result to a temporary file (`api/src/worker/tasks.py`).

The browser never calls Earth Engine, and WHISP's Earth Engine credentials never leave the server.
