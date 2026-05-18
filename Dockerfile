# Etapa 1: Build da aplicação
FROM node:20-alpine AS builder

WORKDIR /app

# Copia os arquivos de dependência
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o restante do código fonte
COPY . .

# Roda o script de build do Vite e esbuild
RUN npm run build

# Etapa 2: Preparação da imagem final (Production)
FROM node:20-alpine

WORKDIR /app

# Copia os artefatos de build da etapa anterior
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Instala apenas dependências de produção para deixar a imagem super leve
# No nosso caso, o esbuild empacota o backend, mas para o start funcionar via script:
RUN npm install --omit=dev

# Expõe a porta que o Express vai usar
EXPOSE 3000

# Variável de ambiente obrigatória para rodar em modo de produção
ENV NODE_ENV=production

# Comando que inicia o servidor
CMD ["npm", "start"]
