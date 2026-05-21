# Trax — Regras de Arquitetura & Decisões Técnicas

> Este documento é a fonte da verdade para decisões de arquitetura do projeto Trax.
> Toda contribuição ao codebase deve respeitar estas regras.

---

## 1. Visão Geral do Sistema

Trax é um **Micro-SaaS de Portal de Relatórios White-Label** para agências de marketing.
O diferencial técnico central é o **Multi-Tenancy com isolamento por `agencyId`** e o
**motor White-Label** que injeta identidade visual por subdomínio/domínio customizado.

```
Internet → Nginx/Reverse Proxy → trax-api (NestJS) ← PostgreSQL 16
                               → trax-web (Flutter Web)
Domínio: relatorios.agencia.com.br
          └─ Subdomínio resolve → agencyId → tema + banco
```

---

## 2. Multi-Tenancy — A Regra de Ouro

### 2.1 Identificação do Tenant

O tenant é identificado **exclusivamente pelo domínio/subdomínio** da requisição HTTP.
Nunca confiar em `agencyId` vindo do corpo da requisição ou de query params para decisões
de segurança.

```
Fluxo:
1. Request chega com Host: relatorios.agencia.com.br
2. TenantMiddleware extrai o hostname
3. Busca em cache (Map em memória → futuramente Redis) o agencyId
4. Cache miss → query no banco: SELECT id FROM agencies WHERE custom_domain = :host OR subdomain = :subdomain
5. agencyId injetado no TenantContext (AsyncLocalStorage)
6. Todos os repositories lêem agencyId do TenantContext — jamais do request body
```

### 2.2 Regra de Isolamento (Obrigatória)

**TODA query ao banco que acessa dados de tenant DEVE incluir `WHERE agencyId = ?`.**

```typescript
// ✅ CORRETO — agencyId vem do contexto, não do request
async findClients(): Promise<Client[]> {
  const agencyId = this.tenantContext.getAgencyId(); // AsyncLocalStorage
  return this.prisma.client.findMany({ where: { agencyId } });
}

// ❌ ERRADO — nunca confiar no agencyId do body/params
async findClients(@Body('agencyId') agencyId: string) {
  return this.prisma.client.findMany({ where: { agencyId } }); // INSECURE
}
```

### 2.3 Guard de Cross-Tenant

O `TenantGuard` valida que o `agencyId` do JWT bate com o `agencyId` resolvido pelo domínio.
Se divergirem → 403 Forbidden imediatamente.

### 2.4 Índices Compostos

Todo índice em tabelas de dados de tenant deve ser **composto** com `agencyId` primeiro:

```sql
-- Exemplo de índice eficiente para multi-tenant
CREATE INDEX idx_clients_agency ON clients(agency_id, id);
CREATE INDEX idx_reports_client ON reports(agency_id, client_id, created_at DESC);
```

---

## 3. Clean Architecture — trax-api (NestJS)

### 3.1 Camadas e Responsabilidades

```
┌─────────────────────────────────────────────┐
│  PRESENTATION (Controllers, DTOs, Guards)   │
│  → Valida input, chama Use Cases, formata   │
│    output. ZERO lógica de negócio.          │
├─────────────────────────────────────────────┤
│  APPLICATION (Use Cases / Services)         │
│  → Orquestra domínio. Um Use Case = uma     │
│    ação de negócio. Stateless.              │
├─────────────────────────────────────────────┤
│  DOMAIN (Entities, Repository Interfaces)   │
│  → Regras de negócio puras. SEM imports     │
│    de frameworks ou ORMs.                   │
├─────────────────────────────────────────────┤
│  INFRASTRUCTURE (Prisma, HTTP, Cache)       │
│  → Implementações concretas dos repos.      │
│    Detalhe de implementação.                │
└─────────────────────────────────────────────┘
```

### 3.2 Estrutura de Pasta por Módulo

```
src/modules/<nome>/
  presentation/
    <nome>.controller.ts     ← HTTP handlers
    dto/
      create-<nome>.dto.ts
      update-<nome>.dto.ts
  application/
    use-cases/
      create-<nome>.use-case.ts
      list-<nome>.use-case.ts
    services/
      <nome>.service.ts      ← orquestração complexa (opcional)
  domain/
    entities/
      <nome>.entity.ts       ← classe pura, sem decorators ORM
    repositories/
      <nome>.repository.ts   ← interface (abstract class)
  infrastructure/
    repositories/
      prisma-<nome>.repository.ts ← implementação com Prisma
  <nome>.module.ts
```

### 3.3 Regras de Dependência

- Controllers **NUNCA** importam Prisma diretamente.
- Use Cases **NUNCA** importam Controllers.
- Domain **NUNCA** importa Infrastructure.
- Injeção de dependência via token (`REPOSITORY_TOKEN`), não implementação concreta.

### 3.4 DTOs e Validação

- Todos os DTOs usam `class-validator` e `class-transformer`.
- `ValidationPipe` global com `whitelist: true, forbidNonWhitelisted: true`.
- DTOs de resposta usam `Expose()` do `class-transformer` para evitar over-fetching.

