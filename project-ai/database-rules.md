# DATABASE RULES

## BANCO DE DADOS

Utilizar:

- PostgreSQL
- Supabase
- Prisma

## MULTITENANCY

Garantir:

- isolamento completo entre tenants
- RLS em todas as tabelas
- nunca expor dados entre usuários

## REGRAS OBRIGATÓRIAS

- utilizar foreign keys
- utilizar índices
- validar relacionamentos
- evitar duplicidade
- utilizar migrations

## PERFORMANCE

Sempre verificar:

- queries lentas
- ausência de índices
- joins desnecessários
- queries N+1

## SEGURANÇA

Sempre verificar:

- Row Level Security
- permissões incorretas
- exposição de dados
- políticas inseguras

## PADRÕES

- nomes consistentes
- tabelas normalizadas
- timestamps obrigatórios
- soft delete quando necessário

## AUDITORIA

Sempre gerar:

- logs
- histórico
- rastreamento de alterações

## BACKUP

Garantir:

- backups automáticos
- recuperação de dados
- redundância