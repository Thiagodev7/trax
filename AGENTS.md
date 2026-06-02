# Trax — AI Agent Rules (Monorepo Root)

> Regras globais para agentes de IA trabalhando no monorepo Trax.
> **Leia antes de qualquer tarefa.**

---

## O que é o Trax

**Trax** é um SaaS de Portal de Relatórios White-Label para agências de marketing.

- **Backend**: `trax-api/` — NestJS 10 + Prisma 5 + PostgreSQL 16 + Redis 7
- **Frontend**: `trax-web/` — Next.js 16 (App Router) + React 19 + Tailwind CSS v4

Cada agência tem sua URL (`{slug}.traxsolucoes.com.br` ou domínio customizado),
identidade visual própria e dados **completamente isolados** de outras agências.

---

## Documentos de Referência — Leia Antes de Codar

| Documento | Quando ler |
|-----------|-----------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Antes de qualquer decisão arquitetural |
| [trax-api/AGENTS.md](./trax-api/AGENTS.md) | Antes de trabalhar no backend |
| [trax-web/AGENTS.md](./trax-web/AGENTS.md) | Antes de trabalhar no frontend |
| [docs/security.md](./docs/security.md) | Antes de qualquer endpoint de auth/dados |
| [docs/testing.md](./docs/testing.md) | Antes de escrever testes |
| [trax-api/prisma/schema.prisma](./trax-api/prisma/schema.prisma) | Schema do banco (fonte da verdade) |

---

## Regras Críticas — Violação = Falha

### 1. Multi-Tenancy — A Regra de Ouro

```typescript
// ❌ NUNCA — agencyId de fontes não confiáveis
prisma.client.findMany({ where: { agencyId: dto.agencyId } })  // INSECURE
prisma.client.findMany({ where: { agencyId: user.agencyId } }) // INSECURE (JWT)

// ✅ SEMPRE — TenantContext (AsyncLocalStorage, resolvido pelo Host header)
const agencyId = this.tenantContext.getAgencyId();
prisma.client.findMany({ where: { agencyId } })
```

### 2. Design White-Label — Zero Hardcode

```tsx
// ❌ NUNCA — quebra o white-label de qualquer tenant
<div className="bg-white text-gray-900 border-gray-200">
<div style={{ color: '#6366f1' }}>

// ✅ SEMPRE — CSS variables do tenant
<div className="bg-[var(--color-surface)] text-[var(--color-foreground)] border-[var(--color-border)]">
```

### 3. TypeScript — Sem Escape Hatches

```typescript
// ❌ NUNCA
const data: any = response.data
const user = session?.user as any

// ✅ SEMPRE
const data: ClientResponseDto = response.data
const user = session?.user as AuthUser
```

### 4. Clean Architecture — Sem Bypass de Camadas

```typescript
// ❌ NUNCA — Controller acessando Prisma diretamente
constructor(private readonly prisma: PrismaService) {}

// ✅ SEMPRE — Controller chama Use Case, Use Case usa Repository
constructor(private readonly listClients: ListClientsUseCase) {}
```

---

## Onde Está o Quê

```
trax/
├── ARCHITECTURE.md         ← Fonte da verdade arquitetural
├── AGENTS.md               ← Este arquivo (regras globais)
├── README.md               ← Quick start e visão geral
│
├── trax-api/               ← Backend NestJS
│   ├── AGENTS.md           ← Regras específicas do backend
│   ├── README.md           ← Guia do desenvolvedor backend
│   └── prisma/schema.prisma ← Schema do banco
│
├── trax-web/               ← Frontend Next.js
│   ├── AGENTS.md           ← Regras específicas do frontend
│   └── README.md           ← Guia do desenvolvedor frontend
│
└── docs/
    ├── security.md         ← Modelo de segurança completo
    ├── testing.md          ← Estratégia de testes
    ├── local-development.md ← Setup local detalhado
    ├── production.md       ← Deploy em produção
    └── environments.md     ← Mapa de URLs e variáveis
```

---

## Convenções de Commit

```
feat(module): short description of new feature
fix(module): what was broken → what was fixed
chore(deps): bump prisma to 5.13
docs(security): document TOTP 2FA plan
perf(metrics): add Redis cache for daily aggregates
test(auth): add refresh token rotation tests
refactor(client): extract ClientRepository interface

# Exemplos:
feat(report): add share token expiration enforcement
fix(tenant): cache invalidation on customDomain update
feat(ui): add glassmorphism card variant
```

---

## Branches

```
main     ← produção (protegida — apenas via PR)
develop  ← integração (base para features)

feature/{ticket}-{descricao}   ← novas funcionalidades
fix/{ticket}-{descricao}       ← correções de bugs
hotfix/{ticket}-{descricao}    ← fixes críticos em produção
```

---

## Executar o Projeto

```bash
# Setup inicial (da raiz do monorepo)
npm install
cp .env.example .env     # Edite com seus segredos
npm run infra:up
npm run db:migrate && npm run db:seed
npm run dev              # API :3000 + Web :3001

# URLs de desenvolvimento:
# http://localhost:3001                        → Landing page
# http://admin.localhost:3001/admin-panel/login → Super Admin
# http://agenciademo.localhost:3001/login       → Agência Demo
# http://localhost:3000/api/docs               → Swagger
```

---

## Dicas para Produtividade com IA

1. **Sempre mencione o contexto multi-tenant** ao pedir código — é o diferencial central
2. **Referencie os AGENTS.md específicos** quando pedir código de um módulo concreto
3. **Use o schema Prisma como referência** para nomear campos e entender relações
4. **Peça testes junto com o código** — especialmente o teste de isolamento cross-tenant
5. **Cite exemplos do código existente** (ex: "siga o padrão do módulo `client`")
