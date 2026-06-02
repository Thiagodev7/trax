# Trax — Architecture Reference

> **Fonte da verdade** para todas as decisões técnicas e arquiteturais do projeto Trax.  
> **Toda contribuição ao codebase deve respeitar estas regras.**  
> Em caso de conflito entre este documento e o código, o código deve ser corrigido.

---

## Índice

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Multi-Tenancy — A Regra de Ouro](#2-multi-tenancy--a-regra-de-ouro)
3. [Backend — Clean Architecture (trax-api)](#3-backend--clean-architecture-trax-api)
4. [Frontend — Arquitetura de Features (trax-web)](#4-frontend--arquitetura-de-features-trax-web)
5. [Segurança](#5-segurança)
6. [Convenções de Código](#6-convenções-de-código)
7. [Performance e Escalabilidade](#7-performance-e-escalabilidade)
8. [Schema de Dados](#8-schema-de-dados)
9. [Billing e Planos](#9-billing-e-planos)
10. [Storage de Assets](#10-storage-de-assets)
11. [Email Transacional](#11-email-transacional)
12. [Infraestrutura de Produção](#12-infraestrutura-de-produção)
13. [Super Admin Panel](#13-super-admin-panel)
14. [Onboarding de Nova Agência](#14-onboarding-de-nova-agência)
15. [Integrações](#15-integrações)
16. [Estratégia de Testes](#16-estratégia-de-testes)
17. [Branches e Versionamento](#17-branches-e-versionamento)
18. [Decisões Arquiteturais (ADRs)](#18-decisões-arquiteturais-adrs)

---

## 1. Visão Geral do Sistema

Trax é um **SaaS de Portal de Relatórios White-Label B2B** para agências de marketing.

**Proposta de valor:**
- Cada agência-cliente recebe um portal com **sua própria URL**, logo, cores e nome
- Dados de múltiplas agências coexistem no mesmo banco com **isolamento total**
- Clientes finais da agência acessam relatórios sem saber que existe o Trax (white-label)

### Diagrama de Alto Nível

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
              ┌────────▼────────┐
              │  Cloudflare     │  DNS + WAF + DDoS Protection
              │  CDN + TLS      │
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │     Caddy       │  Reverse proxy + TLS on-demand
              │ (port 443/80)   │  para domínios customizados
              └────┬───┬────────┘
                   │   │
        ┌──────────▼   ▼──────────┐
        │  trax-web    trax-api   │
        │  Next.js 16  NestJS 10  │
        │  :3001       :3000      │
        └──────────────┬──────────┘
                       │
              ┌────────▼────────┐
              │   PostgreSQL    │  Dados multi-tenant (um banco)
              │   Redis         │  Cache de tenant + sessões
              └─────────────────┘
```

### Roteamento por Subdomínio

```
traxsolucoes.com.br           → Landing page do SaaS
admin.traxsolucoes.com.br     → Super Admin Panel
{slug}.traxsolucoes.com.br    → Portal da agência (padrão)
relatorios.agencia.com.br     → Portal da agência (domínio customizado)
api.traxsolucoes.com.br       → API REST pública
```

---

## 2. Multi-Tenancy — A Regra de Ouro

### 2.1 Resolução de Tenant por Domínio

O tenant é identificado **exclusivamente pelo domínio/subdomínio** da requisição HTTP.
**Nunca** confiar em `agencyId` vindo do corpo da requisição, query params ou headers customizados
para decisões de segurança.

```
Fluxo completo de resolução de tenant:

1. Request chega com Host: relatorios.agencia.com.br
2. TenantMiddleware (NestJS) extrai o hostname
3. Verifica cache Redis: GET tenant:{hostname}  (TTL: 5min)
4. Cache miss → query Postgres:
     SELECT id, slug, name, plan, isActive
     FROM agencies
     WHERE custom_domain = $1 OR (slug = $2 AND custom_domain IS NULL)
     LIMIT 1
5. Tenant não encontrado → 404 {"error": "TENANT_NOT_FOUND"}
6. Tenant inativo → 403 {"error": "TENANT_SUSPENDED"}
7. agencyId injetado no TenantContext (AsyncLocalStorage)
8. Todos os repositories lêem agencyId do TenantContext
```

### 2.2 Regra de Isolamento de Dados (OBRIGATÓRIA)

> [!CAUTION]
> **TODA query ao banco que acessa dados de tenant DEVE incluir `WHERE agencyId = ?`.**
> Violações desta regra constituem uma falha crítica de segurança (data leakage cross-tenant).

```typescript
// ✅ CORRETO — agencyId vem do contexto seguro
async findClients(): Promise<Client[]> {
  const agencyId = this.tenantContext.getAgencyId(); // AsyncLocalStorage
  return this.prisma.client.findMany({
    where: { agencyId },
    orderBy: { createdAt: 'desc' },
  });
}

// ❌ ERRADO — nunca confiar no agencyId do request body/params/headers
async findClients(@Body('agencyId') agencyId: string) {
  return this.prisma.client.findMany({ where: { agencyId } }); // INSECURE
}

// ❌ ERRADO — agencyId do JWT pode divergir do domínio (ataque cross-tenant)
async findClients(@GetUser() user: AuthUser) {
  return this.prisma.client.findMany({ where: { agencyId: user.agencyId } }); // INSECURE
}
```

### 2.3 TenantGuard — Validação JWT × Domínio

O `TenantGuard` valida que o `agencyId` do JWT bate com o `agencyId` resolvido pelo domínio.
Se divergirem → 403 Forbidden imediatamente (possível ataque de token reuse).

```typescript
// Aplicar em qualquer rota de agência:
@UseGuards(JwtAuthGuard, TenantGuard)
@Get('clients')
async listClients() { ... }
```

### 2.4 Índices Compostos (Performance Multi-Tenant)

Índices em tabelas de dados de tenant DEVEM ser **compostos** com `agencyId` primeiro:

```sql
-- Correto: agencyId na frente para row elimination eficiente
CREATE INDEX idx_clients_agency_active ON clients(agency_id, is_active);
CREATE INDEX idx_reports_agency_client ON reports(agency_id, client_id, created_at DESC);
CREATE INDEX idx_integrations_agency_status ON integrations(agency_id, status);

-- Errado: índice sem agencyId força full table scan
CREATE INDEX idx_clients_active ON clients(is_active); -- INADEQUADO
```

### 2.5 Cache de Tenant (Redis)

```typescript
// Chave de cache: tenant:{hostname}
// TTL: 5 minutos (300 segundos)
// Invalidação: ao atualizar customDomain ou slug da agência
const TENANT_CACHE_TTL = 300;
const cacheKey = `tenant:${hostname}`;
```

---

## 3. Backend — Clean Architecture (trax-api)

### 3.1 Camadas e Responsabilidades

```
┌─────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER                                     │
│  Controllers, DTOs, Guards, Interceptors                │
│  → Valida input HTTP, chama Use Cases, formata output   │
│  → ZERO lógica de negócio. ZERO imports de Prisma.      │
├─────────────────────────────────────────────────────────┤
│  APPLICATION LAYER                                      │
│  Use Cases (um por ação de negócio)                     │
│  → Orquestra chamadas ao domínio e repositórios         │
│  → Stateless. Testável sem banco.                       │
├─────────────────────────────────────────────────────────┤
│  DOMAIN LAYER                                           │
│  Entities, Repository Interfaces, Domain Errors         │
│  → Regras de negócio puras. SEM imports de frameworks.  │
│  → SEM imports de Prisma, NestJS ou HTTP.               │
├─────────────────────────────────────────────────────────┤
│  INFRASTRUCTURE LAYER                                   │
│  Prisma repositories, Redis, HTTP clients externos      │
│  → Implementações concretas. Detalhes de persistência.  │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Estrutura de Pasta por Módulo

```
src/modules/<nome>/
  presentation/
    <nome>.controller.ts         ← HTTP handlers (método + rota)
    dto/
      create-<nome>.dto.ts       ← Input validation (class-validator)
      update-<nome>.dto.ts
      <nome>-response.dto.ts     ← Output shape (class-transformer Expose)
  application/
    use-cases/
      create-<nome>.use-case.ts  ← Uma ação de negócio = um arquivo
      list-<nome>.use-case.ts
      update-<nome>.use-case.ts
      delete-<nome>.use-case.ts
  domain/
    entities/
      <nome>.entity.ts           ← Classe Dart pura, sem decorators ORM
    repositories/
      <nome>.repository.ts       ← Interface/abstract class (injeção via token)
    errors/
      <nome>-not-found.error.ts  ← Erros de domínio tipados
  infrastructure/
    repositories/
      prisma-<nome>.repository.ts ← Implementação concreta com Prisma
  <nome>.module.ts               ← Registro DI do módulo
```

### 3.3 Regras de Dependência (Dependency Rule)

```
Presentation → Application → Domain ← Infrastructure
     ↑               ↑
  NestJS DI      NestJS DI

PROIBIDO:
  Domain → Infrastructure  (inversão de dependência violada)
  Domain → NestJS          (acoplamento com framework)
  Controller → Prisma      (bypass das camadas)
  Use Case → Controller    (dependência circular)
```

### 3.4 DTOs e Validação

Todos os DTOs de input usam `class-validator` + `class-transformer`:

```typescript
// ✅ DTO de input bem definido
export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @ApiProperty({ example: 'TechStore LTDA' })
  name: string;

  @IsEmail()
  @IsOptional()
  @ApiProperty({ required: false })
  email?: string;

  @IsUrl()
  @IsOptional()
  website?: string;
}

// ✅ DTO de response com Expose() para evitar over-fetching
@Exclude()
export class ClientResponseDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() email?: string;
  @Expose() isActive: boolean;
  @Expose() createdAt: Date;
  // agencyId NÃO exposto — informação sensível
}
```

`ValidationPipe` global configurado com:
```typescript
new ValidationPipe({
  whitelist: true,              // Remove campos não declarados no DTO
  forbidNonWhitelisted: true,   // Rejeita request com campos extras (400)
  transform: true,              // Converte tipos automaticamente
  transformOptions: {
    enableImplicitConversion: true,
  },
})
```

### 3.5 Tratamento de Erros

```typescript
// ✅ Erros de domínio tipados (src/modules/<nome>/domain/errors/)
export class AgencyNotFoundError extends Error {
  constructor(identifier: string) {
    super(`Agency not found: ${identifier}`);
    this.name = 'AgencyNotFoundError';
  }
}

// ✅ GlobalExceptionFilter mapeia para HTTP sem expor internals
// src/common/filters/global-exception.filter.ts
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    if (exception instanceof AgencyNotFoundError) {
      return response.status(404).json({ error: 'AGENCY_NOT_FOUND' });
    }
    if (exception instanceof UnauthorizedTenantError) {
      return response.status(403).json({ error: 'CROSS_TENANT_ACCESS' });
    }
    // Stack traces nunca em produção
    if (nodeEnv === 'production') {
      return response.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
    }
    // Stack trace apenas em desenvolvimento
    ...
  }
}
```

### 3.6 Módulos Implementados

| Módulo | Descrição | Status |
|--------|-----------|--------|
| `tenant` | Resolve agencyId por domínio, cache Redis | ✅ |
| `auth` | Login, refresh, logout, me, sessão | ✅ |
| `agency` | CRUD de configurações da agência | ✅ |
| `client` | CRUD de clientes, upload de logo | ✅ |
| `report` | CRUD de relatórios, share token | ✅ |
| `integration` | Conexões com plataformas de anúncios | ✅ |
| `metrics` | Cache de métricas diárias (DailyMetric) | ✅ |
| `user` | CRUD de usuários, convites | ✅ |
| `upload` | Upload de assets (logos, imagens) | ✅ |
| `onboarding` | Self-service de nova agência | ✅ |
| `email` | Email transacional via Resend | ✅ |
| `super-admin` | Painel de controle da plataforma | ✅ |
| `audit-log` | Registro de ações (compliance) | ✅ |
| `scheduling` | Agendamento de posts orgânicos | ✅ |
| `health` | Health check endpoint | ✅ |

---

## 4. Frontend — Arquitetura de Features (trax-web)

### 4.1 Estrutura de Rotas (Next.js App Router)

```
src/app/
  (dashboard)/           ← Route group — dashboard protegido (auth required)
    layout.tsx           ← Sidebar + Header, valida sessão
    page.tsx             ← Dashboard com KPIs e gráficos
    clients/             ← CRUD de clientes
    reports/             ← Listagem e criação de relatórios
    settings/            ← Configurações white-label
    users/               ← Gestão de usuários da agência

  admin-panel/           ← Super Admin (apenas SUPER_ADMIN role)
    (dashboard)/
    layout.tsx
    login/

  landing/               ← Páginas públicas do SaaS
    page.tsx             ← Landing page (rewrite de localhost:3001)

  login/                 ← Login white-label por tenant
  signup/                ← Cadastro de nova agência
  share/                 ← Relatórios públicos (sem login)
  logout/                ← Logout + clear de sessão

  api/                   ← Route handlers Next.js
    auth/[...nextauth]/  ← NextAuth callbacks
    tls-verify/          ← Verificação Caddy TLS on-demand
```

### 4.2 Resolução de Tenant no Frontend

```typescript
// src/lib/tenant.ts — resolve branding pelo Host HTTP
// Chamado em layout.tsx (Server Component) a cada request

export async function resolveTenant(host: string): Promise<TenantResolved> {
  // 1. Chama GET /api/v1/tenant/resolve?domain={host}
  // 2. Recebe { agencyId, name, branding: { primaryColor, logoUrl, ... } }
  // 3. Retorna dados tipados para injeção no layout
}

// layout.tsx — injeta CSS variables sem FOUC
<style dangerouslySetInnerHTML={{ __html: brandingToCssString(tenant.branding) }} />
```

### 4.3 Design System — CSS Variables

O sistema de temas funciona via CSS custom properties injetadas no `:root`:

```css
/* globals.css — tokens base (sobrescritos pelo tenant via layout.tsx) */
@theme {
  --color-primary: #6366f1;     /* Sobrescrito pelo tenant */
  --color-secondary: #818cf8;
  --color-accent: #f59e0b;
  --color-bg: #f8fafc;          /* Dark mode: #020617 */
  --color-surface: #ffffff;     /* Dark mode: #0f172a */
  --color-surface-2: #f1f5f9;   /* Dark mode: #1e293b */
  --color-border: #e2e8f0;      /* Dark mode: #334155 */
  --color-foreground: #0f172a;  /* Dark mode: #f1f5f9 */
  --radius-md: 10px;            /* Sobrescrito pelo tenant */
}
```

**Regras do Design System:**
1. **Nunca** usar cores hardcoded — sempre `var(--color-*)` ou tokens do Tailwind mapeados
2. Classes utilitárias globais: `.glass`, `.glass-strong`, `.gradient-primary`, `.gradient-text`, `.card`, `.shimmer`
3. Animações: `.animate-fade-in` para page transitions, Framer Motion para micro-interações
4. Responsividade: mobile-first, breakpoints `sm:640px`, `md:768px`, `lg:1024px`, `xl:1280px`

### 4.4 Componentes — Hierarquia

```
src/components/
  ui/                    ← Primitivos (Button, Input, Card, Badge, ...)
  layout/                ← Shell (Sidebar, Header, Topbar)
  auth/                  ← LoginForm, SignupForm
  dashboard/             ← KpiCard, DashboardCharts, ActivityFeed
  clients/               ← ClientTable, ClientForm, ClientDetail
  reports/               ← ReportCard, ReportViewer, ReportBuilder
  integrations/          ← IntegrationCard, OAuthFlow
  settings/              ← BrandingEditor, DomainConfig, ColorPicker
  admin/                 ← AgencyTable, MetricsPanel (super-admin)
  providers/             ← QueryProvider, SessionProvider
```

**Regras de componentes:**
- Server Components por padrão — `'use client'` apenas quando necessário (interatividade, hooks)
- Props tipadas com interfaces TypeScript explícitas — sem `any`
- Componentes de UI (`/ui`) são puros e sem lógica de negócio
- Componentes de feature encapsulam lógica mas não fazem chamadas HTTP diretamente

### 4.5 Data Fetching

```typescript
// Server Components: fetch direto via apiRequest() (sem waterfall)
const clients = await apiRequest<Client[]>('/clients', { domain: host });

// Client Components: TanStack Query (cache, refetch, loading states)
const { data, isLoading } = useQuery({
  queryKey: ['clients', agencyId],
  queryFn: () => apiClient.get('/clients'),
  staleTime: 30_000, // 30 segundos
});

// Mutations: useMutation com invalidação de cache
const createClient = useMutation({
  mutationFn: (data) => apiClient.post('/clients', data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
});
```

### 4.6 Middleware — Lógica de Roteamento

O middleware em `src/middleware.ts` gerencia:

| Domínio | Comportamento |
|---------|---------------|
| Domínio raiz (`localhost`, `traxsolucoes.com.br`) | Rewrite para `/landing/*` |
| `admin.*` | Protege com `isSuperAdmin` → redireciona para `/admin-panel/login` |
| `{slug}.*` | Protege com `isLoggedIn` → redireciona para `/login` |
| Rotas de share (`/share/*`) | Públicas — sem autenticação |

---

## 5. Segurança

### 5.1 Autenticação

```
Fluxo de login:
1. POST /api/v1/auth/login → valida email + password (bcrypt)
2. Gera access_token JWT (15min, payload: { sub, agencyId, role })
3. Gera refresh_token opaco (UUID) → armazena hash SHA-256 no banco
4. Seta refresh_token como httpOnly cookie (7 dias, Secure, SameSite=Strict)
5. Retorna { access_token } no body

Fluxo de refresh:
1. POST /api/v1/auth/refresh (sem body, lê cookie automaticamente)
2. Valida hash do refresh_token no banco (não revogado, não expirado)
3. Rotação obrigatória: revoga o token atual, emite novo par
4. Retorna novo access_token

Logout:
1. POST /api/v1/auth/logout
2. Revoga refresh_token no banco (campo revokedAt)
3. Limpa cookie no browser
```

### 5.2 JWT Payload

```typescript
interface JwtPayload {
  sub: string;      // userId (UUID)
  agencyId: string; // Validado contra o domínio a cada request
  role: UserRole;   // AGENCY_ADMIN | AGENCY_VIEWER | CLIENT_VIEWER
  iat: number;
  exp: number;      // access_token: 15min, refresh_token: 7d
}
```

### 5.3 RBAC — Controle de Acesso por Role

| Role | Descrição | Permissões |
|------|-----------|------------|
| `AGENCY_ADMIN` | Administrador da agência | CRUD completo de clientes, usuários, relatórios, configurações |
| `AGENCY_VIEWER` | Visualizador da agência | Read-only de todos os clientes e relatórios |
| `CLIENT_VIEWER` | Visualizador de cliente(s) | Read-only apenas dos clientes atribuídos |
| `SUPER_ADMIN` | Administrador da plataforma Trax | Acesso a todos os tenants (tabela separada) |

```typescript
// Uso via decorator:
@Roles(UserRole.AGENCY_ADMIN)
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Post('clients')
async createClient(@Body() dto: CreateClientDto) { ... }
```

### 5.4 Rate Limiting

| Escopo | Limite |
|--------|--------|
| Global (todas as rotas) | 100 req/min por IP |
| Endpoints de auth (`/auth/login`, `/auth/refresh`) | 10 req/min por IP |
| Upload de arquivos | 20 req/min por IP |

### 5.5 Segredos e Variáveis de Ambiente

- **Nunca** commitar `.env` — apenas `.env.example` com valores placeholder
- `JWT_SECRET` e `JWT_REFRESH_SECRET` gerados com `openssl rand -base64 32`
- `ENCRYPTION_KEY` de 64 chars hex gerado com `openssl rand -hex 32`
- Credenciais de integração (Google Ads, Meta) armazenadas criptografadas: AES-256-GCM
  ```
  Campo credentialsEnc armazena JSON: { iv: string, authTag: string, data: string }
  ```

### 5.6 Headers HTTP (Helmet)

```typescript
// Configurado via Helmet em main.ts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // necessário para Next.js inline scripts
      imgSrc: ["'self'", "data:", "https:"],    // logos dos tenants via CDN
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
}));
```

### 5.7 Proteção de Dados Sensíveis

- Campos `passwordHash` nunca expostos em responses (DTOs com `@Exclude()`)
- `credentialsEnc` nunca exposto — apenas `status` da integração
- `agencyId` interno não exposto em responses do dashboard do tenant
- Audit log de todas as ações críticas (`LOGIN`, `CREATE`, `DELETE`, `PUBLISH`)

---

## 6. Convenções de Código

### 6.1 TypeScript — NestJS

```typescript
// ✅ TypeScript estrito — sem `any`
// tsconfig.json: strict: true, noImplicitAny: true, strictNullChecks: true

// ✅ Nomenclatura de arquivos: kebab-case
create-client.use-case.ts
prisma-client.repository.ts
jwt-auth.guard.ts

// ✅ Classes: PascalCase
class CreateClientUseCase { }
class PrismaClientRepository { }

// ✅ Métodos e variáveis: camelCase
async createClient(dto: CreateClientDto): Promise<ClientResponseDto> { }

// ✅ Injeção via token, não implementação concreta
// No módulo:
{ provide: CLIENT_REPOSITORY_TOKEN, useClass: PrismaClientRepository }
// No use case:
constructor(@Inject(CLIENT_REPOSITORY_TOKEN) private repo: ClientRepository) {}
```

### 6.2 TypeScript — Next.js

```typescript
// ✅ Server Components por padrão, Client apenas quando necessário
// ✅ Props tipadas explicitamente — sem prop drilling de any
// ✅ Imports absolutos via @/ (configurado em tsconfig.json)
import { apiRequest } from '@/lib/api-client'
import { resolveTenant } from '@/lib/tenant'

// ✅ Zod para validação de forms no frontend
const createClientSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email().optional(),
})
```

### 6.3 CSS e Styling

```tsx
// ✅ CSS Variables do design system — nunca cores hardcoded
<div className="text-[var(--color-foreground)] bg-[var(--color-surface)]">

// ✅ cn() helper para classes condicionais (clsx + tailwind-merge)
import { cn } from '@/lib/utils'
<button className={cn('btn', isActive && 'btn-active', className)}>

// ❌ Evitar: cores Tailwind sem remapeamento para CSS variables
<div className="text-gray-900 bg-white">  // Não sobrescrito pelo tenant
```

---

## 7. Performance e Escalabilidade

### 7.1 Backend

| Otimização | Implementação |
|-----------|---------------|
| **Paginação cursor-based** | Obrigatória em todos os endpoints de listagem de grande volume |
| **N+1 prevention** | Usar `include` do Prisma com seletividade — nunca eager load desnecessário |
| **Índices compostos** | `agencyId` sempre primeiro em índices de tabelas de tenant |
| **Redis caching** | Cache de resolução de tenant (TTL 5min), potencial para métricas agregadas |
| **Response compression** | `compression` middleware habilitado globalmente (gzip) |
| **Connection pooling** | Prisma connection pool configurado para produção (10-20 conexões) |

```typescript
// ✅ Paginação cursor-based (evita OFFSET em grandes tabelas)
async listClients(agencyId: string, cursor?: string, limit = 20) {
  return this.prisma.client.findMany({
    where: { agencyId },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    orderBy: { createdAt: 'desc' },
  });
}
```

### 7.2 Frontend

| Otimização | Implementação |
|-----------|---------------|
| **Server Components** | Fetch de dados no servidor, sem waterfalls client-side |
| **TanStack Query** | Cache inteligente, deduplicação de requests, background refetch |
| **Skeleton Loading** | `shimmer` CSS animation em todos os estados de loading |
| **Image optimization** | Next.js `<Image>` para assets internos; `<img>` para logos externas (CDN) |
| **Code splitting** | Next.js App Router — lazy loading automático por rota |
| **Font optimization** | `next/font/google` com `display: 'swap'` para Inter |

### 7.3 Multi-Tenant Scaling

Para suportar centenas de agências simultâneas:

```
Tier 1 (atual):  PostgreSQL single + Redis single
Tier 2 (futuro): Read replicas PostgreSQL para queries de relatórios
Tier 3 (escala): Sharding por agencyId se necessário (UUID-based)

Bottlenecks identificados e mitigações:
- Resolução de tenant: mitigado por Redis cache (99% dos requests)
- Geração de relatórios: worker queue (Bull/BullMQ) — Fase 2
- Sync de métricas: cron jobs por tenant com rate limiting das APIs externas
```

---

## 8. Schema de Dados

O schema Prisma em `trax-api/prisma/schema.prisma` é a fonte da verdade.

### Entidades Principais

```
Agency (tenant raiz)
  ├── Client[] (clientes da agência)
  │     ├── Integration[] (conexões com plataformas)
  │     │     └── DailyMetric[] (cache de métricas)
  │     ├── Report[] (relatórios)
  │     │     └── ReportIntegration[] (integrações usadas no relatório)
  │     ├── UserClient[] (acesso de CLIENT_VIEWER)
  │     ├── ScheduledPost[] (posts agendados)
  │     └── ClientMetaConfig? (configuração Meta Ads)
  ├── User[] (usuários da agência)
  │     ├── RefreshToken[] (tokens de refresh ativos)
  │     └── UserClient[] (clientes visíveis para CLIENT_VIEWER)
  ├── Report[] (desnormalizado para queries diretas)
  └── AgencyAuditLog[] (histórico de ações)

SuperAdmin (separado — não é tenant)
  └── Acessa AgencyAuditLog (para super-admin audit)
```

### Regras do Schema

1. Toda tabela de dados de tenant tem `agencyId UUID NOT NULL` + `@@index([agencyId])`
2. Soft delete via `isActive Boolean @default(true)` — nunca `DELETE` físico em produção
3. Credenciais sensíveis armazenadas SOMENTE em campos `*Enc` como JSON `{iv, authTag, data}`
4. UUIDs em todos os IDs primários (`@default(uuid()) @db.Uuid`)
5. `createdAt` e `updatedAt` em todas as tabelas

---

## 9. Billing e Planos

### 9.1 Planos

```prisma
enum AgencyPlan {
  TRIAL      // Grátis 14 dias — 2 clientes, 1 usuário, 2 integrações
  STARTER    // R$ 197/mês — 5 clientes, 2 usuários, 3 integrações
  PRO        // R$ 497/mês — 20 clientes, 10 usuários, todas integrações
  AGENCY     // R$ 997/mês — ilimitado
  ENTERPRISE // Sob consulta — ilimitado + SLA garantido
}
```

### 9.2 Enforcement de Limites (PlanGuard)

```typescript
// Antes de criar cliente: verificar maxClients
async checkClientLimit(agencyId: string): Promise<void> {
  const agency = await this.agencyRepo.findById(agencyId);
  const clientCount = await this.clientRepo.countByAgency(agencyId);
  if (clientCount >= agency.maxClients) {
    throw new PlanLimitExceededError('clients', agency.plan);
  }
}
```

### 9.3 Integração Stripe (Fase 2)

```
Fluxo de assinatura:
1. Onboarding → Stripe Checkout Session (trial_period_days: 14)
2. Trial expira → cobrança automática
3. Falha de pagamento → webhook `invoice.payment_failed`
   → email de alerta → após 3 tentativas → suspender agência
4. Cancelamento → webhook `customer.subscription.deleted`
   → revogar acesso + manter dados por 30 dias

Webhooks implementados:
- customer.subscription.created  → ativa agência
- customer.subscription.updated  → atualiza plano/limites
- customer.subscription.deleted  → suspende agência
- invoice.payment_failed         → notifica e inicia grace period
- invoice.payment_succeeded      → confirma pagamento
```

---

## 10. Storage de Assets

### 10.1 Estratégia por Ambiente

| Ambiente | Solução | Motivo |
|----------|---------|--------|
| Desenvolvimento | Upload local (`public/uploads`) | Sem dependências externas |
| Produção | Cloudflare R2 (S3-compatible) | Sem egress fees, CDN global |
| Futuro | Cloudflare Images | Transformações automáticas |

### 10.2 Estrutura do Bucket R2

```
trax-assets/
  agencies/{agencyId}/
    logo.{ext}           ← Logo da agência (max 2MB)
    favicon.{ext}        ← Favicon (max 500KB)
  clients/{clientId}/
    logo.{ext}
  reports/{reportId}/
    export.pdf           ← Export gerado
  uploads/{agencyId}/    ← Uploads avulsos
```

### 10.3 Regras de Upload

- Apenas `AGENCY_ADMIN` pode fazer upload de assets da agência
- MIME types aceitos: `image/png`, `image/jpeg`, `image/svg+xml`, `image/webp`
- Limites: logos 2MB · favicons 500KB · uploads gerais 10MB
- URL pública imutável por hash de conteúdo (cache-friendly)
- Sanitização de nome do arquivo (slug-based, sem path traversal)

---

## 11. Email Transacional

### 11.1 Provedor: Resend

```typescript
// Remetente white-label (Fase 2 — por enquanto: noreply@traxsolucoes.com.br)
resend.emails.send({
  from: `${agency.name} <noreply@traxsolucoes.com.br>`,
  to: user.email,
  subject: 'Novo relatório disponível',
  html: reportPublishedTemplate({ agencyName, reportTitle, reportUrl }),
});
```

### 11.2 Templates

| Template | Gatilho | Destinatário |
|----------|---------|--------------|
| `welcome` | Novo usuário criado | Usuário novo |
| `report-published` | Relatório publicado | Usuários com `notifyReportPublished: true` |
| `share-link` | Link compartilhado | Email especificado pelo admin |
| `trial-ending` | 3 dias antes do trial expirar | AGENCY_ADMIN |
| `payment-failed` | Falha no pagamento Stripe | AGENCY_ADMIN |
| `password-reset` | Solicitação de reset | Usuário solicitante |
| `integration-error` | Erro de sync de integração | AGENCY_ADMIN |

---

## 12. Infraestrutura de Produção

### 12.1 Diagrama Completo

```
Usuário
  │
  ▼
Cloudflare (DNS Anycast + WAF + DDoS L3/L4/L7)
  │  Wildcard: *.traxsolucoes.com.br + domínios customizados
  │
  ▼
VPS Linux (Hetzner/DigitalOcean) — Docker Compose
  │
  ├── Caddy :443/:80
  │     ├── traxsolucoes.com.br       → trax-web (landing)
  │     ├── admin.traxsolucoes.com.br → trax-web (admin-panel)
  │     ├── api.traxsolucoes.com.br   → trax-api
  │     └── *.traxsolucoes.com.br     → trax-web (TLS on-demand)
  │
  ├── trax-web :3001 (Next.js)
  ├── trax-api :3000 (NestJS)
  ├── PostgreSQL :5432 (não exposto)
  └── Redis :6379 (não exposto)

Serviços externos:
  ├── Cloudflare R2 ← assets (logos, PDFs)
  ├── Resend        ← emails transacionais
  ├── Stripe        ← billing (Fase 2)
  └── Google/Meta   ← APIs de métricas
```

### 12.2 TLS para Domínios Customizados

```
Fluxo de provisão de certificado (Caddy + Let's Encrypt):
1. agência cadastra CNAME: relatorios.agencia.com → proxy.traxsolucoes.com.br
2. Primeiro request chega ao Caddy
3. Caddy verifica: GET /api/tls-verify?domain=relatorios.agencia.com
   → API retorna 200 se domínio está cadastrado na agência
4. Caddy solicita certificado via ACME (Let's Encrypt / ZeroSSL)
5. TLS ativo em segundos (sem intervenção manual)
```

### 12.3 Checklist de Deploy

```bash
# Pre-flight
- [ ] .env configurado com todos os segredos
- [ ] DNS: *.traxsolucoes.com.br → IP do servidor
- [ ] DNS: admin.traxsolucoes.com.br → IP do servidor
- [ ] DNS: api.traxsolucoes.com.br → IP do servidor

# Deploy
docker compose -f docker-compose.prod.yml up -d --build

# Pós-deploy
- [ ] https://traxsolucoes.com.br carrega landing
- [ ] https://admin.traxsolucoes.com.br/admin-panel/login funciona
- [ ] https://api.traxsolucoes.com.br/api/health retorna { status: "ok" }
- [ ] Login com super-admin funciona
- [ ] Subdomínio de agência existente carrega com TLS
- [ ] Logs sem erros: docker compose logs -f api
```

---

## 13. Super Admin Panel

### 13.1 Isolamento

- Interface separada: `admin.traxsolucoes.com.br/admin-panel`
- Autenticação própria: tabela `super_admins` (separada dos usuários de agência)
- Role: `SUPER_ADMIN` — identificado via `isSuperAdmin: true` na sessão NextAuth
- **Nunca** usa `TenantMiddleware` — queries diretas com `agencyId` explícito

### 13.2 Rotas da API

```
GET  /api/v1/admin/agencies            → lista todos os tenants com métricas
POST /api/v1/admin/agencies            → cria nova agência manualmente
GET  /api/v1/admin/agencies/:id        → detalhes do tenant
PATCH /api/v1/admin/agencies/:id       → bloquear/desbloquear, alterar plano
GET  /api/v1/admin/metrics             → MRR, churn, usuários ativos, relatórios
POST /api/v1/admin/auth/login          → login do super-admin (endpoint separado)
```

### 13.3 Audit de Super Admin

Todas as ações do Super Admin geram registro em `agency_audit_logs`:

```typescript
{
  actorType: 'SUPER_ADMIN',
  superAdminId: superAdmin.id,
  agencyId: targetAgency.id,
  action: 'UPDATE',
  entityType: 'AGENCY',
  description: `Plano alterado de PRO para AGENCY por ${superAdmin.email}`,
  ipAddress: request.ip,
}
```

---

## 14. Onboarding de Nova Agência

### 14.1 Fluxo Self-Service

```
1. Usuário acessa traxsolucoes.com.br/signup
2. Formulário: nome da agência + slug desejado + email + senha
3. GET /api/v1/onboarding/check-slug?slug={slug} → verifica disponibilidade
4. POST /api/v1/onboarding/agency → cria:
     - Agency (TRIAL, maxClients=2, maxUsers=1, trialEndsAt=now+14d)
     - User (AGENCY_ADMIN, emailVerifiedAt=null)
     - RefreshToken inicial
5. Email de boas-vindas enviado
6. Redirect para {slug}.traxsolucoes.com.br/login (novo portal)
7. Wizard de configuração inicial:
     a. Upload de logo
     b. Escolha de cores primária/secundária
     c. Convite de usuários adicionais
     d. Conectar primeira integração (GA4 ou Meta Ads)
```

### 14.2 Validações de Slug

```typescript
const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;
const RESERVED_SLUGS = ['www', 'api', 'admin', 'app', 'static', 'assets', 
                        'mail', 'smtp', 'ftp', 'cdn', 'media', 'trax'];

// Mínimo 3 chars, máximo 30
// Apenas letras minúsculas, números e hífens
// Não começa/termina com hífen
// Não é palavra reservada
// Único no banco (verificação em tempo real)
```

---

## 15. Integrações

### 15.1 Provedores Suportados

| Provider | Status | Autenticação | Métricas |
|----------|--------|-------------|---------|
| Meta Ads | ✅ | OAuth2 | Campanhas, adsets, conversões, CPL, ROAS |
| Google Analytics 4 | ✅ | OAuth2 | Sessões, usuários, conversões, receita |
| Google Ads | 🔄 Fase 2 | OAuth2 | Campanhas, keywords, CPC, CTR |
| TikTok Ads | 🔄 Fase 2 | OAuth2 | Vídeos, alcance, conversões |
| LinkedIn Ads | 🔄 Fase 2 | OAuth2 | Leads, impressões, CTR B2B |
| Nectar CRM | ✅ | API Key | Leads, oportunidades, funil |
| Custom | ✅ | API Key | Webhook de dados customizados |

### 15.2 Fluxo OAuth2 (Meta/Google)

```
1. AGENCY_ADMIN clica "Conectar Meta Ads"
2. Frontend → GET /api/v1/integrations/meta/oauth/start
3. API → redireciona para oauth.facebook.com/dialog/oauth
4. Usuário autoriza → callback para /api/v1/integrations/meta/oauth/callback
5. API → troca code por tokens → criptografa com AES-256-GCM
6. Armazena em Integration.credentialsEnc
7. Primeiro sync agendado (cron job)
```

### 15.3 Sync de Métricas

```typescript
// Cron job diário (00:30 por fuso horário do cliente)
@Cron('30 0 * * *')
async syncAllIntegrations() {
  const activeIntegrations = await this.integrationRepo.findAllActive();
  for (const integration of activeIntegrations) {
    await this.syncQueue.add('sync-integration', { integrationId: integration.id });
  }
}

// Worker processa individualmente (isolado por tenant)
async processSyncJob(integrationId: string) {
  const credentials = this.cryptoService.decrypt(integration.credentialsEnc);
  const metrics = await this.providerService.fetchMetrics(credentials, dateRange);
  await this.dailyMetricRepo.upsertBatch(integrationId, metrics);
}
```

---

## 16. Estratégia de Testes

### 16.1 Pirâmide de Testes

```
          ┌─────────────────────┐
          │    E2E Tests        │  Fluxos críticos (Playwright)
          │  (5% dos testes)    │
          ├─────────────────────┤
          │  Integration Tests  │  Controllers + DB (supertest + testcontainers)
          │  (20% dos testes)   │
          ├─────────────────────┤
          │    Unit Tests       │  Use Cases + Domain (jest + mocks)
          │  (75% dos testes)   │
          └─────────────────────┘
```

### 16.2 Cobertura Mínima

| Camada | Cobertura mínima | Ferramenta |
|--------|-----------------|-----------|
| Domain (Use Cases) | 80% | Jest |
| Infrastructure (Repositories) | 60% | Jest + Testcontainers |
| Controllers (integration) | Fluxos críticos | Supertest |
| Frontend (components) | Smoke tests | Vitest + RTL |
| E2E (fluxos) | Login, criar cliente, publicar relatório | Playwright |

### 16.3 Fluxos E2E Obrigatórios

1. **Onboarding**: cadastro de nova agência → login → wizard completo
2. **Auth**: login → refresh token → logout → redirect para /login
3. **Cliente**: criar → editar → conectar integração → criar relatório
4. **Relatório**: criar → publicar → acessar via share token (sem login)
5. **Super Admin**: login → listar agências → bloquear → desbloquear

---

## 17. Branches e Versionamento

```
main        ← produção (tag de versão, protegida, requer PR)
develop     ← integração (base para features)
feature/{ticket}-{descricao-curta}   ← nova funcionalidade
fix/{ticket}-{descricao-curta}       ← correção de bug
hotfix/{ticket}-{descricao-curta}    ← fix crítico direto em main
chore/{descricao}                     ← infra, deps, docs
```

**Fluxo de PR:**
1. Branch a partir de `develop`
2. PR para `develop`: 1 aprovação + CI verde (lint + testes + build)
3. Release: merge de `develop` → `main` via PR, tag `v{semver}`

**Conventional Commits:**
```
feat(module): short description
fix(module): what was broken and how it's fixed
chore(deps): upgrade prisma to 5.13
docs(api): document rate limiting behavior
perf(metrics): add Redis cache for daily aggregates
test(auth): add refresh token rotation tests
```

---

## 18. Decisões Arquiteturais (ADRs)

### ADR-001: Next.js em vez de Flutter Web

**Contexto:** O projeto iniciou com Flutter Web como frontend.  
**Decisão:** Migrado para Next.js 16 (App Router).  
**Motivo:** SEO nativo via Server Components, ecossistema React mais amplo para componentes de dashboard, DX mais rápida para web, menor bundle size.  
**Trade-off:** Perde reúso de código com app mobile (caso futuro).

### ADR-002: Multi-Tenancy por Domínio (não por Schema)

**Contexto:** Alternativas comuns são: schema por tenant, banco por tenant, ou row-level isolation.  
**Decisão:** Row-level isolation com `agencyId` em todas as tabelas.  
**Motivo:** Mais simples de operar, migrations únicas, menor custo de infra.  
**Risco mitigado:** `TenantMiddleware` + `TenantGuard` garantem isolamento por código.

### ADR-003: AES-256-GCM para Credenciais de Integração

**Contexto:** Credenciais OAuth (access_token, refresh_token) precisam ser armazenadas.  
**Decisão:** Criptografia simétrica AES-256-GCM com `ENCRYPTION_KEY` do ambiente.  
**Motivo:** Simples, seguro, auditável. KMS (AWS/GCP) pode ser introduzido na Fase 3.  
**Alternativa rejeitada:** Vault HashiCorp — overhead operacional alto para o estágio atual.

### ADR-004: Caddy em vez de Nginx

**Contexto:** Precisamos de TLS automático para domínios customizados de tenants.  
**Decisão:** Caddy com TLS on-demand.  
**Motivo:** Caddy provisiona certificados Let's Encrypt automaticamente por hostname, sem configuração manual. Suporte nativo a wildcard + on-demand TLS.  
**Trade-off:** Menos documentação que Nginx, menor comunidade.
