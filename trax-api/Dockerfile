# Estágio de build
FROM node:20-slim AS builder
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Copia arquivos de dependência
COPY package*.json ./
COPY prisma ./prisma/

# Instala dependências usando npm install
RUN npm install

# Copia o restante do código
COPY . .

# Roda o Prisma Generate
RUN npx prisma generate

# Realiza o build da aplicação NestJS
RUN npm run build

# Estágio de produção
FROM node:20-slim
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Define ambiente de produção
ENV NODE_ENV=production

# Copia package.json
COPY package*.json ./

# Instala apenas dependências de produção
RUN npm install --omit=dev

# Copia arquivos do estágio de build
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

# Roda o Prisma Generate na imagem final (precisa do CLI do Prisma nas dependências normais)
RUN npx prisma generate

# Expõe a porta 3000 (o Cloud Run define a porta através da variável de ambiente PORT)
EXPOSE 3000

# Comando de inicialização
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
