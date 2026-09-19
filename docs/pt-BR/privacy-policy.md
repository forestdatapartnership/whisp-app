# Política de privacidade do WHISP

*Esta tradução é fornecida apenas para fins informativos. Em caso de divergência, prevalece a versão em inglês.*

**Última atualização:** março de 2026

## 1. Sobre esta política

O WHISP ("What is in that plot?", o que há nesse talhão?) é desenvolvido e mantido pela **Forest Data Partnership** no âmbito da **Organização das Nações Unidas para a Alimentação e a Agricultura (FAO)**, por meio da iniciativa **OpenForis**. Como programa das Nações Unidas, o WHISP opera segundo os princípios internos de proteção de dados da FAO, e não segundo um único arcabouço jurídico nacional ou regional. Esta política explica de forma clara e honesta quais dados coletamos, como os usamos e que controle oferecemos a você sobre suas informações.

- **Site:** [https://whisp.openforis.org](https://whisp.openforis.org)
- **Contato:** [Open-Foris@fao.org](mailto:Open-Foris@fao.org)
- **Repositório:** [https://github.com/forestdatapartnership/whisp-app](https://github.com/forestdatapartnership/whisp-app)

## 2. Quais dados coletamos

### 2.1 Dados da conta

Ao criar uma conta no WHISP, coletamos:

| Dado | Finalidade |
|---|---|
| **Nome e sobrenome** | Identificação da conta |
| **Endereço de e-mail** | Autenticação, verificação da conta, redefinição de senha, notificações |
| **Senha** | Autenticação (armazenada como hash bcrypt, nunca em texto simples) |
| **Organização** (opcional) | Contexto do perfil do usuário |

### 2.2 Dados técnicos

Ao usar o serviço WHISP, coletamos automaticamente:

| Dado | Finalidade | Retenção |
|---|---|---|
| **Endereço IP** | Segurança, prevenção de abusos, limitação de taxa | Anonimizado após o período de retenção configurável (padrão: 90 dias) |
| **Agente de usuário** | Depuração, compatibilidade | Política de rotação de logs |
| **Chave de API** | Controle de acesso à API e limitação de taxa | Até a revogação ou a exclusão da conta |

### 2.3 Dados de análise

Ao enviar geometrias para análise geoespacial:

| Dado | Finalidade |
|---|---|
| **Geometrias** (GeoJSON, WKT ou GeoIDs) | Análise de risco geoespacial via Google Earth Engine |
| **Opções de análise** (parâmetros técnicos) | Configuração da execução da análise |
| **Metadados da tarefa de análise** (carimbos de data/hora, status, tipo de agente, endpoint) | Operação do serviço, auditoria, depuração |

As geometrias podem ser sensíveis dependendo do contexto (por exemplo, o limite de uma fazenda vinculado a uma pessoa). O motor de análise do WHISP processa as geometrias **sem nenhum contexto que identifique o usuário** — consulte o [Anexo sobre a separação de dados do GEE](./gee-data-separation) para as evidências técnicas.

### 2.4 Dados de notificação

| Dado | Finalidade |
|---|---|
| **Endereço de e-mail** | Notificações do serviço |
| **Status da assinatura** | Gerenciamento das preferências de notificação |

## 3. Como usamos seus dados

Usamos seus dados pessoais exclusivamente para:

- **Prestar o serviço** — gerenciamento da conta, autenticação, acesso à API
- **Executar análises geoespaciais** — processar as geometrias que você envia por meio do Google Earth Engine (nenhum dado pessoal é enviado ao GEE)
- **Comunicações do serviço** — verificação de e-mail, redefinição de senha, notificações do serviço
- **Segurança e prevenção de abusos** — limitação de taxa, detecção de abusos com base no IP
- **Melhoria do serviço** — estatísticas de uso agregadas e não identificáveis

**Não** usamos seus dados para:
- Criação de perfis ou tomada de decisões automatizada
- Publicidade ou marketing para terceiros
- Venda ou aluguel a terceiros

## 4. Retenção de dados

| Categoria de dados | Período de retenção |
|---|---|
| **Dados da conta** (nome, e-mail, hash da senha) | Até você excluir sua conta |
| **Endereços IP** nos registros de tarefas de análise | Anonimizados automaticamente após o período de retenção configurado (padrão: 90 dias) |
| **Metadados das tarefas de análise** | Retidos para a operação do serviço; os endereços IP contidos são anonimizados conforme o cronograma acima |
| **Chaves de API** | Até a revogação ou a exclusão da conta (exclusão lógica para a trilha de auditoria) |
| **Tokens de verificação de e-mail / redefinição de senha** | Válidos por 1 hora; revogados após o uso |
| **Assinaturas de notificação** | Até você cancelar a assinatura ou excluir sua conta |
| **Logs do aplicativo** | Sujeitos à política de rotação de logs da infraestrutura |

## 5. Serviços de terceiros e transferências de dados

O WHISP interage com os seguintes serviços de terceiros durante a operação:

| Serviço | Dados compartilhados | Finalidade |
|---|---|---|
| **Google Earth Engine** | Apenas geometrias e parâmetros técnicos de análise. **Nenhum dado pessoal** (nomes, e-mails, IPs, IDs de usuário) é transmitido. | Motor de computação geoespacial |
| **Asset Registry** | GeoIDs (ao usar o envio por GeoID) | Resolução de identificadores geográficos em geometrias |
| **SMTP do Google Gmail** | Endereço de e-mail do destinatário, conteúdo do e-mail | Envio de e-mails de verificação e redefinição de senha |
| **API do Google Maps** | Interações com o mapa no lado do cliente (sujeitas à política de privacidade do Google) | Visualização de mapas na interface |

Para as evidências técnicas da separação de dados entre o WHISP e o Google Earth Engine, consulte o [Anexo sobre a separação de dados do GEE](./gee-data-separation).

## 6. Cookies e armazenamento local

O WHISP usa os seguintes cookies:

| Cookie | Tipo | Finalidade | Duração |
|---|---|---|---|
| `access_token` | Estritamente necessário | Token de autenticação JWT | 30 minutos |
| `refresh_token` | Estritamente necessário | Renovação do token JWT | 7 dias |

Esses cookies são:
- **HttpOnly** — inacessíveis ao JavaScript no lado do cliente
- **Secure** — transmitidos apenas por HTTPS (em produção)
- **SameSite=Strict** — não enviados com solicitações entre sites

O WHISP não usa cookies de análise, rastreamento ou publicidade.

## 7. Seus dados, seu controle

Acreditamos que você deve ter controle efetivo sobre seus dados pessoais. Veja o que o WHISP oferece:

### 7.1 Acessar seus dados

Você pode visualizar seus dados pessoais a qualquer momento na página **Configurações** da sua conta WHISP.

### 7.2 Corrigir seus dados

Você pode atualizar seu nome, sobrenome e organização na página **Configurações**. Para alterar seu endereço de e-mail, entre em contato conosco.

### 7.3 Excluir sua conta

Você pode excluir permanentemente sua conta e todos os dados associados na página **Configurações**. A exclusão da conta:
- Exige a confirmação da senha
- Exclui permanentemente seu perfil de usuário, chaves de API, tokens de verificação e tokens de redefinição de senha
- Anonimiza os registros de tarefas de análise associados

### 7.4 Limitar o processamento de dados

Você pode reduzir os dados que processamos ativamente revogando sua chave de API, cancelando a assinatura das notificações ou excluindo completamente sua conta.

### 7.5 Cancelar as notificações

Você pode cancelar a assinatura das notificações do serviço a qualquer momento na página **Configurações** ou entrando em contato conosco.

### 7.6 Relatar uma preocupação

Se tiver preocupações sobre como seus dados são tratados, incentivamos você a entrar em contato diretamente conosco. Levamos a sério todas as preocupações relacionadas à proteção de dados e responderemos prontamente.

## 8. Segurança dos dados

Implementamos as seguintes medidas técnicas para proteger seus dados:

- **Hash de senhas** com bcrypt (hash unidirecional com sal)
- **Tokens JWT** armazenados em cookies seguros HttpOnly com SameSite=Strict
- **Restrições de CORS** limitadas às origens permitidas configuradas
- **Limitação de taxa** no cadastro e nos endpoints da API
- **Política de senhas fortes** (mínimo de 8 caracteres com maiúscula, minúscula, número e caractere especial)
- **Anonimização automática de dados pessoais** dos endereços IP após o período de retenção configurado
- **Separação por design** entre os dados da conta do usuário e o processamento da análise geoespacial

## 9. Alterações nesta política

Podemos atualizar esta política de privacidade periodicamente. As alterações serão refletidas na data de "Última atualização" no início deste documento. Alterações relevantes serão comunicadas por meio do serviço.

## 10. Contato

Para dúvidas sobre esta política de privacidade ou sobre seus dados pessoais, entre em contato:

[Open-Foris@fao.org](mailto:Open-Foris@fao.org)
