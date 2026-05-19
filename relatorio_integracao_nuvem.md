# Relatório Técnico para Integração Real de Módulos de Sincronização em Nuvem

Para que o Google Drive, o OneDrive e o Dropbox funcionem em ambiente real de produção importando arquivos dinamicamente, precisamos implementar o fluxo de autenticação OAuth2 e a comunicação com as APIs de cada provedor no backend.

---

## 1. Fluxo de Autenticação OAuth2

Para conectar os provedores externos de forma segura, o fluxo técnico segue este padrão:
1. O usuário acessa a aba de Dispositivos e clica no botão Conectar do provedor de sua preferência.
2. O frontend redireciona o usuário para a página de login e autorização do próprio provedor (Google, Microsoft ou Dropbox).
3. O usuário concede as permissões de leitura de arquivos solicitadas pelo aplicativo NuveeMob.
4. O provedor de nuvem redireciona o usuário de volta para o nosso servidor backend por meio de um endereço de retorno configurado (Callback URL), enviando um código de autorização temporário.
5. O nosso servidor backend recebe esse código e realiza uma chamada direta para a API do provedor para trocá-lo pelas credenciais definitivas: o Token de Acesso (Access Token), usado para fazer as requisições de arquivos, e o Token de Renovação (Refresh Token), usado para gerar novos tokens de acesso quando os anteriores expirarem.
6. O backend salva essas informações no banco de dados e informa ao frontend que a conexão foi realizada com sucesso.

---

## 2. Nova Tabela no Banco de Dados (Supabase)

Para persistir as conexões ativas de cada usuário e gerenciar os tokens de acesso sem que eles precisem logar novamente toda vez que abrirem o app, precisaremos criar uma tabela específica no Supabase.

Estrutura da Tabela cloud_integrations:
- id: identificador único (UUID, chave primária)
- user_id: ID do usuário (UUID, chave estrangeira ligada à tabela auth.users)
- provider: identificador da nuvem conectada (texto: googleDrive, oneDrive ou dropbox)
- email: endereço de e-mail do usuário no serviço (texto, para fins de exibição na UI)
- access_token: token de acesso temporário atualizado (texto)
- refresh_token: token de renovação permanente (texto, armazenado de forma segura)
- token_expires_at: data/hora em que o access_token atual irá expirar (timestamp)
- connected_at: data/hora em que o serviço foi conectado (timestamp)

Esta tabela terá uma restrição única composta por (user_id, provider) para evitar que o mesmo usuário tenha mais de um registro para a mesma integração.

---

## 3. Credenciais e Configurações nos Provedores

Cada serviço exige a criação de uma credencial no console de desenvolvedor para permitir o login dos usuários.

Google Cloud Console (Google Drive API):
- Registrar um novo projeto e ativar a Google Drive API.
- Configurar a tela de consentimento OAuth e adicionar os escopos de leitura de arquivos (drive.readonly ou drive.metadata.readonly).
- Criar credenciais de ID do Cliente OAuth e obter o Client ID e Client Secret.
- Configurar a URL de retorno de callback autorizada para: http://localhost:3000/api/auth/googleDrive/callback

Microsoft Entra ID / Portal do Azure (OneDrive):
- Registrar um aplicativo no Microsoft Entra ID.
- Configurar as permissões da API do Microsoft Graph para leitura de arquivos (Files.Read ou Files.Read.All).
- Obter o Client ID, Tenant ID e gerar um Client Secret.
- Configurar a URL de retorno de callback autorizada para: http://localhost:3000/api/auth/oneDrive/callback

Dropbox Developers Console (Dropbox):
- Criar um novo aplicativo escolhendo o tipo de permissão de leitura de metadados e arquivos (files.metadata.read e files.content.read).
- Obter o App Key e App Secret.
- Configurar a URL de retorno de callback autorizada para: http://localhost:3000/api/auth/dropbox/callback

---

## 4. Implementação no Servidor Backend (server.ts)

Para gerenciar esse fluxo, precisamos instalar pacotes oficiais das APIs e adicionar novos endpoints HTTP no nosso arquivo de servidor:

Novas Bibliotecas Requeridas:
- googleapis (para interações com o Google Drive)
- @microsoft/microsoft-graph-client e isomorphic-fetch (para interações com o OneDrive)
- dropbox (para interações com o Dropbox)

Rotas de Autenticação a Criar:
- GET /api/auth/:provider: endpoint que monta e redireciona o usuário para a tela oficial de login de cada nuvem usando as credenciais do console correspondente.
- GET /api/auth/:provider/callback: endpoint que recebe o código de autorização do provedor, obtém os tokens reais de acesso e de renovação, salva-os no Supabase na tabela cloud_integrations, e redireciona o usuário de volta para o painel principal do frontend.

Rota de Sincronização de Arquivos:
- POST /api/sync/:provider: acionado quando o usuário clica no botão Sincronizar no painel. O backend lê o refresh_token do banco de dados, gera um access_token válido, faz uma requisição para listar os arquivos mais recentes guardados na nuvem do usuário, verifica quais arquivos ainda não existem no banco de dados local do NuveeMob, e adiciona-os à tabela files do usuário no Supabase.

---

## 5. Ajustes no Frontend (App.tsx)

No frontend, a lógica atual que usa simulações locais (inserção mockada no localStorage) e janelas de prompt de e-mail será substituída pela integração real:
- O botão Conectar em vez de exibir um prompt abrirá a URL /api/auth/:provider correspondente.
- Ao carregar a tela de Dispositivos, o frontend enviará uma requisição ao Supabase para verificar quais integrações estão salvas e ativas na tabela cloud_integrations para aquele usuário, atualizando dinamicamente a UI para o estado Conectado ou Desconectado.
- O botão Sincronizar enviará uma chamada para a rota de sincronização do backend, trazendo em tempo real os arquivos que o usuário de fato possui nas suas respectivas contas de nuvem, gerando registros reais e atualizando o painel de arquivos recém-sincronizados.
