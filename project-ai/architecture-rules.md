# ARCHITECTURE RULES

## PADRÃO ARQUITETURAL

Utilizar:

- Clean Architecture
- Feature Based Architecture
- Modular Architecture
- SOLID Principles

## ESTRUTURA

Separar:

- components
- hooks
- services
- repositories
- utils
- types
- validations
- contexts
- middleware

## REGRAS

- evitar arquivos gigantes
- evitar lógica em componentes
- componentes devem ser reutilizáveis
- separar responsabilidades
- evitar acoplamento excessivo
- evitar dependências circulares

## FRONTEND

- utilizar componentes pequenos
- máximo recomendado: 300 linhas por arquivo
- separar UI da lógica
- utilizar hooks customizados

## BACKEND

- separar controllers/services/repositories
- validar todas as entradas
- tratar exceções
- criar logs úteis
- padronizar respostas da API

## API

Padrão:

- RESTful
- respostas padronizadas
- tratamento de erros consistente
- status HTTP corretos

## PERFORMANCE

Evitar:

- renderizações desnecessárias
- queries N+1
- carregamentos pesados
- imports desnecessários

## ESCALABILIDADE

Garantir:

- modularização
- desacoplamento
- reutilização
- manutenção fácil
- expansão futura