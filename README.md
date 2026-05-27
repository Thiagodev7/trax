# Trax

White-label marketing reports portal — monorepo multi-tenant (NestJS API + Next.js Web).

## Quick start (local)

```bash
cp .env.example .env
npm install
npm run infra:up
npm run db:migrate
npm run db:seed
npm run dev
```

| Serviço | URL |
|---------|-----|
| Landing | http://localhost:3001 |
| Super-admin | http://admin.localhost:3001 |
| Agência demo | http://agenciademo.localhost:3001 |
| API / Swagger | http://localhost:3000/api/docs |

## Documentação

- [Ambientes (local vs produção)](./docs/environments.md)
- [Desenvolvimento local](./docs/local-development.md)
- [Deploy em produção](./docs/production.md)
- [Google Ads](./docs/google-ads-setup.md)

## Estrutura

```
trax/
├── trax-api/          # NestJS + Prisma
├── trax-web/          # Next.js 16
├── docker-compose.yml # Infra local (Postgres, Redis, Caddy dev)
├── docker-compose.prod.yml
├── Caddyfile          # Produção
├── Caddyfile.dev      # Proxy local opcional (:80)
├── .env.example       # Template local
└── .env.production.example
```

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | API + Web em paralelo |
| `npm run dev:full` | Infra + dev |
| `npm run dev:proxy` | Caddy local (URLs sem porta) |
| `npm run infra:up` | Postgres + Redis |
| `npm run db:migrate` | Migrations Prisma |
| `npm run db:seed` | Dados de demonstração |
