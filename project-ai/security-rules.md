# SECURITY RULES

## SEGURANÇA OBRIGATÓRIA

Sempre verificar:

- XSS
- CSRF
- SQL Injection
- JWT
- vazamento de tokens
- permissões inseguras
- uploads inseguros

## AUTENTICAÇÃO

Garantir:

- JWT seguro
- expiração de token
- refresh token
- logout seguro

## SENHAS

- hash obrigatório
- nunca armazenar texto puro

## API

- rate limit
- proteção anti abuso
- CORS seguro
- validação obrigatória

## BANCO

- RLS obrigatório
- isolamento multitenant
- permissões mínimas

## SEGREDOS

Nunca expor:

- API keys
- tokens
- secrets
- variáveis sensíveis

## LOGS

Nunca registrar:

- senhas
- tokens
- dados sensíveis

## UPLOADS

Validar:

- tamanho
- extensão
- mime type
- segurança do arquivo

## DEPENDÊNCIAS

Sempre verificar:

- vulnerabilidades
- pacotes inseguros
- bibliotecas abandonadas