### 3.5 Tratamento de Erros

- Erros de domínio são classes customizadas (`AgencyNotFoundError`, `UnauthorizedTenantError`).
- `GlobalExceptionFilter` mapeia exceções de domínio para HTTP responses adequados.
- Nunca expor stack traces em produção.

---

## 4. Arquitetura de Features — trax-web (Flutter Web)

### 4.1 Estrutura por Feature

```
lib/features/<nome>/
  presentation/
    pages/           ← Widgets de tela completa (rotas)
    widgets/         ← Componentes reutilizáveis da feature
    controllers/     ← Riverpod Notifiers (estado da UI)
  domain/
    entities/        ← Classes Dart puras (sem fromJson/toJson)
    repositories/    ← Interfaces abstratas
    use_cases/       ← Lógica de negócio do cliente
  data/
    models/          ← DTOs com fromJson/toJson
    datasources/     ← Chamadas HTTP via Dio
    repositories/    ← Implementações concretas
```

### 4.2 Regras do Flutter Web

- **Riverpod** é o único gerenciador de estado permitido (`riverpod_generator` para providers).
- **Dio** para HTTP, com `TenantInterceptor` que injeta `X-Agency-Domain` em cada request.
- **go_router** para roteamento declarativo com guardas de autenticação.
- Proibido `setState` fora de widgets puramente locais (formulários simples).
- **Responsividade obrigatória**: breakpoints `mobile < 768px`, `tablet < 1200px`, `desktop`.

### 4.3 White-Label no Frontend

```
1. App inicia → lê window.location.hostname
2. Chama GET /api/tenant/resolve?domain=:hostname
3. Recebe { agencyId, primaryColor, secondaryColor, logoUrl, name }
4. Injeta no ThemeNotifier (Riverpod)
5. MaterialApp.router usa theme dinâmico
6. Logo carregada de URL remota com cache
```

### 4.4 Interceptor de Tenant (Dio)

```dart
// Todo request inclui o domínio atual para o backend resolver o tenant
class TenantInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    options.headers['X-Agency-Domain'] = Uri.base.host;
    super.onRequest(options, handler);
  }
}
```

---

## 5. Segurança

### 5.1 Autenticação

- **JWT** com `access_token` (15min) + `refresh_token` (7 dias, httpOnly cookie).
- Payload do JWT: `{ sub: userId, agencyId, role, iat, exp }`.
- O `agencyId` no JWT é validado contra o tenant do domínio a cada request.

### 5.2 Roles

| Role | Descrição |
|------|-----------|
| `AGENCY_ADMIN` | Gerencia clientes, usuários e configurações da agência |
| `AGENCY_VIEWER` | Visualiza relatórios de toda a agência (read-only) |
| `CLIENT_VIEWER` | Visualiza relatórios apenas do(s) seu(s) cliente(s) |

### 5.3 Rate Limiting

- `@nestjs/throttler` global: 100 req/min por IP.
- Endpoints de auth: 10 req/min por IP.

### 5.4 Segredos e Variáveis de Ambiente

- Nunca commitar `.env` — apenas `.env.example`.
- Segredos de integração (Google Ads, Meta) armazenados criptografados no banco (`aes-256-gcm`).

---

## 6. Convenções de Código

### 6.1 NestJS / TypeScript

- TypeScript estrito: `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`.
- Arquivos em `kebab-case.type.ts` (ex: `create-client.use-case.ts`).
- Classes em `PascalCase`, métodos e variáveis em `camelCase`.
- Proibido `any` — use `unknown` e type guards.

### 6.2 Flutter / Dart

- Arquivos em `snake_case.dart`.
- Classes em `PascalCase`.
- Providers gerados com `riverpod_generator` e `@riverpod` annotation.
- Cobertura mínima de testes unitários: 70% nos Use Cases.

---

## 7. Performance

### 7.1 Backend

- **Paginação obrigatória** em todos os endpoints de listagem (`cursor-based` para grandes volumes).
- **N+1 prevention**: usar `include` do Prisma com seletividade — nunca eager load desnecessário.
- **Índices**: revisão de `EXPLAIN ANALYZE` antes de qualquer PR com nova query.
- **Response compression**: `compression` middleware habilitado globalmente.

### 7.2 Frontend

- **Lazy loading** de rotas com `go_router`.
- Imagens do cliente carregadas com `cached_network_image`.
- **Build otimizada para Web**: `flutter build web --release --web-renderer canvaskit`.

---

## 8. Estrutura de Branches e Contribuição

```
main          ← produção (protegida)
develop       ← integração
feature/<ticket>-<descricao>
fix/<ticket>-<descricao>
```

