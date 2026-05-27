# Desenvolvimento local

Guia para rodar o Trax na sua máquina com front e back locais, usando subdomínios `*.localhost`.

## Pré-requisitos

- Node.js 20+
- Docker Desktop (PostgreSQL + Redis)
- npm

## Setup inicial

```bash
# 1. Clonar e instalar dependências
npm install

# 2. Configurar ambiente
cp .env.example .env

# 3. Gerar segredos (cole no .env)
openssl rand -base64 32   # AUTH_SECRET
openssl rand -base64 32   # JWT_SECRET
openssl rand -base64 32   # JWT_REFRESH_SECRET
openssl rand -hex 32      # ENCRYPTION_KEY

# 4. Subir infraestrutura
npm run infra:up

# 5. Banco de dados
npm run db:migrate
npm run db:seed

# 6. Iniciar API + Web
npm run dev
```

Ou tudo de uma vez (infra + dev):

```bash
npm run dev:full
```

## URLs após o seed

Com `.env` padrão (`TRAX_BASE_DOMAIN=localhost`):

| Página | URL |
|--------|-----|
| Landing | http://localhost:3001 |
| Super-admin | http://admin.localhost:3001/admin-panel/login |
| Agência demo | http://agenciademo.localhost:3001/login |
| API | http://localhost:3000/api |
| Swagger | http://localhost:3000/api/docs |

### Credenciais (seed)

**Super-admin**

- Email: `super@traxsolucoes.com.br`
- Senha: `Tr@x2026!SuperAdmin`
- URL: http://admin.localhost:3001/admin-panel/login

**Agência demo**

- Admin: `admin@agenciademo.com` / `admin123!`
- Viewer: `viewer@agenciademo.com` / `viewer123!`
- Cliente: `contato@techstore.com.br` / `cliente123!`

## Proxy Caddy opcional (URLs sem porta)

Para acessar `http://admin.localhost` sem `:3001`:

```bash
# Com npm run dev já rodando em outro terminal:
npm run dev:proxy
```

| URL com Caddy | Equivalente direto |
|---------------|-------------------|
| http://localhost | http://localhost:3001 |
| http://admin.localhost | http://admin.localhost:3001 |
| http://agenciademo.localhost | http://agenciademo.localhost:3001 |
| http://api.localhost/api | http://localhost:3000/api |

Parar o proxy:

```bash
npm run dev:proxy:down
```

## Scripts úteis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | API (:3000) + Web (:3001) |
| `npm run dev:api` | Apenas API |
| `npm run dev:web` | Apenas Web |
| `npm run infra:up` | Postgres + Redis |
| `npm run infra:down` | Para containers de infra |
| `npm run db:studio` | Prisma Studio |
| `npm run db:reset` | Reset completo do banco |

## PgAdmin (opcional)

```bash
docker compose --profile tools up -d
```

Acesse http://localhost:5050 com as credenciais de `PGADMIN_*` no `.env`.

## Troubleshooting

### `admin.localhost:3001` redireciona para `/login` de agência

Verifique se `TRAX_BASE_DOMAIN=localhost` está no `.env` e reinicie `npm run dev`.

### Tenant não encontrado na API

Confirme que o slug existe no banco (`npm run db:seed`) e que `TRAX_BASE_DOMAIN=localhost`.

Para chamadas diretas à API use o header:

```
X-Agency-Domain: agenciademo.localhost
```

### CORS bloqueado

Inclua a origem em `CORS_ORIGINS` no `.env`. Subdomínios `*.localhost` também são aceitos via regex em `trax-api/src/main.ts`.

## Referência

- [Visão geral de ambientes](./environments.md)
- [Produção](./production.md)
