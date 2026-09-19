# Anonimização de dados no WHISP e sua análise com o Google Earth Engine

*Esta tradução é fornecida apenas para fins informativos. Em caso de divergência, prevalece a versão em inglês.*

**Sumário:**

- [1. Contexto geral do WHISP](#1-contexto-geral-do-whisp)
- [2. Minimização de dados e limitação de finalidade (o que o código exige)](#2-minimização-de-dados-e-limitação-de-finalidade-o-que-o-código-exige)
- [3. Separação entre o contexto do aplicativo e o processamento no GEE](#3-separação-entre-o-contexto-do-aplicativo-e-o-processamento-no-gee)
- [4. Mecanismo de "anonimização" na prática (o que o WHISP faz e não faz)](#4-mecanismo-de-anonimização-na-prática-o-que-o-whisp-faz-e-não-faz)
- [5. Uso de dados no Google Earth Engine (conforme implementado aqui)](#5-uso-de-dados-no-google-earth-engine-conforme-implementado-aqui)
- [6. Implicações de privacidade e conformidade (com base na implementação observável)](#6-implicações-de-privacidade-e-conformidade-com-base-na-implementação-observável)
- [7. Referências técnicas oficiais](#7-referências-técnicas-oficiais)
- [Anexo técnico: evidências baseadas no código](#anexo-técnico-evidências-baseadas-no-código-estrutura-atual-do-repositório-e-fluxo-de-dados)
  - [1. Objetivo do anexo](#1-objetivo-do-anexo)
  - [2. Arquitetura relevante para a privacidade (conforme implementada)](#2-arquitetura-relevante-para-a-privacidade-conforme-implementada)
  - [3. Evidência 1: o GEE é usado apenas a partir da análise Python no servidor](#3-evidência-1-o-gee-é-usado-apenas-a-partir-da-análise-python-no-servidor)
  - [4. Evidência 2: a carga de análise deriva das geometrias e opções enviadas](#4-evidência-2-a-carga-de-análise-deriva-das-geometrias-e-opções-enviadas)
  - [5. Evidência 3: os metadados da camada de aplicativo são armazenados separadamente da carga de análise](#5-evidência-3-os-metadados-da-camada-de-aplicativo-são-armazenados-separadamente-da-carga-de-análise)
  - [6. Evidência 4: a integração opcional com o Asset Registry para GeoIDs envolve solicitações externas](#6-evidência-4-a-integração-opcional-com-o-asset-registry-para-geoids-envolve-solicitações-externas)
  - [7. Conclusão técnica verificável](#7-conclusão-técnica-verificável)
  - [8. Referências técnicas (pontos de entrada do código)](#8-referências-técnicas-pontos-de-entrada-do-código)

---

### 1. Contexto geral do WHISP

O WHISP ("What is in that plot?", o que há nesse talhão?) é uma ferramenta de código aberto de análise de risco geoespacial usada para avaliar indicadores relacionados ao desmatamento e à cobertura do solo em uma área de interesse.

Neste repositório, o WHISP é implementado como:

- um aplicativo web Next.js (interface + rotas de API),
- uma etapa de análise Python no servidor (`src/python/analysis.py`) que usa a biblioteca `openforis-whisp`,
- acesso ao Google Earth Engine (GEE) no servidor por meio da `earthengine-api` do Python.

### 2. Minimização de dados e limitação de finalidade (o que o código exige)

Para a análise em si, o aplicativo foi projetado em torno da minimização de dados:

- Os endpoints de análise aceitam **geometrias** (GeoJSON, WKT ou GeoIDs resolvidos em geometria) e **opções de análise** opcionais (por exemplo, `externalIdColumn`, `nationalCodes`, `unitType`, `async`).
- O pipeline de análise não precisa de nomes, endereços, identificadores legais ou identificadores pessoais semelhantes para ser executado.

Importante: uma geometria ainda pode ser sensível ou potencialmente pessoal dependendo do contexto (por exemplo, o limite de uma fazenda vinculado a uma pessoa). O princípio de minimização no WHISP consiste principalmente em **não acoplar** o motor de análise ao contexto de usuário/conta.

### 3. Separação entre o contexto do aplicativo e o processamento no GEE

A separação visível no código atual é:

- **Frontend/interface**: coleta a entrada do usuário e chama os endpoints da API WHISP (por exemplo, `/api/submit/geojson`, `/api/submit/wkt`, `/api/submit/geo-ids`). Não incorpora credenciais do GEE nem chama o GEE diretamente.
- **Backend/rotas de API**: valida e normaliza a geometria, registra uma tarefa de análise, grava a carga de análise em um arquivo local (`temp/<token>.json`) e aciona o processo de análise.
- **Camada de análise (Python)**: executa no servidor, inicializa o Earth Engine com credenciais de conta de serviço e realiza a análise via `openforis-whisp`.

Essa separação reduz a chance de que o contexto de usuário/conta (por exemplo, e-mail, chave de API, contexto de sessão) se misture à camada de computação.

### 4. Mecanismo de "anonimização" na prática (o que o WHISP faz e não faz)

O WHISP não implementa a anonimização clássica de identificadores pessoais como pré-requisito para a análise, porque os endpoints de análise foram construídos para operar principalmente sobre geometrias e parâmetros técnicos.

Os mecanismos relevantes para a privacidade na implementação atual são:

- **Separação por design**: interface → backend WHISP → análise Python → GEE.
- **Execução de tarefas por token**: cada execução de análise é identificada por um token UUID gerado, usado para recuperar o status e os resultados.
- **Nenhum contexto de conta na carga de análise**: a carga derivada de GeoJSON/WKT gravada em `temp/<token>.json` vem das geometrias e opções enviadas, não dos campos do perfil do usuário.

O aplicativo ainda pode processar e armazenar dados contextuais na camada de aplicativo (por exemplo, contas de usuário, chaves de API, metadados de solicitação) como parte da operação do serviço.

### 5. Uso de dados no Google Earth Engine (conforme implementado aqui)

No código atual, o Earth Engine é usado apenas a partir do processo Python no servidor:

- `src/python/analysis.py` inicializa o GEE com credenciais de serviço e executa a análise `openforis-whisp` a partir da entrada GeoJSON armazenada localmente.
- A análise produz saídas gravadas em arquivos locais (por exemplo, `temp/<token>-result.json`) e arquivos de metadados (por exemplo, `temp/<token>-meta.json` com informações de versão).

Este repositório não inclui código no lado do cliente que chame o GEE diretamente. Qualquer interação com o GEE ocorre a partir do ambiente de execução no servidor, mediada pela biblioteca `openforis-whisp` e pela API do Earth Engine.

### 6. Implicações de privacidade e conformidade (com base na implementação observável)

A partir do código-fonte e do esquema de banco de dados deste repositório:

- O serviço armazena um **registro de tarefa de análise** no Postgres (`analysis_jobs`) que pode incluir metadados de solicitação como `agent` (ui/api), `ip_address`, versão e endpoint da API e `analysis_options`.
- A entrada e as saídas da análise são gravadas no armazenamento local do servidor em `temp/` (indexadas por token).
- Recursos opcionais podem interagir com um serviço externo de Asset Registry para resolver ou gerar GeoIDs (o que envolve enviar/receber geometrias no formato WKT/GeoJSON).

Assim, a postura de privacidade por design do WHISP é mais bem descrita como **minimizar e separar** os dados usados na computação geoespacial (geometria + opções técnicas) do contexto de usuário/conta, em vez de afirmar que todos os dados processados são inerentemente não pessoais.

### 7. Referências técnicas oficiais

- Repositório do aplicativo web WHISP: [forestdatapartnership/whisp-app](https://github.com/forestdatapartnership/whisp-app)
- Repositório das bibliotecas de análise WHISP: [forestdatapartnership/whisp](https://github.com/forestdatapartnership/whisp)

## Anexo técnico: evidências baseadas no código (estrutura atual do repositório e fluxo de dados)

### 1. Objetivo do anexo

Este anexo resume o fluxo de dados e a separação relevantes para a privacidade observáveis no código-fonte atual do `whisp-app`, com ênfase em como a análise geoespacial é executada usando um processo Python no servidor e o Google Earth Engine.

### 2. Arquitetura relevante para a privacidade (conforme implementada)

| **Camada** | **Localização no código** | **Função** |
|---|---|---|
| Interface (frontend) | `src/app/**`, `src/components/**` | Captura a entrada de geometria e chama as rotas de API do WHISP |
| API/backend | `src/app/api/**`, `src/lib/**` | Valida a entrada, armazena metadados da tarefa, orquestra a execução da análise |
| Ambiente de análise | `src/python/analysis.py` | Executa a análise no servidor usando `openforis-whisp` e `earthengine-api` |
| Computação externa | Google Earth Engine | Executa os cálculos geoespaciais via API do Earth Engine |

### 3. Evidência 1: o GEE é usado apenas a partir da análise Python no servidor

Fatos observáveis neste repositório:

- O Earth Engine é importado e usado em `src/python/analysis.py` (`import ee`).
- O backend Next.js aciona a execução do Python via `child_process.spawn` em `src/lib/utils/runPython.ts`.

Implicação: a interface não executa chamadas ao GEE; o acesso ao GEE ocorre no servidor.

### 4. Evidência 2: a carga de análise deriva das geometrias e opções enviadas

Os endpoints de envio constroem uma FeatureCollection GeoJSON e a passam ao orquestrador de análise:

- `/api/submit/geojson`, `/api/submit/wkt`, `/api/submit/geo-ids` (veja `src/app/api/submit/**/route.ts`)

O backend então grava a carga em um arquivo local antes de executar o Python:

- `temp/<token>.json` gravado por `src/lib/utils/analizePlots.ts`
- O Python lê o arquivo e executa a análise `openforis-whisp` (veja `src/python/analysis.py`)

### 5. Evidência 3: os metadados da camada de aplicativo são armazenados separadamente da carga de análise

O esquema do banco de dados (`analysis_jobs`) armazena metadados e opções da tarefa, incluindo (lista não exaustiva):

- `agent`, `ip_address`, `api_version`, `endpoint`
- `analysis_options` (JSONB)
- campos de versão do `openforis-whisp` e da API do Earth Engine

Esse registro é criado pelo backend (veja `src/lib/utils/analysisJobStore.ts` e as migrações em `db/migrations/**`).

### 6. Evidência 4: a integração opcional com o Asset Registry para GeoIDs envolve solicitações externas

Quando GeoIDs são enviados:

- `/api/submit/geo-ids` resolve os GeoIDs em GeoJSON por meio de uma chamada ao Asset Registry (`src/lib/utils/assetRegistry.ts`)

Implicação: além do GEE, um serviço externo pode receber consultas de GeoID ao usar o endpoint geo-ids.

### 7. Conclusão técnica verificável

Com base no código atual:

- O acesso ao GEE é realizado no servidor via Python (`src/python/analysis.py`), e não a partir do frontend.
- A execução da análise baseia-se em entradas de geometria (GeoJSON/WKT/GeoIDs) e em opções técnicas de análise, enquanto os metadados da camada de aplicativo são armazenados separadamente como contexto da tarefa.

### 8. Referências técnicas (pontos de entrada do código)

- Endpoints de envio da API: `src/app/api/submit/**/route.ts`
- Orquestração da análise: `src/lib/utils/analizePlots.ts`, `src/lib/utils/runPython.ts`
- Análise Python: `src/python/analysis.py`
- Persistência de tarefas: `src/lib/utils/analysisJobStore.ts`, `db/migrations/**/2_analysis_jobs.sql`
- Integração com o Asset Registry: `src/lib/utils/assetRegistry.ts`
