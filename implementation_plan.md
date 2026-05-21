# Trax — Plano de Implementação Completo (SaaS White-Label)

## Visão Geral

**Trax** é um SaaS de Portal de Relatórios de Marketing White-Label. Cada agência-cliente tem sua própria URL (ex: `relatorios.agencia.com.br`), logo, cores e nome — com total isolamento de dados entre tenants.

**Stack atual:** NestJS (API) + Flutter Web (Frontend) + PostgreSQL + Redis + Docker

---

## Estado Atual do Projeto — Análise Honesta

### ✅ O que já existe e está bem-feito

| Área | Status | Qualidade |
|------|--------|-----------|
| Arquitetura Multi-Tenant (domínio → agencyId) | Definida no `.md` | ⭐⭐⭐⭐⭐ |
| Schema Prisma (Agency, Client, User, Integration, Report) | Completo | ⭐⭐⭐⭐⭐ |
| Segurança base (JWT, roles, rate limiting, helmet, CORS) | Configurada | ⭐⭐⭐⭐⭐ |
| Clean Architecture no backend (módulos agency, auth, client, report, tenant) | Estrutura criada | ⭐⭐⭐⭐ |
| White-label no Flutter (ThemeNotifier, whiteLabelControllerProvider) | Estrutura criada | ⭐⭐⭐⭐ |
| Docker Compose (Postgres 16 + Redis 7 + PgAdmin) | Funcionando | ⭐⭐⭐⭐⭐ |
| Monorepo com scripts npm para tudo | Funcionando | ⭐⭐⭐⭐ |

### ❌ Gaps Críticos Identificados

1. **Backend — Implementação real dos módulos**: Os módulos existem como estrutura de pastas, mas os Use Cases, Controllers e Repositories precisam ser **implementados de fato**.
2. **Integração com plataformas de anúncios**: Google Ads, Meta Ads, etc. — apenas o enum existe no schema, sem nenhum conector funcional.
3. **Motor de relatórios**: O `layoutJson` existe no schema, mas nenhum builder/renderer de relatório foi implementado.
4. **UI Flutter**: Features existem como diretórios, mas as telas reais precisam ser construídas.
5. **Billing/Planos**: Sem sistema de assinatura, sem Stripe, sem controle de planos.
6. **Super Admin Panel**: Nenhuma interface para gerenciar os tenants (agências) do SaaS em si.
7. **Onboarding de agências**: Sem fluxo de cadastro self-service de novas agências.
8. **Share público de relatórios**: `shareToken` existe no schema, mas sem implementação.
9. **Notificações**: Sem alertas por email, sem notificações in-app.
10. **CI/CD e Infra de produção**: Sem pipeline automatizado, sem configuração de deploy.

---

## Funcionalidades para um SaaS que Vende Muito

> [!IMPORTANT]
> O plano abaixo foi organizado em **3 fases**. A Fase 1 é o MVP que já pode ser vendido. As fases seguintes são o que diferencia de concorrentes e aumenta o LTV (lifetime value) dos clientes.

---

## Fase 1 — MVP Vendável (Foco: Funcionar + Ser Bonito)

### 1.1 Backend — Use Cases Core (trax-api)

#### [IMPLEMENT] Módulo `auth`
- `POST /api/v1/auth/login` — retorna `access_token` + seta `refresh_token` httpOnly cookie
- `POST /api/v1/auth/refresh` — renova tokens via cookie
- `POST /api/v1/auth/logout` — revoga refresh token
- `GET /api/v1/auth/me` — perfil do usuário logado

#### [IMPLEMENT] Módulo `tenant`
- `GET /api/v1/tenant/resolve?domain=:hostname` — resolve tema white-label pelo domínio (sem auth)
- Cache em Redis com TTL configurável

#### [IMPLEMENT] Módulo `agency`
- `GET /api/v1/agency/settings` — configurações da agência (para AGENCY_ADMIN)
- `PATCH /api/v1/agency/settings` — atualizar logo, cores, fontes

#### [IMPLEMENT] Módulo `client`
- CRUD completo de clientes (`/api/v1/clients`)
- `GET /api/v1/clients/:id` — detalhes com integrações ativas

#### [IMPLEMENT] Módulo `report`
- `POST /api/v1/reports` — criar relatório (DRAFT)
- `GET /api/v1/reports` — listar com paginação cursor-based
- `PATCH /api/v1/reports/:id/publish` — publicar (gera `shareToken`)
- `GET /api/v1/reports/shared/:shareToken` — acesso público sem login
- `GET /api/v1/reports/:id/preview` — preview com dados reais

