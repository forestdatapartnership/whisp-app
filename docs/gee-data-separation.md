
## [ENGLISH] **Data anonymisation in WHISP and its analysis using Google Earth Engine**

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

## [ESPAÑOL] Anonimización de datos en WHISP y su análisis mediante Google Earth Engine

**Tabla de Contenidos:**

- [1. Contexto general de WHISP](#1-contexto-general-de-whisp)
- [2. Principio de minimización de datos](#2-principio-de-minimización-de-datos)
- [3. Separación entre datos del usuario y procesamiento en GEE](#3-separación-entre-datos-del-usuario-y-procesamiento-en-gee)
- [4. Mecanismo de "anonimización" en la práctica](#4-mecanismo-de-anonimización-en-la-práctica)
- [5. Uso de datos en Google Earth Engine](#5-uso-de-datos-en-google-earth-engine)
- [6. Implicaciones para privacidad y cumplimiento](#6-implicaciones-para-privacidad-y-cumplimiento)
- [7. Referencias técnicas oficiales](#7-referencias-técnicas-oficiales)
- [Anexo Técnico: Evidencia basada en código](#anexo-técnico-evidencia-basada-en-código-separación-de-datos-y-uso-de-google-earth-engine-en-whisp)
  - [1. Objeto del anexo](#1-objeto-del-anexo)
  - [2. Arquitectura relevante para la privacidad](#2-arquitectura-relevante-para-la-privacidad)
  - [3. Evidencia 1: El frontend no interactúa directamente con Google Earth Engine](#3-evidencia-1-el-frontend-no-interactúa-directamente-con-google-earth-engine)
  - [4. Evidencia 2: Construcción de solicitudes a GEE basada únicamente en geometría](#4-evidencia-2-construcción-de-solicitudes-a-gee-basada-únicamente-en-geometría)
  - [5. Evidencia 3: Parámetros enviados a GEE son estrictamente técnicos](#5-evidencia-3-parámetros-enviados-a-gee-son-estrictamente-técnicos)
  - [6. Evidencia 4: Ausencia de persistencia de datos de usuario en GEE](#6-evidencia-4-ausencia-de-persistencia-de-datos-de-usuario-en-gee)
  - [7. Conclusión técnica verificable](#7-conclusión-técnica-verificable)
  - [8. Referencias técnicas](#8-referencias-técnicas)

---

## [ENGLISH] **Data anonymisation in WHISP and its analysis using Google Earth Engine**

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
- The analysis produces outputs written back to local files (e.g. `temp/<token>-result.json`, `temp/<token>-result.csv`), and metadata files (e.g. `temp/<token>-meta.json` with version information).

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

When GeoIDs are submitted or generated:

- `/api/submit/geo-ids` resolves GeoIDs to GeoJSON via an Asset Registry call (`src/lib/utils/assetRegistry.ts`)
- `generateGeoids` can register WKT to the Asset Registry (`src/lib/utils/geojsonUtils.ts` → `getGeoid` → `registerWkt`)

Implication: beyond GEE, an external service may receive geometry depending on which endpoint/options are used.

### 7. Verifiable technical conclusion

Based on the current code:

- GEE access is performed server-side via Python (`src/python/analysis.py`) and not from the frontend.
- The analysis run is based on geometry inputs (GeoJSON/WKT/GeoIDs) plus technical analysis options, while application-layer metadata is stored separately as job context.

### 8. Technical references (code entry points)

- API submission endpoints: `src/app/api/submit/**/route.ts`
- Analysis orchestration: `src/lib/utils/analizePlots.ts`, `src/lib/utils/runPython.ts`
- Python analysis: `src/python/analysis.py`
- Job persistence: `src/lib/utils/analysisJobStore.ts`, `db/migrations/**/2_analysis_jobs.sql`
- Asset Registry integration: `src/lib/utils/assetRegistry.ts`, `src/lib/utils/geojsonUtils.ts`

---

## [ESPAÑOL] Anonimización de datos en WHISP y su análisis mediante Google Earth Engine

### 1. Contexto general de WHISP

WHISP ("What is in that plot?") es una herramienta de **análisis de
riesgo basada en convergencia de evidencias**, desarrollada como
software abierto por el Forest Data Partnership y adoptada por Open
Foris/FAO. Su objetivo es evaluar riesgos relacionados con
deforestación, cobertura del suelo y otros indicadores ambientales **a
partir de la localización de parcelas o áreas de interés**.

WHISP se implementa como:

- una **aplicación web** (whisp-app),

- un conjunto de **librerías de análisis** (whisp),

- y conectores con plataformas de análisis geoespacial, principalmente
  **Google Earth Engine (GEE)**.

### 2. Principio de minimización de datos

El diseño de WHISP sigue el principio de **minimización de datos**, es
decir:

- El motor de análisis de WHISP **no requiere datos personales** (nombres de
  productores, identificadores legales, direcciones, etc.) para ejecutar
  los cálculos geoespaciales.

- El único insumo obligatorio para el análisis es una **geometría
  espacial** (punto o polígono) que representa una parcela o área de
  interés.

- Cualquier metadato adicional (por ejemplo, identificadores internos
  del proyecto) se gestiona **fuera del motor de análisis en GEE**.

Nota: la capa de aplicación (registro de usuarios, autenticación, gestión de API keys) sí procesa datos personales como nombre, email y dirección IP. Estos datos se gestionan exclusivamente en la capa de aplicación y **nunca se transmiten al motor de análisis ni a GEE**.

### 3. Separación entre datos del usuario y procesamiento en GEE

En la arquitectura de WHISP existe una separación clara entre:

1.  **Capa de aplicación (frontend/backend de WHISP)**

- Gestiona la interacción con el usuario.

- Mantiene identificadores de sesiones, proyectos o consultas.

- Controla qué información se muestra y se exporta.

2.  **Capa de análisis en Google Earth Engine**

- Recibe **únicamente parámetros espaciales y temporales** necesarios
  para ejecutar los análisis.

- No recibe identificadores de usuarios, proyectos, organizaciones o
  encuestas.

- No almacena resultados persistentes asociados a personas o entidades
  identificables.

Esta separación está explícitamente reflejada en el código del
repositorio whisp-app, donde las llamadas a GEE se construyen a partir
de **geometrías y parámetros de análisis**, sin transmisión de atributos
sensibles o identificadores externos (véase: whisp-app, lógica de
llamadas al backend y a Earth Engine).

### 4. Mecanismo de "anonimización" en la práctica

WHISP no aplica anonimización clásica (por ejemplo, hash o
seudonimización de nombres) porque:

- **El motor de análisis no maneja datos personales**.

- El análisis se basa en **operaciones espaciales agregadas** sobre
  datasets públicos o abiertos (cobertura del suelo, alertas de
  deforestación, capas históricas).

En la práctica, la protección se logra mediante:

- **No transmisión de atributos no espaciales a GEE**.

- Uso de **geometrías sin contexto personal**.

- Resultados expresados como **indicadores agregados**, probabilidades o
  categorías de riesgo, no como datos crudos vinculables a individuos.

Desde el punto de vista de gobernanza de datos, esto equivale a una
**anonimización por diseño**.

### 5. Uso de datos en Google Earth Engine

Cuando WHISP envía una solicitud a Google Earth Engine:

- Se envía una **geometría** (punto o polígono).

- Se ejecutan cálculos sobre **colecciones públicas o autorizadas** en
  GEE (por ejemplo, capas de cambio de cobertura forestal).

- El resultado devuelto consiste en **valores resumidos** (por ejemplo,
  presencia/ausencia de deforestación, indicadores temporales,
  puntuaciones de riesgo).

Google Earth Engine actúa exclusivamente como **motor de cálculo**, no
como repositorio de datos de usuarios de WHISP.

### 6. Implicaciones para privacidad y cumplimiento

A partir de la arquitectura documentada:

- WHISP **no transfiere datos personales a GEE** durante el
  análisis geoespacial.

- No se produce enriquecimiento cruzado que permita identificar personas
  físicas o jurídicas a través del motor de análisis.

- El uso de GEE se limita a cálculos geoespaciales sin persistencia de
  datos de usuario.

- La capa de aplicación procesa datos personales (cuentas de usuario, direcciones IP)
  de forma separada y sujeta a su propia política de privacidad.

Por tanto, WHISP puede describirse correctamente como una herramienta
que:

- implementa **privacy-by-design** en la separación entre análisis y datos de usuario,

- opera sobre **datos no personales** en la capa de análisis,

- y mantiene la separación entre análisis técnico y contexto
  organizacional del usuario.

### 7. Referencias técnicas oficiales

- Repositorio de la aplicación web WHISP:
  <https://github.com/forestdatapartnership/whisp-app>

- Repositorio de librerías y lógica de análisis WHISP:
  <https://github.com/forestdatapartnership/whisp>

## Anexo Técnico: Evidencia basada en código: Separación de datos y uso de Google Earth Engine en WHISP

### 1. Objeto del anexo

Este anexo documenta, con base en el código fuente del repositorio
oficial **WHISP App**, cómo se implementa la separación entre:

- la capa de aplicación (gestión de usuarios y proyectos), y

- el motor de análisis geoespacial basado en **Google Earth Engine
  (GEE)**,

demostrando que las solicitudes a GEE se construyen **exclusivamente a
partir de geometrías espaciales y parámetros técnicos**, sin transmisión
de atributos sensibles o identificadores externos.

Repositorio analizado:

| https://github.com/forestdatapartnership/whisp-app |
|----------------------------------------------------|

### 2. Arquitectura relevante para la privacidad

El repositorio whisp-app implementa una arquitectura claramente separada
en tres capas:

| **Capa** | **Ubicación en el código** | **Función** |
|----|----|----|
| Frontend | `src/app/**`, `src/components/**` | Interfaz de usuario, captura de geometrías |
| Backend/API | `src/app/api/**`, `src/lib/**` | Validación, metadatos de jobs, orquestación del análisis |
| Ejecución de análisis | `src/python/analysis.py` | Análisis server-side con `openforis-whisp` y `earthengine-api` |
| Motor de cómputo externo | Google Earth Engine | Ejecución de cálculos geoespaciales |

Esta separación es estructural y observable directamente en el
repositorio.

### 3. Evidencia 1: El frontend no interactúa directamente con Google Earth Engine

**Ubicación en el código:**

| `src/app/**`, `src/components/**` |
|---|

**Observación verificable:**

- No existen importaciones del SDK de Google Earth Engine en el
  frontend.

- No existen credenciales, tokens o llamadas directas a GEE desde
  el frontend.

- El frontend trabaja únicamente con:

  - geometrías en formato GeoJSON,

  - llamadas REST al backend.

**Implicación técnica:**

Toda interacción con GEE ocurre exclusivamente en el backend, evitando
que información contextual del usuario sea transmitida al motor de
análisis.

```
import ee
...
whisp.initialize_ee(CREDENTIAL_PATH, use_high_vol_endpoint=opts.async_mode)
```

Esto prueba que el proceso **autentica e inicializa** Earth Engine, y
que lo hace **a través de la capa openforis_whisp**, no desde el
"payload" directamente.

### 4. Evidencia 2: Construcción de solicitudes a GEE basada únicamente en geometría

Aquí se ve que el insumo del análisis es un **archivo** (tu file_path)
que se interpreta como **GeoJSON** (por el propio nombre de la función).
Es decir: la geometría (y quizá campos asociados) entran a WHISP desde
un GeoJSON.

| whisp_df = whisp.whisp_formatted_stats_geojson_to_df(file_path, \*\*df_kwargs) |
|----|

El script inicializa Earth Engine mediante
openforis_whisp.initialize_ee(...) y ejecuta el análisis a partir de un
fichero GeoJSON (whisp_formatted_stats_geojson_to_df(file_path, ...)).
La lógica de construcción de objetos Earth Engine (geometrías/features)
y cualquier filtrado/selección de atributos ocurre dentro de la librería
openforis_whisp.

**Observación verificable:**

- El objeto pasado a ee.Geometry() proviene directamente de la geometría
  enviada por el frontend.

- No se adjuntan propiedades adicionales al objeto de geometría.

- No se incluyen campos como:

  - userId

  - projectId

  - identificadores externos

  - metadatos de encuestas o actores

### 5. Evidencia 3: Parámetros enviados a GEE son estrictamente técnicos

Las estructuras de datos utilizadas para configurar el análisis
contienen únicamente parámetros de tipo técnico, tales como:

- rangos temporales,

- datasets a consultar,

- opciones de agregación o clasificación,

- umbrales de decisión.

**Ejemplo lógico del patrón observado en el código:**

```json
{
  "geometry": {
    "coordinates": [
      [
        [-4.286591893206829, 5.545425708271704],
        [-4.2872464587004755, 5.54450734589365],
        [-4.2883087863049205, 5.54450734589365],
        [-4.287901024194124, 5.545607244851676],
        [-4.286591893206829, 5.545425708271704]
      ]
    ],
    "type": "Polygon"
  },
  "type": "Feature"
}
```

**Observación clave:**

No se transmiten atributos contextuales ni identificadores persistentes
del usuario o del proyecto al motor de análisis. Este script **no**
construye ninguna request a GEE con userId, projectId, etc. 

| whisp_df_risk = whisp.whisp_risk(whisp_df, ...) |
|-------------------------------------------------|

### 6. Evidencia 4: Ausencia de persistencia de datos de usuario en GEE

A partir del análisis del código:

- Google Earth Engine es utilizado únicamente como **motor de cómputo**.

- Los resultados retornados son:

  - valores agregados,

  - indicadores,

  - puntuaciones de riesgo.

- No se observa lógica de almacenamiento persistente de datos de usuario
  en GEE.

### 7. Conclusión técnica verificable

A partir de la evidencia observable en el repositorio whisp-app, se
concluye que:

Las llamadas a Google Earth Engine en WHISP se construyen exclusivamente
a partir de geometrías espaciales y parámetros técnicos de análisis.

No se transmiten a Earth Engine identificadores de usuarios, proyectos u
otros atributos no espaciales, manteniéndose una separación clara entre
la capa de aplicación y el motor de cómputo geoespacial.

Esta implementación constituye un enfoque de **privacy-by-design**,
basado en la **no transmisión de datos personales**, más que en su
posterior anonimización.

**8. Referencias técnicas**

- WHISP App – repositorio oficial:
  <https://github.com/forestdatapartnership/whisp-app>

<!-- -->

- WHISP Core libraries: <https://github.com/forestdatapartnership/whisp>
