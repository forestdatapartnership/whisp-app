# Data anonymisation in WHISP and its analysis using Google Earth Engine

**Table of Contents:**

- [1. General context of WHISP](#1-general-context-of-whisp)
- [2. Data minimisation and purpose limitation (what the code requires)](#2-data-minimisation-and-purpose-limitation-what-the-code-requires)
- [3. Separation between application context and GEE processing](#3-separation-between-application-context-and-gee-processing)
- [4. "Anonymisation" mechanism in practice (what WHISP does and does not do)](#4-anonymisation-mechanism-in-practice-what-whisp-does-and-does-not-do)
- [5. Use of data in Google Earth Engine (as implemented here)](#5-use-of-data-in-google-earth-engine-as-implemented-here)
- [6. Privacy and compliance implications (based on observable implementation)](#6-privacy-and-compliance-implications-based-on-observable-implementation)
- [7. Official technical references](#7-official-technical-references)
- [Technical Annex: Code-based evidence](#technical-annex-code-based-evidence-current-repository-structure-and-data-flow)
  - [1. Purpose of the annex](#1-purpose-of-the-annex)
  - [2. Privacy-relevant architecture (as implemented)](#2-privacy-relevant-architecture-as-implemented)
  - [3. Evidence 1: GEE is used only from the server-side Python analysis](#3-evidence-1-gee-is-used-only-from-the-server-side-python-analysis)
  - [4. Evidence 2: The analysis payload is derived from submitted geometries and options](#4-evidence-2-the-analysis-payload-is-derived-from-submitted-geometries-and-options)
  - [5. Evidence 3: Application-layer metadata is stored separately from the analysis payload](#5-evidence-3-application-layer-metadata-is-stored-separately-from-the-analysis-payload)
  - [6. Evidence 4: Optional Asset Registry integration for GeoIDs involves external requests](#6-evidence-4-optional-asset-registry-integration-for-geoids-involves-external-requests)
  - [7. Verifiable technical conclusion](#7-verifiable-technical-conclusion)
  - [8. Technical references (code entry points)](#8-technical-references-code-entry-points)

---

### 1. General context of WHISP

WHISP ("What is in that plot?") is an open-source geospatial risk analysis tool used to assess deforestation- and land-cover-related indicators for an area of interest.

In this repository, WHISP is implemented as:

- a Next.js web application (UI + API routes),
- a server-side Python analysis step (`src/python/analysis.py`) using the `openforis-whisp` library,
- server-side access to Google Earth Engine (GEE) through the Python `earthengine-api`.

### 2. Data minimisation and purpose limitation (what the code requires)

For the analysis itself, the application is designed around data minimisation:

- The analysis endpoints accept **geometries** (GeoJSON, WKT, or GeoIDs resolved to geometry) and optional **analysis options** (e.g. `externalIdColumn`, `nationalCodes`, `unitType`, `async`).
- The analysis pipeline does not require names, addresses, legal identifiers, or similar personal identifiers to run.

Important: a geometry can still be sensitive or potentially personal depending on context (e.g. a farm boundary linked to a person). The minimisation principle in WHISP is primarily about **not coupling** the analysis engine with user/account context.

### 3. Separation between application context and GEE processing

The separation visible in the current codebase is:

- **Frontend/UI**: collects the user's input and calls WHISP API endpoints (e.g. `/api/submit/geojson`, `/api/submit/wkt`, `/api/submit/geo-ids`). It does not embed GEE credentials and does not call GEE directly.
- **Backend/API routes**: validates and normalises geometry, stores an analysis job record, writes the analysis payload to a local file (`temp/<token>.json`), and triggers the analysis process.
- **Analysis (Python) layer**: runs server-side, initialises Earth Engine using service-account credentials, and performs the analysis via `openforis-whisp`.

This separation reduces the chance that user/account context (e.g. email, API key, session context) is mixed into the computation layer.

### 4. "Anonymisation" mechanism in practice (what WHISP does and does not do)

WHISP does not implement classic anonymisation of personal identifiers as a prerequisite for analysis, because the analysis endpoints are built to operate primarily on geometry and technical parameters.

The privacy-relevant mechanisms in the current implementation are:

- **Separation by design**: UI → WHISP backend → Python analysis → GEE.
- **Tokenised job execution**: each analysis run is keyed by a generated UUID token used for status/results retrieval.
- **No account context in analysis payload**: the GeoJSON/WKT-derived payload written to `temp/<token>.json` is derived from the submitted geometries and options, not from user profile fields.

The application may still process and store contextual data at the application layer (e.g. user accounts, API keys, request metadata) as part of operating the service.

### 5. Use of data in Google Earth Engine (as implemented here)

In the current code, Earth Engine is used only from the server-side Python process:

- `src/python/analysis.py` initialises GEE with service credentials and runs `openforis-whisp` analysis from the locally stored GeoJSON input.
- The analysis produces outputs written back to local files (e.g. `temp/<token>-result.json`), and metadata files (e.g. `temp/<token>-meta.json` with version information).

This repository does not include client-side code that calls GEE directly. Any interaction with GEE occurs from the server-side runtime, mediated by the `openforis-whisp` library and the Earth Engine API.

### 6. Privacy and compliance implications (based on observable implementation)

From the source code and database schema in this repository:

- The service stores an **analysis job record** in Postgres (`analysis_jobs`) that can include request metadata such as `agent` (ui/api), `ip_address`, API version and endpoint, and `analysis_options`.
- The analysis input and outputs are written to server local storage under `temp/` (keyed by token).
- Optional features can interact with an external Asset Registry service to resolve or generate GeoIDs (which involves sending/receiving geometries in WKT/GeoJSON form).

Accordingly, WHISP's privacy-by-design posture here is best described as **minimising and separating** data used for geospatial computation (geometry + technical options) from user/account context, rather than claiming that all processed data is inherently non-personal.

### 7. Official technical references

- WHISP web application repository: [forestdatapartnership/whisp-app](https://github.com/forestdatapartnership/whisp-app)
- WHISP analysis libraries repository: [forestdatapartnership/whisp](https://github.com/forestdatapartnership/whisp)

## Technical Annex: Code-based evidence (current repository structure and data flow)

### 1. Purpose of the annex

This annex summarises the privacy-relevant data flow and separation observable in the current `whisp-app` source code, with an emphasis on how geospatial analysis is executed using a server-side Python process and Google Earth Engine.

### 2. Privacy-relevant architecture (as implemented)

| **Layer** | **Location in code** | **Role** |
|---|---|---|
| UI (frontend) | `src/app/**`, `src/components/**` | Captures geometry input and calls WHISP API routes |
| API/backend | `src/app/api/**`, `src/lib/**` | Validates input, stores job metadata, orchestrates analysis execution |
| Analysis runtime | `src/python/analysis.py` | Runs server-side analysis using `openforis-whisp` and `earthengine-api` |
| External compute | Google Earth Engine | Executes geospatial computations via Earth Engine API |

### 3. Evidence 1: GEE is used only from the server-side Python analysis

Observable facts in this repository:

- Earth Engine is imported and used in `src/python/analysis.py` (`import ee`).
- The Next.js backend triggers Python execution via `child_process.spawn` in `src/lib/utils/runPython.ts`.

Implication: the UI does not execute GEE calls; GEE access happens on the server.

### 4. Evidence 2: The analysis payload is derived from submitted geometries and options

The submit endpoints build a GeoJSON FeatureCollection and pass it to the analysis orchestrator:

- `/api/submit/geojson`, `/api/submit/wkt`, `/api/submit/geo-ids` (see `src/app/api/submit/**/route.ts`)

The backend then writes the payload to a local file before running Python:

- `temp/<token>.json` written by `src/lib/utils/analizePlots.ts`
- Python reads the file and runs `openforis-whisp` analysis (see `src/python/analysis.py`)

### 5. Evidence 3: Application-layer metadata is stored separately from the analysis payload

The database schema (`analysis_jobs`) stores job metadata and options, including (non-exhaustive):

- `agent`, `ip_address`, `api_version`, `endpoint`
- `analysis_options` (JSONB)
- version fields for `openforis-whisp` and the Earth Engine API

This record is created by the backend (see `src/lib/utils/analysisJobStore.ts` and migrations under `db/migrations/**`).

### 6. Evidence 4: Optional Asset Registry integration for GeoIDs involves external requests

When GeoIDs are submitted:

- `/api/submit/geo-ids` resolves GeoIDs to GeoJSON via an Asset Registry call (`src/lib/utils/assetRegistry.ts`)

Implication: beyond GEE, an external service may receive GeoID lookups when using the geo-ids endpoint.

### 7. Verifiable technical conclusion

Based on the current code:

- GEE access is performed server-side via Python (`src/python/analysis.py`) and not from the frontend.
- The analysis run is based on geometry inputs (GeoJSON/WKT/GeoIDs) plus technical analysis options, while application-layer metadata is stored separately as job context.

### 8. Technical references (code entry points)

- API submission endpoints: `src/app/api/submit/**/route.ts`
- Analysis orchestration: `src/lib/utils/analizePlots.ts`, `src/lib/utils/runPython.ts`
- Python analysis: `src/python/analysis.py`
- Job persistence: `src/lib/utils/analysisJobStore.ts`, `db/migrations/**/2_analysis_jobs.sql`
- Asset Registry integration: `src/lib/utils/assetRegistry.ts`