---

### 1.2 Frontend Flutter — Telas Core

#### Tela de Login (por tenant)
- Logo + cores da agência carregadas dinamicamente
- Formulário com validação, loading state, erro amigável
- Design glassmorphism premium, animações de entrada

#### Dashboard Principal
- Cards de KPIs (impressões, cliques, conversões, ROAS, CPL)
- Gráficos de linha temporal (fl_chart)
- Lista de clientes com status de integração
- Widget de alertas e notificações

#### Gestão de Clientes
- Listagem com busca, filtros e paginação
- Formulário de cadastro/edição com upload de logo
- Status de integrações por cliente (badge colorido)

#### Visualizador de Relatórios
- Layout em blocos configurável (drag-and-drop suave)
- Widgets: KPI card, gráfico de linha, gráfico de barras, tabela de dados, mapa de calor
- Botão de "Compartilhar" que gera link público
- Modo de impressão/PDF

#### Configurações White-Label (AGENCY_ADMIN)
- Upload de logo e favicon
- Seletor de cor primária, secundária e de destaque
- Preview em tempo real das mudanças
- Configuração do domínio personalizado

---

### 1.3 Integrações — Fase 1 (Mock + Real)

#### Google Analytics 4 (GA4)
- OAuth2 flow via Google Identity
- Métricas: sessões, usuários, conversões, receita

#### Meta Ads (Facebook/Instagram)
- OAuth2 via Facebook Login
- Métricas: alcance, impressões, cliques, CPM, CTR, conversões

> [!NOTE]
> Na Fase 1, podemos implementar com dados mockados realistas para demonstração. As integrações reais entram na Fase 2 após validar o produto com clientes beta.

---

### 1.4 Super Admin Panel (Plataforma Trax)

Interface separada (ex: `admin.trax.app`) para o dono do SaaS:

- Dashboard com MRR, churn, número de agências ativas
- Listar/criar/bloquear agências (tenants)
- Configurar planos e limites
- Monitoramento de uso por tenant

---

## Fase 2 — Diferenciação e Retenção

### 2.1 Billing com Stripe
- Planos: **Starter** (2 clientes, 1 usuário), **Pro** (15 clientes, 5 usuários), **Agency** (ilimitado)
- Checkout embarcado no onboarding
- Portal de gestão de assinatura (Stripe Customer Portal)
- Webhooks para ativação/cancelamento automático
- Trial de 14 dias sem cartão

### 2.2 Integrações Avançadas
- **Google Ads**: campanhas, grupos de anúncios, palavras-chave, conversões
- **TikTok Ads**: vídeos, públicos, criativos
- **LinkedIn Ads**: campanhas B2B, geração de leads
- **Looker Studio / Data Studio**: importar relatórios prontos

### 2.3 Builder de Relatórios Visual (Drag-and-Drop)
- Editor estilo Notion/Canva para montar relatórios
- Templates pré-prontos por tipo de campanha (Search, Social, E-commerce)
- Agendamento automático de relatórios (PDF por email)
- Relatórios periódicos automáticos (semanal/mensal)

### 2.4 Client Portal (Portal do Cliente Final)
- URL de acesso direto para o cliente da agência
- Dashboard simplificado com os KPIs mais importantes
- Histórico de relatórios
- Chat/comentários no relatório

### 2.5 Notificações e Alertas
- Email transacional (Resend/SendGrid)
- Alertas de anomalias (queda de CTR, aumento de CPC)
- Notificação when relatório é publicado
- Lembretes de renovação de token de integração

---

## Fase 3 — Escala e IA

### 3.1 IA no Relatório (Gemini API)
- **Análise automática**: "Este mês, sua campanha teve um ROAS 23% abaixo da média. O principal motivo foi..."
- **Sugestão de otimização**: recomendações baseadas nos dados reais
- **Geração de texto de relatório**: narração automática dos resultados

### 3.2 White-Label Avançado
- App mobile (Flutter iOS/Android) com a marca da agência
- Domínio próprio sem manuais (DNS automático via Cloudflare API)
- Sub-subdomínios por cliente (`cliente1.relatorios.agencia.com.br`)

### 3.3 Marketplace de Templates
- Agências podem vender/compartilhar templates de relatório
- Templates segmentados por nicho (e-commerce, imobiliário, saúde)

---

## Arquitetura de Multi-Tenancy — Reforço e Melhorias

### Resolução de Domínio (já desenhada, precisa ser implementada)

