# Política de privacidade do WHISP

*Esta tradução é fornecida apenas para fins informativos. Em caso de divergência, prevalece a versão em inglês.*

**Última atualização:** outubro de 2026

## 1. Sobre esta política

O WHISP ("What is in that plot?", o que há nesse talhão?) é desenvolvido e mantido pela **Forest Data Partnership** no âmbito da **Organização das Nações Unidas para a Alimentação e a Agricultura (FAO)**, por meio da iniciativa **OpenForis**. Como plataforma da FAO, o WHISP está sujeito ao [Aviso de Proteção de Dados e Privacidade](https://www.fao.org/contact-us/data-protection-and-privacy/en/) e à [Política de Proteção de Dados](https://www.fao.org/fileadmin/user_upload/legal/docs/AC2022-06.pdf) da FAO (em inglês), e não a um único arcabouço jurídico nacional ou regional. Esta política acrescenta o que é específico do WHISP e explica de forma clara e honesta quais dados coletamos, como os usamos e que controle oferecemos a você sobre suas informações. Se os dois textos divergirem em uma questão de proteção de dados, prevalece o aviso da FAO. Nada nesta política constitui renúncia aos privilégios e imunidades da FAO.

- **Site:** [https://whisp.openforis.org](https://whisp.openforis.org)
- **Contato:** [Open-Foris@fao.org](mailto:Open-Foris@fao.org)
- **Repositório:** [https://github.com/forestdatapartnership/whisp-app](https://github.com/forestdatapartnership/whisp-app)

## 2. Quais dados coletamos

### 2.1 Dados da conta

As contas do WHISP são criadas por meio do login único (SSO) da FAO. No seu primeiro login, o serviço de login da FAO confirma sua identidade e envia ao WHISP seu nome, seu endereço de e-mail e um identificador de conta. O WHISP nunca recebe sua senha do SSO, e sua conta do SSO é gerenciada pela FAO. As contas criadas antes do SSO, que entram com uma senha do WHISP ("contas próprias do WHISP"), também guardam uma senha e, opcionalmente, uma organização.

| Dado | Finalidade |
|---|---|
| **Identificador da conta do SSO** | Vincular sua conta do WHISP ao seu login da FAO |
| **Nome e sobrenome** | Identificação da conta |
| **Endereço de e-mail** | Identificação da conta, notificações, redefinição de senha nas contas próprias do WHISP |
| **Senha** (contas próprias do WHISP) | Autenticação (armazenada como hash bcrypt, nunca em texto simples) |
| **Organização** (contas próprias do WHISP, opcional) | Contexto do perfil do usuário |

### 2.2 Dados técnicos

Ao usar o serviço WHISP, coletamos automaticamente:

| Dado | Finalidade | Retenção |
|---|---|---|
| **Endereço IP** | Segurança, prevenção de abusos, limitação de taxa | Anonimizado após o período de retenção configurável (padrão: 90 dias) |
| **Agente de usuário** | Depuração, compatibilidade | Política de rotação de logs |
| **Chave de API** | Controle de acesso à API e limitação de taxa; uma chave é criada automaticamente no seu primeiro login | Até a revogação ou a exclusão da conta |

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

### 2.5 Feedback

| Dado | Finalidade |
|---|---|
| **Respostas ao formulário de feedback** (avaliação, região, tipo de organização, respostas em texto livre) | Melhorar o WHISP |

Se você estiver conectado, seu feedback fica vinculado à sua conta. Não inclua dados pessoais nos seus comentários.

## 3. Como usamos seus dados

Usamos seus dados pessoais exclusivamente para:

- **Prestar o serviço** — gerenciamento da conta, autenticação, acesso à API
- **Executar análises geoespaciais** — processar as geometrias que você envia por meio do Google Earth Engine (nenhum dado pessoal é enviado ao GEE)
- **Comunicações do serviço** — redefinição de senha nas contas próprias do WHISP, notificações do serviço
- **Segurança e prevenção de abusos** — limitação de taxa, detecção de abusos com base no IP
- **Melhoria do serviço** — estatísticas de uso agregadas e não identificáveis

**Não** usamos seus dados para:
- Criação de perfis ou tomada de decisões automatizada
- Publicidade ou marketing para terceiros
- Venda ou aluguel a terceiros

## 4. Retenção de dados

| Categoria de dados | Período de retenção |
|---|---|
| **Dados da conta** (nome, e-mail, identificador do SSO; hash da senha nas contas próprias do WHISP) | Até você excluir sua conta |
| **Endereços IP** nos registros de tarefas de análise | Anonimizados automaticamente após o período de retenção configurado (padrão: 90 dias) |
| **Metadados das tarefas de análise** | Retidos para a operação do serviço; os endereços IP contidos são anonimizados conforme o cronograma acima |
| **Chaves de API** | Até a revogação ou a exclusão da conta (exclusão lógica para a trilha de auditoria) |
| **Tokens de redefinição de senha** (contas próprias do WHISP) | Válidos por 1 hora; revogados após o uso |
| **Assinaturas de notificação** | Até você cancelar a assinatura ou excluir sua conta |
| **Feedback** | Mantido para melhorar o serviço; desvinculado da sua conta se você excluí-la |
| **Logs do aplicativo** | Sujeitos à política de rotação de logs da infraestrutura |

## 5. Serviços de terceiros e transferências de dados

O WHISP interage com os seguintes serviços de terceiros durante a operação:

| Serviço | Dados compartilhados | Finalidade |
|---|---|---|
| **Google Cloud** | Todos os dados armazenados pelo WHISP (como contas, chaves de API, registros de tarefas de análise e feedback) | Hospedagem do aplicativo e do seu banco de dados |
| **Google Earth Engine** | Apenas geometrias e parâmetros técnicos de análise. **Nenhum dado pessoal** (nomes, e-mails, IPs, IDs de usuário) é transmitido. | Motor de computação geoespacial |
| **Asset Registry** | GeoIDs (ao usar o envio por GeoID) e, se você entrar com SSO, um token de acesso do SSO de curta duração | Resolução de identificadores geográficos em geometrias |
| **SMTP do Google Gmail** | Endereço de e-mail do destinatário, conteúdo do e-mail | Envio de e-mails de redefinição de senha nas contas próprias do WHISP |
| **API do Google Maps** | Interações com o mapa no lado do cliente (sujeitas à política de privacidade do Google) | Visualização de mapas na interface |

O WHISP é executado em servidores do Google Cloud na Europa. Para as evidências técnicas da separação de dados entre o WHISP e o Google Earth Engine, consulte o [Anexo sobre a separação de dados do GEE](./gee-data-separation).

## 6. Cookies e armazenamento local

O WHISP usa os seguintes cookies:

| Cookie | Tipo | Finalidade | Duração |
|---|---|---|---|
| `token` | Estritamente necessário | Sessão do WHISP (JWT) | 30 minutos |
| `refreshToken` | Estritamente necessário | Renovação da sessão do WHISP | 7 dias |
| `kc_refresh_token` | Estritamente necessário | Manter sua sessão do SSO para consultas de GeoID e para sair do SSO | 30 dias |
| `sso_state` | Estritamente necessário | Proteger o redirecionamento do login com SSO | 5 minutos |

Esses cookies são:
- **HttpOnly** — inacessíveis ao JavaScript no lado do cliente
- **Secure** — transmitidos apenas por HTTPS (em produção)
- **SameSite=Strict** — não enviados com solicitações entre sites, exceto `sso_state`, que usa SameSite=Lax para continuar sendo enviado quando a página de login da FAO redireciona você de volta

O WHISP também guarda o seguinte no seu navegador. Esses itens não são enviados aos servidores do WHISP:

| Item | Armazenamento | Finalidade |
|---|---|---|
| `whisp-theme` | Armazenamento local | Sua escolha de tema claro ou escuro |
| `whisp-intro-dismissed` | Armazenamento local | Lembrar que você fechou a introdução |
| `whisp-feedback-prompt-dismissed` | Armazenamento local | Lembrar que você respondeu ou fechou o convite para dar feedback |
| `whisp-sync:…` | Armazenamento de sessão | Passar os resultados da análise para a página de resultados; removidos após a leitura |
| `whisp-release-v…` | Armazenamento de sessão | Guardar em cache o link para as notas da versão atual |
| Banco de dados `whisp` | IndexedDB | Exibir um arquivo de resultados que você abre do seu computador; removido quando você volta à página de envio |

O WHISP não usa cookies de análise, rastreamento ou publicidade.

## 7. Seus dados, seu controle

Acreditamos que você deve ter controle efetivo sobre seus dados pessoais. Veja o que o WHISP oferece:

### 7.1 Acessar seus dados

Você pode visualizar seus dados pessoais a qualquer momento na página **Conta** do WHISP. Para receber uma cópia dos dados pessoais que mantemos sobre você, faça uma solicitação formal (consulte 7.6).

### 7.2 Corrigir seus dados

Se você entra com SSO, seu nome e seu endereço de e-mail vêm da sua conta da FAO; altere-os lá por meio de **Gerenciar conta** na página **Conta**. Nas contas próprias do WHISP, você pode atualizar seu nome, sobrenome e organização na página **Conta**; para alterar seu endereço de e-mail, entre em contato conosco.

### 7.3 Excluir sua conta

Você pode excluir permanentemente sua conta e todos os dados associados na página **Conta**. A exclusão da conta:
- Exige confirmação e, nas contas próprias do WHISP, a senha
- Exclui permanentemente seu perfil de usuário, chaves de API, tokens de verificação, tokens de redefinição de senha e assinaturas de notificação
- Anonimiza os registros de tarefas de análise e o feedback associados

Excluir sua conta do WHISP não exclui sua conta do SSO, que é gerenciada pela FAO.

### 7.4 Limitar o processamento de dados

Você pode reduzir os dados que processamos ativamente revogando sua chave de API, cancelando a assinatura das notificações ou excluindo completamente sua conta. Você também pode se opor ao processamento dos seus dados por meio de uma solicitação formal (consulte 7.6).

### 7.5 Cancelar as notificações

Você pode cancelar a assinatura das notificações do serviço a qualquer momento na página **Conta** ou entrando em contato conosco.

### 7.6 Solicitações formais e preocupações

Se tiver preocupações sobre como seus dados são tratados, incentivamos você a entrar em contato diretamente conosco. Levamos a sério todas as preocupações relacionadas à proteção de dados e responderemos prontamente.

Você também pode fazer uma solicitação formal para acessar (incluindo uma cópia), corrigir ou excluir seus dados pessoais, ou para se opor ao seu processamento, junto à Unidade de Proteção de Dados da FAO: envie-a pelo [portal ServiceNow da FAO](https://fao.service-now.com/csp) e selecione **Data Privacy**. A FAO pode precisar verificar sua identidade primeiro e explicará se alguma parte da solicitação não puder ser atendida.

## 8. Segurança dos dados

Implementamos as seguintes medidas técnicas para proteger seus dados:

- **Login único da FAO**, de modo que o WHISP nunca lida com sua senha do SSO
- **Hash de senhas** com bcrypt (hash unidirecional com sal) nas contas próprias do WHISP
- **Tokens JWT** armazenados em cookies seguros HttpOnly com SameSite=Strict
- **Restrições de CORS** limitadas às origens permitidas configuradas
- **Limitação de taxa** nos endpoints da API e no envio de feedback
- **Política de senhas fortes** nas contas próprias do WHISP (mínimo de 8 caracteres com maiúscula, minúscula, número e caractere especial)
- **Anonimização automática de dados pessoais** dos endereços IP após o período de retenção configurado
- **Separação por design** entre os dados da conta do usuário e o processamento da análise geoespacial

Se um incidente de segurança colocar seus dados pessoais em risco significativo, a FAO segue seus procedimentos de resposta a incidentes, que podem incluir informar os usuários afetados.

## 9. Menores de idade

O WHISP não se destina a menores de idade, e não coletamos intencionalmente dados pessoais de crianças.

## 10. Alterações nesta política

Podemos atualizar esta política de privacidade periodicamente. As alterações serão refletidas na data de "Última atualização" no início deste documento. Alterações relevantes serão comunicadas por meio do serviço.

## 11. Contato

Para dúvidas sobre esta política de privacidade ou sobre seus dados pessoais, entre em contato:

[Open-Foris@fao.org](mailto:Open-Foris@fao.org)

Para solicitações formais de proteção de dados, use o portal ServiceNow da FAO, conforme descrito na seção 7.6.
