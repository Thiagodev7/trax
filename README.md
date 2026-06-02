# Trax — White-Label Marketing Reports SaaS

> **Multi-tenant portal de relatórios de marketing** para agências digitais.  
> Cada agência opera com sua própria URL, identidade visual e dados completamente isolados.

[![Stack](https://img.shields.io/badge/Stack-NestJS%20%7C%20Next.js%2016%20%7C%20PostgreSQL%20%7C%20Redis-blueviolet)](#)
[![Architecture](https://img.shields.io/badge/Architecture-Clean%20Architecture%20%7C%20Multi--Tenant-green)](#)
[![License](https://img.shields.io/badge/License-Private-red)](#)

---

## Visão Geral

```
Internet → Caddy (TLS + roteamento)
              ├── trax-web  (Next.js 16 — App Router)
              └── trax-api  (NestJS 10 — REST + Swagger)
                               └── PostgreSQL 16 + Redis 7
```

**Modelo de negócio:** SaaS B2B. Agências de marketing contratam o Trax para criar
portais white-label para seus clientes finais, com relatórios de Google Ads, Meta Ads,
Google Analytics e mais.

**Diferencial técnico central:** Multi-tenancy por domínio/subdomínio com isolamento
total de dados via `agencyId` resolvido a partir do `Host` HTTP — nunca do corpo da requisição.

---

## Quick Start (local)

### Pré-requisitos

| Ferramenta | Versão mínima |
|-----------|---------------|
| Node.js | 20 LTS |
| Docker Desktop | 4.x |
| npm | 10.x |

### Setup em 5 comandos

```bash
# 1. Instalar dependências do monorepo
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# ⚠️ Edite .env — gere os segredos com os comandos abaixo:

# 3. Gerar segredos (cole os valores no .env)
openssl rand -base64 32   # → AUTH_SECRET
openssl rand -base64 32   # → JWT_SECRET
openssl rand -base64 32   # → JWT_REFRESH_SECRET
openssl rand -hex 32      # → ENCRYPTION_KEY (64 chars hex)

# 4. Subir infraestrutura (Postgres + Redis)
npm run infra:up

# 5. Preparar banco + iniciar tudo
npm run db:migrate && npm run db:seed && npm run dev
```

### URLs após o setup

| Portal | URL | Credenciais |
|--------|-----|-------------|
| Landing page | http://localhost:3001 | — |
| Super-admin | http://admin.localhost:3001/admin-panel/login | `super@traxsolucoes.com.br` / `Tr@x2026!SuperAdmin` |
| Agência demo | http://agenciademo.localhost:3001/login | `admin@agenciademo.com` / `admin123!` |
| API REST | http://localhost:3000/api | — |
| Swagger UI | http://localhost:3000/api/docs | — |

> ℹ️ Browsers modernos resolvem `*.localhost` para `127.0.0.1` sem editar `/etc/hosts`.

---

## Estrutura do Monorepo

```
trax/
├── trax-api/              # Backend NestJS + Prisma (porta 3000)
│   ├── src/
│   │   ├── common/        # Guards, filtros, middleware, decorators
│   │   ├── modules/       # Módulos de negócio (agency, auth, client, ...)
│   │   └── prisma/        # Prisma service
│   └── prisma/
│       ├── schema.prisma  # Schema do banco (fonte da verdade)
│       ├── migrations/    # Histórico de migrações
│       └── seed.ts        # Dados de demonstração
│
├── trax-web/              # Frontend Next.js 16 App Router (porta 3001)
│   └── src/
│       ├── app/           # Routes (App Router)
│       │   ├── (dashboard)/   # Dashboard protegido
│       │   ├── admin-panel/   # Super-admin
│       │   ├── landing/       # Landing page pública
│       │   └── login/         # Login white-label
│       ├── components/    # Componentes React
│       └── lib/           # Utilitários, tenant resolver, API client
│
├── docs/                  # Documentação de operações
├── docker-compose.yml     # Infra local (Postgres, Redis, Caddy)
├── docker-compose.prod.yml
├── Caddyfile              # Reverse proxy produção (TLS automático)
└── Caddyfile.dev          # Proxy local opcional
```

---

## Scripts do Monorepo

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | API (:3000) + Web (:3001) em paralelo |
| `npm run dev:full` | Infra + API + Web |
| `npm run dev:proxy` | Inicia Caddy local (URLs sem porta) |
| `npm run dev:proxy:down` | Para o Caddy local |
| `npm run infra:up` | Sobe Postgres + Redis via Docker |
| `npm run infra:down` | Para containers de infra |
| `npm run db:migrate` | Executa migrações Prisma |
| `npm run db:seed` | Popula banco com dados de demo |
| `npm run db:studio` | Abre Prisma Studio (GUI do banco) |
| `npm run db:reset` | Reset completo do banco + seed |

---

## Documentação

| Documento | Descrição |
|-----------|-----------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Arquitetura completa, decisões técnicas e regras |
| [docs/local-development.md](./docs/local-development.md) | Guia de desenvolvimento local detalhado |
| [docs/production.md](./docs/production.md) | Deploy e operações em produção |
| [docs/environments.md](./docs/environments.md) | Mapa de URLs, portas e variáveis por ambiente |
| [docs/security.md](./docs/security.md) | Modelo de segurança, ameaças e controles |
| [docs/testing.md](./docs/testing.md) | Estratégia de testes e cobertura |
| [docs/api-overview.md](./docs/api-overview.md) | Visão geral da API REST |
| [docs/frontend-guide.md](./docs/frontend-guide.md) | Guia de desenvolvimento frontend |
| [docs/google-ads-setup.md](./docs/google-ads-setup.md) | Integração Google Ads |

---

## Tech Stack

### Backend (`trax-api`)

| Camada | Tecnologia |
|--------|-----------|
| Framework | NestJS 10 (TypeScript) |
| ORM | Prisma 5 |
| Banco | PostgreSQL 16 |
| Cache | Redis 7 (ioredis) |
| Auth | JWT (access 15min + refresh 7d httpOnly cookie) |
| Validação | class-validator + class-transformer |
| Docs | Swagger / OpenAPI 3 |
| Segurança | Helmet, CORS, Rate Limiting (Throttler) |
| Criptografia | AES-256-GCM para credenciais de integração |
| Email | Resend |

### Frontend (`trax-web`)

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router, React 19) |
| Styling | Tailwind CSS v4 + CSS Variables |
| Auth | NextAuth v5 (Auth.js) |
| Estado servidor | TanStack Query v5 |
| Estado cliente | Zustand v5 |
| Componentes | Radix UI (headless) |
| Charts | Recharts 3 |
| Animações | Framer Motion 12 |
| Formulários | React Hook Form + Zod v4 |

---

## Modelo de Segurança (resumo)

- **Isolamento de tenant**: toda query ao banco inclui `WHERE agencyId = ?` via `TenantContext` (AsyncLocalStorage)
- **Autenticação**: JWT de curta duração (15min) + refresh token httpOnly rotativo (7d)
- **Roles**: `AGENCY_ADMIN` · `AGENCY_VIEWER` · `CLIENT_VIEWER` · `SUPER_ADMIN`
- **Rate limiting**: 100 req/min global · 10 req/min em endpoints de auth
- **Credenciais de integração**: AES-256-GCM em repouso, nunca em texto plano
- **Zero cross-tenant**: `TenantGuard` rejeita com 403 qualquer divergência JWT ↔ domínio

> 📋 Veja o modelo de segurança completo em [docs/security.md](./docs/security.md)

---

## Planos e Limites

| Plano | Preço | Clientes | Usuários | Integrações |
|-------|-------|----------|----------|-------------|
| Trial | Grátis 14d | 2 | 1 | 2 |
| Starter | R$ 197/mês | 5 | 2 | 3 |
| Pro | R$ 497/mês | 20 | 10 | Todas |
| Agency | R$ 997/mês | Ilimitado | Ilimitado | Todas |
| Enterprise | Sob consulta | Ilimitado | Ilimitado | Todas + SLA |

---

## Contribuindo

1. Leia [ARCHITECTURE.md](./ARCHITECTURE.md) antes de qualquer contribuição
2. Siga as [Convenções de Código](./ARCHITECTURE.md#6-convenções-de-código)
3. PRs para `develop` requerem 1 aprovação + CI verde
4. Commits seguem [Conventional Commits](https://www.conventionalcommits.org/)

```
feat(client): add bulk import endpoint
fix(auth): refresh token rotation race condition
chore(deps): bump prisma to 5.12
docs(security): document TOTP 2FA plan
```