```
1. Request: Host → relatorios.agencia.com.br
2. TenantMiddleware → Redis lookup (TTL: 5min)
3. Cache miss → Postgres: SELECT * FROM agencies WHERE custom_domain = $1 OR slug = $2
4. Resultado → AsyncLocalStorage (TenantContext)
5. Inject no Dio (Flutter): header X-Agency-Domain
```

### Novos campos sugeridos no schema

```prisma
model Agency {
  // Billing
  plan          AgencyPlan   @default(TRIAL)
  stripeCustomerId String?   @unique
  stripeSubscriptionId String? @unique
  maxClients    Int          @default(2)     // Limite por plano
  maxUsers      Int          @default(1)     // Limite por plano

  // Customização avançada
  customCss     String?      @db.Text       // CSS extra injetado
  supportEmail  String?                     // Email de suporte da agência
  reportFooter  String?      @db.Text       // Rodapé personalizado em relatórios
}

enum AgencyPlan {
  TRIAL
  STARTER
  PRO
  AGENCY
  ENTERPRISE
}
```

---

## Design System — UI Premium

### Paleta de Cores do Sistema Trax (Base)

Cada tenant sobrescreve com suas cores, mas o sistema tem defaults premium:

```
Primária padrão:   #6366F1 (Indigo vibrante)
Secundária padrão: #818CF8 (Indigo claro)
Destaque padrão:   #F59E0B (Amber)
Background dark:   #0F172A (Slate 900)
Card dark:         #1E293B (Slate 800)
Border:            #334155 (Slate 700)
```

### Componentes Visuais Obrigatórios

1. **KPI Card** — número grande, variação %, ícone, mini sparkline
2. **Metric Chart** — linha suave com gradiente, tooltip personalizado
3. **Status Badge** — ACTIVE/ERROR/PENDING com cores semânticas
4. **Agency Logo Header** — header com logo do tenant, nome e avatar do usuário
5. **Report Viewer** — layout de grid com blocos redimensionáveis
6. **Share Modal** — gerador de link com QR code
7. **Loading Skeleton** — shimmer em todos os dados async
8. **Empty State** — ilustração + CTA quando lista vazia
9. **Toast Notifications** — feedback de ações (sucesso/erro)
10. **Onboarding Steps** — wizard de configuração inicial

---

## Segurança — Checklist Completo

| Item | Status | Ação |
|------|--------|------|
| JWT (access 15min + refresh 7d httpOnly) | ✅ Definido | Implementar |
| Isolamento por agencyId em TODA query | ✅ Definido | Implementar com TenantGuard |
| Rate limiting global (100/min) + auth (10/min) | ✅ Definido | Implementar |
| Helmet (headers HTTP) | ✅ Implementado | OK |
| CORS configurado | ✅ Implementado | OK |
| Credenciais criptografadas AES-256-GCM | ✅ Definido | Implementar CryptoService |
| Validação de input com class-validator | ✅ Implementado | OK |
| Share token com expiração | ✅ No schema | Implementar |
| RBAC (AGENCY_ADMIN / AGENCY_VIEWER / CLIENT_VIEWER) | ✅ Definido | Implementar Guards |
| Auditoria de login (IP, UserAgent, lastLoginAt) | ✅ No schema | Implementar |
| Refresh token com rotação e revogação | ✅ No schema | Implementar |
| HTTPS obrigatório em produção | ❌ | Configurar nginx |
| SQL injection prevention | ✅ Prisma ORM | OK |
| XSS prevention | ✅ Helmet CSP | Verificar CSP |
| **Novo: 2FA (TOTP)** | ❌ | Fase 2 |
| **Novo: IP Allowlist por agência** | ❌ | Fase 2 |

---

## Estratégia de URL e Subdomínios

```
trax.app               → Landing page do SaaS
app.trax.app           → Super Admin Panel
<slug>.trax.app        → Portal da agência (subdomínio padrão)
relatorios.agencia.com → Portal da agência (domínio customizado)
```

### Configuração de DNS (documentar para clientes)

```
CNAME relatorios → proxy.trax.app
```

O reverse proxy (Nginx/Cloudflare Workers) lê o `Host` header e roteia para a API correta.

---

## Plano de Billing por Planos

| Plano | Preço sugerido | Clientes | Usuários | Integrações | Relatórios/mês |
|-------|---------------|----------|----------|-------------|----------------|
| **Trial** | Grátis 14 dias | 2 | 1 | 2 | 5 |
| **Starter** | R$ 197/mês | 5 | 2 | 3 | 20 |
| **Pro** | R$ 497/mês | 20 | 10 | Todas | Ilimitado |
| **Agency** | R$ 997/mês | Ilimitado | Ilimitado | Todas + API | Ilimitado |
| **Enterprise** | Sob consulta | Ilimitado | Ilimitado | Tudo + SLA | Ilimitado |

