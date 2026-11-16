# Separação de dados do GEE

*Esta tradução é fornecida apenas para fins informativos. Em caso de divergência, prevalece a versão em inglês.*

Esta página descreve o que o WHISP envia ao Google Earth Engine (GEE), o que o WHISP guarda e onde verificar isso no código. O código do serviço está em [whisp-app](https://github.com/forestdatapartnership/whisp-app) e o da análise em [openforis-whisp](https://github.com/forestdatapartnership/whisp).

## O que o Earth Engine recebe

- As geometrias a analisar, cada uma com um número de talhão sequencial. A biblioteca openforis-whisp remove todas as outras propriedades do GeoJSON, incluindo os IDs externos, antes de chamar o Earth Engine.
- Nenhum nome, endereço de e-mail, endereço IP, ID de usuário ou chave de API.

O Earth Engine é executado com a conta de serviço do WHISP ou, se você as enviar em uma solicitação à API, com suas próprias credenciais do Earth Engine.

Uma geometria ainda pode ser um dado pessoal dependendo do contexto, por exemplo o limite de uma fazenda vinculado a uma pessoa. A proteção do WHISP consiste em manter as geometrias separadas dos dados da conta.

## O que o WHISP guarda

| Dado | Onde | Por quanto tempo |
|---|---|---|
| Geometrias enviadas e resultados das análises | Arquivos temporários no servidor | Excluídos automaticamente em até 15 minutos |
| Registros das tarefas de análise: IDs do usuário e da chave de API, endereço IP, agente (`ui` ou `api`), endpoint, opções de análise, número de talhões, áreas e número de vértices, status, mensagens de erro, carimbos de data/hora | Banco de dados (`analysis_jobs`) | Mantidos para a operação do serviço; os endereços IP são anonimizados após 90 dias |
| Credenciais do Earth Engine que você envia | Fila de tarefas | Somente enquanto a análise aguarda ou é executada; nunca são salvas com os dados de entrada nem com os registros das tarefas |

## Como uma análise é executada

1. O aplicativo web ou um cliente da API envia as geometrias para a API do WHISP (`api/src/submit/router.py`). Os GeoIDs são primeiro convertidos em geometrias por meio do Asset Registry (`api/src/geoid/client.py`).
2. A API valida as geometrias, registra a tarefa, salva os dados de entrada em um arquivo temporário e coloca a análise na fila (`api/src/submit/service.py`).
3. Um worker executa o openforis-whisp, que envia as geometrias ao Earth Engine e salva o resultado em um arquivo temporário (`api/src/worker/tasks.py`).

O navegador nunca chama o Earth Engine, e as credenciais do Earth Engine do WHISP nunca saem do servidor.
