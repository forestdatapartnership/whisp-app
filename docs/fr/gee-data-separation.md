# Anonymisation des données dans WHISP et analyse via Google Earth Engine

*Cette traduction est fournie à titre informatif uniquement. En cas de divergence, la version anglaise prévaut.*

**Table des matières :**

- [1. Contexte général de WHISP](#1-contexte-général-de-whisp)
- [2. Minimisation des données et limitation des finalités (ce que le code exige)](#2-minimisation-des-données-et-limitation-des-finalités-ce-que-le-code-exige)
- [3. Séparation entre le contexte applicatif et le traitement GEE](#3-séparation-entre-le-contexte-applicatif-et-le-traitement-gee)
- [4. Mécanisme d'« anonymisation » en pratique (ce que WHISP fait et ne fait pas)](#4-mécanisme-d-anonymisation--en-pratique-ce-que-whisp-fait-et-ne-fait-pas)
- [5. Utilisation des données dans Google Earth Engine (telle qu'implémentée ici)](#5-utilisation-des-données-dans-google-earth-engine-telle-quimplémentée-ici)
- [6. Implications en matière de confidentialité et de conformité (d'après l'implémentation observable)](#6-implications-en-matière-de-confidentialité-et-de-conformité-daprès-limplémentation-observable)
- [7. Références techniques officielles](#7-références-techniques-officielles)
- [Annexe technique : preuves fondées sur le code](#annexe-technique--preuves-fondées-sur-le-code-structure-actuelle-du-dépôt-et-flux-de-données)
  - [1. Objet de l'annexe](#1-objet-de-lannexe)
  - [2. Architecture pertinente pour la confidentialité (telle qu'implémentée)](#2-architecture-pertinente-pour-la-confidentialité-telle-quimplémentée)
  - [3. Preuve 1 : GEE n'est utilisé que depuis l'analyse Python côté serveur](#3-preuve-1--gee-nest-utilisé-que-depuis-lanalyse-python-côté-serveur)
  - [4. Preuve 2 : la charge utile d'analyse est dérivée des géométries et options soumises](#4-preuve-2--la-charge-utile-danalyse-est-dérivée-des-géométries-et-options-soumises)
  - [5. Preuve 3 : les métadonnées de la couche applicative sont stockées séparément de la charge utile d'analyse](#5-preuve-3--les-métadonnées-de-la-couche-applicative-sont-stockées-séparément-de-la-charge-utile-danalyse)
  - [6. Preuve 4 : l'intégration optionnelle de l'Asset Registry pour les GeoIDs implique des requêtes externes](#6-preuve-4--lintégration-optionnelle-de-lasset-registry-pour-les-geoids-implique-des-requêtes-externes)
  - [7. Conclusion technique vérifiable](#7-conclusion-technique-vérifiable)
  - [8. Références techniques (points d'entrée du code)](#8-références-techniques-points-dentrée-du-code)

---

### 1. Contexte général de WHISP

WHISP (« What is in that plot? », qu'y a-t-il dans cette parcelle ?) est un outil open source d'analyse de risque géospatiale utilisé pour évaluer des indicateurs liés à la déforestation et à l'occupation des sols pour une zone d'intérêt.

Dans ce dépôt, WHISP est implémenté sous la forme :

- d'une application web Next.js (interface + routes API),
- d'une étape d'analyse Python côté serveur (`src/python/analysis.py`) utilisant la bibliothèque `openforis-whisp`,
- d'un accès côté serveur à Google Earth Engine (GEE) via l'`earthengine-api` Python.

### 2. Minimisation des données et limitation des finalités (ce que le code exige)

Pour l'analyse elle-même, l'application est conçue autour de la minimisation des données :

- Les points de terminaison d'analyse acceptent des **géométries** (GeoJSON, WKT ou GeoIDs résolus en géométrie) et des **options d'analyse** facultatives (par exemple `externalIdColumn`, `nationalCodes`, `unitType`, `async`).
- Le pipeline d'analyse n'a besoin ni de noms, ni d'adresses, ni d'identifiants légaux ou d'autres identifiants personnels similaires pour s'exécuter.

Important : une géométrie peut néanmoins être sensible ou potentiellement personnelle selon le contexte (par exemple, la limite d'une exploitation liée à une personne). Le principe de minimisation dans WHISP consiste avant tout à **ne pas coupler** le moteur d'analyse avec le contexte utilisateur/compte.

### 3. Séparation entre le contexte applicatif et le traitement GEE

La séparation visible dans le code actuel est la suivante :

- **Frontend/interface** : collecte la saisie de l'utilisateur et appelle les points de terminaison de l'API WHISP (par exemple `/api/submit/geojson`, `/api/submit/wkt`, `/api/submit/geo-ids`). Il n'embarque pas d'identifiants GEE et n'appelle pas GEE directement.
- **Backend/routes API** : valide et normalise la géométrie, enregistre une tâche d'analyse, écrit la charge utile d'analyse dans un fichier local (`temp/<token>.json`) et déclenche le processus d'analyse.
- **Couche d'analyse (Python)** : s'exécute côté serveur, initialise Earth Engine avec des identifiants de compte de service et effectue l'analyse via `openforis-whisp`.

Cette séparation réduit le risque que le contexte utilisateur/compte (par exemple e-mail, clé d'API, contexte de session) soit mélangé à la couche de calcul.

### 4. Mécanisme d'« anonymisation » en pratique (ce que WHISP fait et ne fait pas)

WHISP n'implémente pas d'anonymisation classique des identifiants personnels comme préalable à l'analyse, car les points de terminaison d'analyse sont conçus pour opérer principalement sur des géométries et des paramètres techniques.

Les mécanismes pertinents pour la confidentialité dans l'implémentation actuelle sont :

- **Séparation par conception** : interface → backend WHISP → analyse Python → GEE.
- **Exécution des tâches par jeton** : chaque exécution d'analyse est identifiée par un jeton UUID généré, utilisé pour récupérer l'état et les résultats.
- **Aucun contexte de compte dans la charge utile d'analyse** : la charge utile dérivée du GeoJSON/WKT écrite dans `temp/<token>.json` provient des géométries et options soumises, et non des champs du profil utilisateur.

L'application peut toujours traiter et stocker des données contextuelles au niveau de la couche applicative (par exemple comptes utilisateurs, clés d'API, métadonnées de requête) dans le cadre de l'exploitation du service.

### 5. Utilisation des données dans Google Earth Engine (telle qu'implémentée ici)

Dans le code actuel, Earth Engine n'est utilisé que depuis le processus Python côté serveur :

- `src/python/analysis.py` initialise GEE avec des identifiants de service et exécute l'analyse `openforis-whisp` à partir de l'entrée GeoJSON stockée localement.
- L'analyse produit des sorties écrites dans des fichiers locaux (par exemple `temp/<token>-result.json`) et des fichiers de métadonnées (par exemple `temp/<token>-meta.json` avec les informations de version).

Ce dépôt ne contient aucun code côté client appelant GEE directement. Toute interaction avec GEE se fait depuis l'environnement d'exécution côté serveur, par l'intermédiaire de la bibliothèque `openforis-whisp` et de l'API Earth Engine.

### 6. Implications en matière de confidentialité et de conformité (d'après l'implémentation observable)

D'après le code source et le schéma de base de données de ce dépôt :

- Le service enregistre une **tâche d'analyse** dans Postgres (`analysis_jobs`) qui peut inclure des métadonnées de requête telles que `agent` (ui/api), `ip_address`, la version et le point de terminaison de l'API, et `analysis_options`.
- L'entrée et les sorties de l'analyse sont écrites dans le stockage local du serveur sous `temp/` (indexées par jeton).
- Des fonctionnalités optionnelles peuvent interagir avec un service externe d'Asset Registry pour résoudre ou générer des GeoIDs (ce qui implique l'envoi/la réception de géométries au format WKT/GeoJSON).

En conséquence, la posture de confidentialité dès la conception de WHISP se décrit au mieux comme une **minimisation et une séparation** des données utilisées pour le calcul géospatial (géométrie + options techniques) par rapport au contexte utilisateur/compte, plutôt que comme l'affirmation que toutes les données traitées seraient intrinsèquement non personnelles.

### 7. Références techniques officielles

- Dépôt de l'application web WHISP : [forestdatapartnership/whisp-app](https://github.com/forestdatapartnership/whisp-app)
- Dépôt des bibliothèques d'analyse WHISP : [forestdatapartnership/whisp](https://github.com/forestdatapartnership/whisp)

## Annexe technique : preuves fondées sur le code (structure actuelle du dépôt et flux de données)

### 1. Objet de l'annexe

Cette annexe résume le flux de données et la séparation pertinents pour la confidentialité observables dans le code source actuel de `whisp-app`, en insistant sur la manière dont l'analyse géospatiale est exécutée via un processus Python côté serveur et Google Earth Engine.

### 2. Architecture pertinente pour la confidentialité (telle qu'implémentée)

| **Couche** | **Emplacement dans le code** | **Rôle** |
|---|---|---|
| Interface (frontend) | `src/app/**`, `src/components/**` | Capture la saisie de géométrie et appelle les routes API WHISP |
| API/backend | `src/app/api/**`, `src/lib/**` | Valide l'entrée, stocke les métadonnées de tâche, orchestre l'exécution de l'analyse |
| Environnement d'analyse | `src/python/analysis.py` | Exécute l'analyse côté serveur avec `openforis-whisp` et `earthengine-api` |
| Calcul externe | Google Earth Engine | Exécute les calculs géospatiaux via l'API Earth Engine |

### 3. Preuve 1 : GEE n'est utilisé que depuis l'analyse Python côté serveur

Faits observables dans ce dépôt :

- Earth Engine est importé et utilisé dans `src/python/analysis.py` (`import ee`).
- Le backend Next.js déclenche l'exécution Python via `child_process.spawn` dans `src/lib/utils/runPython.ts`.

Implication : l'interface n'exécute pas d'appels GEE ; l'accès à GEE se fait sur le serveur.

### 4. Preuve 2 : la charge utile d'analyse est dérivée des géométries et options soumises

Les points de terminaison de soumission construisent une FeatureCollection GeoJSON et la transmettent à l'orchestrateur d'analyse :

- `/api/submit/geojson`, `/api/submit/wkt`, `/api/submit/geo-ids` (voir `src/app/api/submit/**/route.ts`)

Le backend écrit ensuite la charge utile dans un fichier local avant d'exécuter Python :

- `temp/<token>.json` écrit par `src/lib/utils/analizePlots.ts`
- Python lit le fichier et exécute l'analyse `openforis-whisp` (voir `src/python/analysis.py`)

### 5. Preuve 3 : les métadonnées de la couche applicative sont stockées séparément de la charge utile d'analyse

Le schéma de base de données (`analysis_jobs`) stocke les métadonnées et options de tâche, notamment (liste non exhaustive) :

- `agent`, `ip_address`, `api_version`, `endpoint`
- `analysis_options` (JSONB)
- les champs de version pour `openforis-whisp` et l'API Earth Engine

Cet enregistrement est créé par le backend (voir `src/lib/utils/analysisJobStore.ts` et les migrations sous `db/migrations/**`).

### 6. Preuve 4 : l'intégration optionnelle de l'Asset Registry pour les GeoIDs implique des requêtes externes

Lorsque des GeoIDs sont soumis :

- `/api/submit/geo-ids` résout les GeoIDs en GeoJSON via un appel à l'Asset Registry (`src/lib/utils/assetRegistry.ts`)

Implication : au-delà de GEE, un service externe peut recevoir des recherches de GeoID lors de l'utilisation du point de terminaison geo-ids.

### 7. Conclusion technique vérifiable

D'après le code actuel :

- L'accès à GEE est effectué côté serveur via Python (`src/python/analysis.py`) et non depuis le frontend.
- L'exécution de l'analyse repose sur des entrées géométriques (GeoJSON/WKT/GeoIDs) et des options techniques d'analyse, tandis que les métadonnées de la couche applicative sont stockées séparément en tant que contexte de tâche.

### 8. Références techniques (points d'entrée du code)

- Points de terminaison de soumission de l'API : `src/app/api/submit/**/route.ts`
- Orchestration de l'analyse : `src/lib/utils/analizePlots.ts`, `src/lib/utils/runPython.ts`
- Analyse Python : `src/python/analysis.py`
- Persistance des tâches : `src/lib/utils/analysisJobStore.ts`, `db/migrations/**/2_analysis_jobs.sql`
- Intégration de l'Asset Registry : `src/lib/utils/assetRegistry.ts`