---

## Roadmap de Execução

### Sprint 1 (Semana 1-2): Fundação Backend
- [ ] Implementar `TenantMiddleware` + `TenantContext` (AsyncLocalStorage)
- [ ] Implementar `TenantGuard` + cross-tenant validation
- [ ] Implementar módulo `auth` completo (login, refresh, logout, me)
- [ ] Implementar `GET /tenant/resolve` com cache Redis
- [ ] Implementar CRUD completo de `clients`
- [ ] Implementar CRUD completo de `reports` + `shareToken`
- [ ] Implementar `CryptoService` (AES-256-GCM para credenciais)

### Sprint 2 (Semana 3-4): Frontend Core
- [ ] Tela de Login white-label com animações premium
- [ ] Dashboard com KPIs mockados e gráficos animados
- [ ] Tela de Clientes (listagem + CRUD)
- [ ] Tela de Configurações da Agência (cores, logo, domínio)
- [ ] Componentes reutilizáveis: KPI Card, Chart, Badge, Skeleton

### Sprint 3 (Semana 5-6): Relatórios + Share
- [ ] Builder de relatório básico (selecionar widgets)
- [ ] Visualizador de relatório publicado
- [ ] Link público com `shareToken` (sem login)
- [ ] Integração real com GA4 (OAuth2 + fetch de métricas)
- [ ] Integração real com Meta Ads

### Sprint 4 (Semana 7-8): Super Admin + Polish
- [ ] Super Admin Panel (`admin.trax.app`)
- [ ] Onboarding de nova agência (wizard)
- [ ] Testes E2E nos fluxos críticos
- [ ] Performance: Redis caching, response compression, índices
- [ ] Deploy em produção (VPS ou Railway + Cloudflare)

### Sprint 5+ (Fase 2)
- [ ] Billing com Stripe
- [ ] Integrações adicionais (Google Ads, TikTok, LinkedIn)
- [ ] Agendamento de relatórios por email
- [ ] Notificações e alertas de anomalias
- [ ] 2FA para AGENCY_ADMIN

---

## Infraestrutura de Produção Sugerida

```
Cloudflare (DNS + DDoS) → Railway/Render (API NestJS) → PostgreSQL (Neon/Railway)
                                                       → Redis (Upstash)
                        → Vercel/Netlify (Flutter Web build)
                        → S3/R2 (logos, assets dos tenants)
```

**Alternativa self-hosted:**
```
VPS (DigitalOcean/Hetzner) → Nginx → Docker Compose (API + Postgres + Redis)
                           → Certbot (SSL automático por domínio customizado)
```

---

## Perguntas para Revisão

> [!IMPORTANT]
> Responda estas perguntas para refinar o plano antes de executar:

1. **Billing agora ou depois?** — O Stripe pode ser deixado para Fase 2 sem problema. Faz sentido começar sem para focar no produto.

2. **Flutter Web ou Next.js?** — O projeto já usa Flutter Web (Dart). É uma escolha incomum para web (mais pesado, SEO limitado), mas permite reúso com mobile futuro. **Deseja manter Flutter ou migrar o frontend para Next.js?** Recomendo Next.js para web — SEO melhor, ecossistema maior, DX mais rápida.

3. **Integrações reais na Fase 1?** — GA4 e Meta Ads requerem aprovação de apps OAuth. No MVP podemos usar dados mockados realistas e implementar as integrações reais em paralelo.

4. **Super Admin Panel**: Deve ser na mesma codebase Flutter ou uma app separada (Next.js)?

5. **Domínio base**: Já tem `trax.app` ou vai usar outro domínio?

6. **Upload de logos dos tenants**: Usar storage próprio (S3/Cloudflare R2) ou um serviço gerenciado (Cloudinary)?

7. **Email transacional**: Resend (moderno, barato) ou SendGrid (mais robusto)?

---

## O que Precisa Mudar no `trax-architecture.md`

> [!NOTE]
> Sugestões de adição ao arquivo de arquitetura:

- Adicionar seção **Billing & Planos** (limites por plano, Stripe integration)
- Adicionar seção **Storage** (onde ficam os assets dos tenants)
- Adicionar seção **Email Service** (provedor, templates)
- Adicionar seção **Infraestrutura de Produção** (diagrama completo)
- Adicionar seção **Super Admin** (rotas, permissões separadas)
- Adicionar enum `AgencyPlan` ao schema
- Documentar o fluxo de onboarding de nova agência

