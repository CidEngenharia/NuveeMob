# BACKEND RULES

## STACK

- Node.js
- Express
- TypeScript
- Supabase
- PostgreSQL

## ARQUITETURA

Separar:

- routes
- controllers
- services
- repositories
- middleware

## SEGURANÇA

Validar:

- autenticação
- autorização
- JWT
- permissões

## API

Padrão obrigatório:

- respostas padronizadas
- status HTTP corretos
- tratamento de exceções

## LOGS

Criar logs para:

- erros
- autenticação
- alterações críticas
- auditoria

## PERFORMANCE

Evitar:

- consultas duplicadas
- processamento pesado síncrono
- memory leaks

## VALIDAÇÃO

Sempre validar:

- body
- params
- query
- headers

## ERROS

Sempre tratar:

- erros inesperados
- timeout
- falhas externas
- falhas de banco