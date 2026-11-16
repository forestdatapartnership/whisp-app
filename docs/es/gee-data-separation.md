# Separación de datos de GEE

*Esta traducción se ofrece únicamente a título informativo. En caso de discrepancia, prevalece la versión en inglés.*

Esta página describe qué envía WHISP a Google Earth Engine (GEE), qué conserva WHISP y dónde comprobarlo en el código. El código del servicio está en [whisp-app](https://github.com/forestdatapartnership/whisp-app) y el del análisis en [openforis-whisp](https://github.com/forestdatapartnership/whisp).

## Qué recibe Earth Engine

- Las geometrías que se analizan, cada una con un número de parcela correlativo. La biblioteca openforis-whisp elimina cualquier otra propiedad del GeoJSON, incluidos los identificadores externos, antes de llamar a Earth Engine.
- Ningún nombre, dirección de correo electrónico, dirección IP, identificador de usuario ni clave de API.

Earth Engine se ejecuta con la cuenta de servicio de WHISP o, si las envía en una solicitud a la API, con sus propias credenciales de Earth Engine.

Una geometría puede seguir siendo un dato personal según el contexto, por ejemplo el límite de una finca vinculado a una persona. La salvaguarda de WHISP consiste en mantener las geometrías separadas de los datos de la cuenta.

## Qué conserva WHISP

| Dato | Dónde | Durante cuánto tiempo |
|---|---|---|
| Geometrías enviadas y resultados de los análisis | Archivos temporales en el servidor | Se eliminan automáticamente en un plazo de 15 minutos |
| Registros de trabajos de análisis: identificadores de usuario y de clave de API, dirección IP, agente (`ui` o `api`), punto de conexión, opciones de análisis, número de parcelas, superficies y número de vértices, estado, mensajes de error, marcas de tiempo | Base de datos (`analysis_jobs`) | Se conservan para el funcionamiento del servicio; las direcciones IP se anonimizan a los 90 días |
| Credenciales de Earth Engine que envíe | Cola de tareas | Solo mientras el análisis espera o se ejecuta; nunca se guardan con los datos de entrada ni con los registros de trabajos |

## Cómo se ejecuta un análisis

1. La aplicación web o un cliente de la API envía las geometrías a la API de WHISP (`api/src/submit/router.py`). Los GeoIDs se convierten antes en geometrías mediante el Asset Registry (`api/src/geoid/client.py`).
2. La API valida las geometrías, registra el trabajo, guarda los datos de entrada en un archivo temporal y pone el análisis en cola (`api/src/submit/service.py`).
3. Un proceso de trabajo ejecuta openforis-whisp, que envía las geometrías a Earth Engine y guarda el resultado en un archivo temporal (`api/src/worker/tasks.py`).

El navegador nunca llama a Earth Engine, y las credenciales de Earth Engine de WHISP nunca salen del servidor.