- PRs para `develop` requerem 1 aprovação + CI verde.
- Mensagens de commit: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`).

---

## 9. Billing & Planos

### 9.1 Enum AgencyPlan

```prisma
enum AgencyPlan {
  TRIAL      // Grátis 14 dias (2 clientes, 1 usuário)
  STARTER    // R$ 197/mês (5 clientes, 2 usuários)
  PRO        // R$ 497/mês (20 clientes, 10 usuários)
  AGENCY     // R$ 997/mês (ilimitado)
  ENTERPRISE // Sob consulta (ilimitado + SLA)
}
```

### 9.2 Campos de Billing no modelo Agency

```prisma
plan                 AgencyPlan @default(TRIAL)
stripeCustomerId     String?    @unique
stripeSubscriptionId String?    @unique
maxClients           Int        @default(2)
maxUsers             Int        @default(1)
trialEndsAt          DateTime?
```

### 9.3 Integração Stripe (Fase 2)

- Checkout Session no onboarding com `trial_period_days: 14`
- Webhooks: `customer.subscription.created`, `invoice.payment_failed`, `customer.subscription.deleted`
- Portal de cliente: `stripe.billingPortal.sessions.create()`
- Guard `PlanGuard` verifica limites (`maxClients`, `maxUsers`) antes de criar recursos

---

## 10. Storage de Assets

### 10.1 Arquivos de Tenants (logos, favicons)

- **Desenvolvimento**: URLs externas (ex: Cloudinary CDN, placehold.co)
- **Produção**: Cloudflare R2 (compatível com S3, sem egress fees)

```
Estrutura do bucket:
  agencies/<agencyId>/logo.<ext>
  agencies/<agencyId>/favicon.<ext>
  clients/<clientId>/logo.<ext>
  reports/<reportId>/export.pdf
```

### 10.2 Regras de Upload

- Apenas `AGENCY_ADMIN` pode fazer upload de assets da agência
- Validação de MIME type (apenas `image/png`, `image/jpeg`, `image/svg+xml`, `image/webp`)
- Limite de tamanho: 2MB para logos, 500KB para favicons
- CDN URL retornada após upload (imutável por hash de conteúdo)

---

## 11. Email Transacional

### 11.1 Provedor: Resend (Fase 2)

```typescript
// Exemplo de envio
resend.emails.send({
  from: `${agency.name} <noreply@trax.app>`,
  to: user.email,
  subject: 'Novo relatório disponível',
  html: reportPublishedTemplate({ agencyName, reportTitle, reportUrl }),
});
```

### 11.2 Templates Previstos

| Template | Gatilho |
|----------|---------|
| `welcome` | Novo usuário criado |
| `report-published` | Relatório publicado pelo admin |
| `share-link` | Link de relatório compartilhado |
| `trial-ending` | 3 dias antes do trial expirar |
| `payment-failed` | Falha no pagamento Stripe |
| `password-reset` | Solicitação de reset de senha |

---

## 12. Infraestrutura de Produção

### 12.1 Diagrama

```
Cloudflare (DNS + WAF + DDoS)
  ↓
Railway / Render
  ├── trax-api (NestJS, auto-scale)
  ├── PostgreSQL (Railway managed ou Neon serverless)
  └── Redis (Upstash serverless)
  
Cloudflare R2 ← logos e assets dos tenants
Resend ← emails transacionais
Stripe ← billing
```

### 12.2 Variáveis de Ambiente Adicionais (Produção)

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend
RESEND_API_KEY=re_...
EMAIL_FROM_DOMAIN=trax.app

# Storage
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=trax-assets
R2_PUBLIC_URL=https://assets.trax.app
```

---

## 13. Super Admin Panel

### 13.1 Escopo

Interface separada em `admin.trax.app` para o dono do SaaS (não é um tenant).
Autenticação própria com `role: SUPER_ADMIN` em tabela separada.

### 13.2 Rotas

```
GET  /admin/agencies          → lista todos os tenants com MRR e status
POST /admin/agencies          → cria nova agência manualmente
GET  /admin/agencies/:id      → detalhes do tenant
PATCH /admin/agencies/:id     → bloquear/desbloquear, alterar plano
GET  /admin/metrics           → MRR, churn, usuários ativos, relatórios gerados
```

### 13.3 Isolamento

- Super Admin nunca acessa dados de tenant via TenantMiddleware
- Queries diretas com `agencyId` explícito — sem contexto de tenant
- Auditoria de todas as ações do Super Admin em tabela `admin_audit_logs`

---

## 14. Onboarding de Nova Agência

### 14.1 Fluxo Self-Service

```
1. GET /api/v1/onboarding/check-slug?slug=:slug → verifica disponibilidade
2. POST /api/v1/onboarding/agency → cria agência + admin user + trial
3. Envio de email de boas-vindas
4. Redirect para :<slug>.trax.app/setup (wizard de configuração)
5. Wizard: upload de logo → escolha de cores → convite de usuários → conectar integração
```

### 14.2 Validações de Slug

- Mínimo 3 caracteres, máximo 30
- Apenas letras minúsculas, números e hífens
- Não pode ser palavra reservada: `www`, `api`, `admin`, `app`, `static`, `assets`
- Único no banco (verificação em tempo real via endpoint público)

