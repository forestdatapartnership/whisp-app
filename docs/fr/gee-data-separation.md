# Séparation des données GEE

*Cette traduction est fournie à titre informatif uniquement. En cas de divergence, la version anglaise prévaut.*

Cette page décrit ce que WHISP envoie à Google Earth Engine (GEE), ce que WHISP conserve et où le vérifier dans le code. Le code du service se trouve dans [whisp-app](https://github.com/forestdatapartnership/whisp-app) et celui de l'analyse dans [openforis-whisp](https://github.com/forestdatapartnership/whisp).

## Ce que reçoit Earth Engine

- Les géométries à analyser, chacune avec un numéro de parcelle séquentiel. La bibliothèque openforis-whisp supprime toutes les autres propriétés du GeoJSON, y compris les identifiants externes, avant d'appeler Earth Engine.
- Aucun nom, adresse e-mail, adresse IP, identifiant utilisateur ni clé d'API.

Earth Engine s'exécute avec le compte de service de WHISP ou, si vous les envoyez avec une requête à l'API, avec vos propres identifiants Earth Engine.

Une géométrie peut néanmoins constituer une donnée personnelle selon le contexte, par exemple la limite d'une exploitation liée à une personne. La garantie de WHISP consiste à tenir les géométries à l'écart des données de compte.

## Ce que conserve WHISP

| Donnée | Où | Durée |
|---|---|---|
| Géométries soumises et résultats d'analyse | Fichiers temporaires sur le serveur | Supprimés automatiquement dans un délai de 15 minutes |
| Enregistrements des tâches d'analyse : identifiants de l'utilisateur et de la clé d'API, adresse IP, agent (`ui` ou `api`), point de terminaison, options d'analyse, nombre de parcelles, superficies et nombre de sommets, état, messages d'erreur, horodatages | Base de données (`analysis_jobs`) | Conservés pour le fonctionnement du service ; les adresses IP sont anonymisées au bout de 90 jours |
| Identifiants Earth Engine que vous envoyez | File d'attente des tâches | Uniquement pendant que l'analyse attend ou s'exécute ; jamais enregistrés avec les données d'entrée ni avec les enregistrements des tâches |

## Déroulement d'une analyse

1. L'application web ou un client de l'API envoie les géométries à l'API de WHISP (`api/src/submit/router.py`). Les GeoIDs sont d'abord convertis en géométries via l'Asset Registry (`api/src/geoid/client.py`).
2. L'API valide les géométries, enregistre la tâche, sauvegarde les données d'entrée dans un fichier temporaire et met l'analyse en file d'attente (`api/src/submit/service.py`).
3. Un processus de travail exécute openforis-whisp, qui envoie les géométries à Earth Engine et sauvegarde le résultat dans un fichier temporaire (`api/src/worker/tasks.py`).

Le navigateur n'appelle jamais Earth Engine, et les identifiants Earth Engine de WHISP ne quittent jamais le serveur.
