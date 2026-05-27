# Produção

Deploy do Trax com Docker Compose, Caddy como reverse proxy e TLS automático.

## Pré-requisitos

- Servidor Linux com Docker e Docker Compose
- DNS apontando para o servidor:
  - `traxsolucoes.com.br` → IP do servidor
  - `admin.traxsolucoes.com.br` → IP do servidor
  - `api.traxsolucoes.com.br` → IP do servidor
  - `*.traxsolucoes.com.br` → IP do servidor (wildcard)

## Setup no servidor

```bash
# 1. Clonar repositório
git clone <repo-url> trax && cd trax

# 2. Configurar ambiente
cp .env.production.example .env
# Edite .env com segredos reais (JWT, AUTH_SECRET, ENCRYPTION_KEY, senhas DB)

# 3. Subir stack
docker compose -f docker-compose.prod.yml up -d --build
```

## Stack de produção

| Serviço | Container | Porta exposta |
|---------|-----------|---------------|
| Caddy | `trax_caddy` | 80, 443 |
| Web | `trax_web_prod` | interna (3001) |
| API | `trax_api_prod` | interna (3000) |
| PostgreSQL | `trax_postgres_prod` | interna |

O Caddy roteia conforme [`Caddyfile`](../Caddyfile):

| Host | Destino |
|------|---------|
| `traxsolucoes.com.br` | Web (landing) |
| `admin.traxsolucoes.com.br` | Web (super-admin) |
| `api.traxsolucoes.com.br` | API |
| `*.traxsolucoes.com.br` | Web (tenants, TLS on-demand) |

## Variáveis críticas

Consulte [`.env.production.example`](../.env.production.example). As mais importantes:

```bash
NODE_ENV=production
TRAX_BASE_DOMAIN=traxsolucoes.com.br
WEB_APP_URL=https://traxsolucoes.com.br
API_PUBLIC_URL=https://api.traxsolucoes.com.br
NEXT_PUBLIC_API_URL=https://api.traxsolucoes.com.br
AUTH_SECRET=<segredo-forte>
JWT_SECRET=<segredo-forte>
ENCRYPTION_KEY=<64-chars-hex>
```

Build args do web (já configurados em `docker-compose.prod.yml`):

- `NEXT_PUBLIC_API_URL=https://api.traxsolucoes.com.br`
- `NEXT_PUBLIC_TRAX_BASE_DOMAIN=traxsolucoes.com.br`

## TLS on-demand para tenants

Subdomínios de agências usam certificados emitidos sob demanda. O Caddy consulta:

```
GET /api/tls-verify?domain={slug}.traxsolucoes.com.br
```

Implementado em `trax-web/src/app/api/tls-verify/route.ts`.

## Acesso SSH

Use sempre o compose de produção na VPS (`-f docker-compose.prod.yml`). Para sessões longas (logs, deploy), evite quedas de conexão:

```bash
ssh -o ServerAliveInterval=30 root@<IP_DO_SERVIDOR>
```

## Operações

```bash
# Ver logs (sempre com -f docker-compose.prod.yml na VPS)
docker compose -f docker-compose.prod.yml logs -f

# Rebuild após deploy
docker compose -f docker-compose.prod.yml up -d --build

# Migrar banco
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy

# Parar stack
docker compose -f docker-compose.prod.yml down
```

## Checklist pós-deploy

- [ ] https://traxsolucoes.com.br carrega a landing
- [ ] https://admin.traxsolucoes.com.br/admin-panel/login funciona
- [ ] https://api.traxsolucoes.com.br responde (ex.: login ou endpoint autenticado; health interno em `/api/super-admin/health`)
- [ ] Subdomínio de agência existente abre com TLS válido
- [ ] OAuth Google Ads usa `GOOGLE_ADS_REDIRECT_URI` de produção

## Referência

- [Visão geral de ambientes](./environments.md)
- [Desenvolvimento local](./local-development.md)
