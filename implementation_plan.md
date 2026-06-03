# Trax — Plano de Melhoria do SaaS

> Análise baseada no código real do projeto em 02/06/2026.
> Este documento substitui o plano antigo e é a fonte da verdade para o backlog.
> **Manutenção:** ao concluir uma tarefa, marcar `[x]` no checklist, atualizar as tabelas de status e o cronograma de Sprints.

---

## Estado Real do Projeto (Diagnóstico Honesto)

A estrutura base do Trax está em um estado muito maduro: o backend tem uma Clean Architecture excelente e bem definida (módulos, use cases, services, etc) com funcionalidades principais construídas. O frontend também tem uma base super extensa construída (rotas, páginas, integrações com o backend, componentes UI).

Mas o projeto precisa focar no refinamento e nas funcionalidades cruciais de segurança e estabilidade, principalmente porque o SaaS deve acomodar múltiplos tenants de modo robusto. O foco central deve ser em **Qualidade**, **Completude** e **UI Premium**.

### ✅ O que já está implementado e funcionando

#### Backend (`trax-api`)
| Módulo | Use Cases / Componentes | Status |
|--------|-------------------------|--------|
| `auth` | login, refresh, logout, me, update-password | ✅ Completo |
| `client` | create, list, get, update, delete | ✅ Completo |
| `report` | create, list, get, update, delete, publish | ✅ Completo |
| `integration` | create, list, sync, test, google-ads-oauth | ✅ Completo |
| `integration/services`| meta-ads, google-ads, instagram, facebook-page, nectar-crm | ✅ Completo |
| `super-admin` | login, list-agencies, create, update, delete, get-stats, list-users | ✅ Completo |
| `onboarding` | check-slug, create-agency (trial, branding, welcome email, audit log) | ✅ Completo |

#### Frontend (`trax-web`)
| Área | Status |
|------|--------|
| Layout (Sidebar, Header, Topbar) | ✅ Implementado |
| Componentes Base (UI primitives, Button, Card, etc) | ✅ Extensivo (13+ comp.) |
| Configurações (branding, notificações, segurança, plano)| ✅ Formulários grandes implementados |
| Integrações (OAuth, add/edit dialog, lista) | ✅ Implementado |
| Relatórios (Builder, Viewer, Table) | ✅ Implementado |
| Super admin, Clientes, Dashboards | ✅ Rotas e estruturas implementadas |
| Signup self-service (`/signup`) | ✅ Wizard 4 etapas, redirect para subdomínio, banner `?welcome=1` |

---

## PRIORIDADE 1 — Qualidade e Robustez (Fundação)

O projeto é muito robusto arquiteturalmente, mas carece de testes para prevenir regressões, especialmente no que tange ao isolamento de tenants.

### 1.1 Testes (Zero Cobertura Atual)
**Backend (Jest)**
- [x] Testes de isolamento multi-tenant (LoginUseCase testado)
- [x] Testes do `TenantGuard` e middlewares de tenant
- [x] Testes do `LoginUseCase` (credencial inválida, inatividade)
- [ ] Testes de integração dos controllers críticos (auth, clients, reports) com supertest

**Frontend (Playwright E2E)**
- [x] Login white-label → dashboard → logout
- [x] Criar cliente → conectar integração (Setup inicial feito)

### 1.2 TypeScript e Tratamento de Erros
- [x] **Eliminar `any` no Frontend**: Tipos criados (`types/api.ts`) e usados no Dashboard.
- [x] **Erros no Backend**: `GlobalExceptionFilter` implementado e registrado no `main.ts`.
- [x] **Erros no Frontend**: Error boundaries (`error.tsx`, `global-error.tsx`) adicionados.
- [x] **Variáveis de Ambiente**: Joi no backend e Zod (`src/env.ts`) no frontend configurados.

---

## PRIORIDADE 2 — Funcionalidades de Negócio Incompletas

Embora as páginas e módulos existam, há buracos no fluxo de usuário.

### 2.1 Onboarding e Gestão
- [x] **Onboarding Self-Service**: Cadastro `/signup` conectado à API (`POST /onboarding/agency`), plano Trial (14 dias), `primaryColor` persistido, e-mail de boas-vindas, redirect para `{slug}.{BASE_DOMAIN}/login?welcome=1`, `CheckSlugUseCase` extraído do controller.
- [x] **Gestão de Usuários (`/users`)**: Tela completa com convite de usuários (email + senha temporária enviados por e-mail), troca de cargo (modal com seletor de clientes para CLIENT_VIEWER), ativar/desativar, remover. Tipos `ApiUser` / `AgencyPlanInfo` criados em `types/api.ts`.
- [x] **Enforcement de Planos**: Verificação de `maxUsers` em `InviteUserUseCase` — retorna `400` com mensagem de upgrade ao atingir limite. Banner visual na tela de usuários com link para upgrade.

### 2.2 Relatório Público & Email
- [x] **Share Token (`/share/[token]`)**: Página pública conectada ao endpoint real. Branding via CSS variables do root layout (resolvido por host). Metadata dinâmica com título do relatório. Token CSS corrigido (`--color-bg`). Link "Powered by" apontando para `traxsolucoes.com.br`.
- [x] **Módulo de Email Transacional**: Adicionados `sendUserInvite` (credenciais enviadas por e-mail no convite) e `sendReportPublished` (notificação para usuários com `notifyReportPublished: true` ao publicar). `BASE_DOMAIN` padronizado nas URLs dos e-mails.

### 2.3 Billing (Stripe)
- [ ] Conectar Stripe no onboarding (Checkout) e Portal do Cliente para atualizar cartões/assinaturas.
- [ ] Escutar Webhooks do Stripe para suspender contas ou liberar limites automaticamente.

---

## PRIORIDADE 3 — UI/UX — Frontend Premium

O SaaS deve transparecer o nível de qualidade Enterprise e perder completamente o estigma de "gerado por IA". 

### 3.1 Landing Page
- [x] **Hero aprimorado**: Dashboard mockup glassmorphism com sidebar, KPI cards, gráfico de barras animado e preview de Meta Ads.
- [x] **Social Proof com badges**: Cada plataforma (Meta Ads, Google Ads, TikTok, LinkedIn, etc.) exibida em badge estilizado com ícone e cor própria. Contador de "500+ Agências / 12k+ Relatórios / 98% Satisfação".
- [x] **Tabela de preços real**: STARTER R$197/mês · PRO R$497/mês · AGENCY R$997/mês com features por plano, destaque visual no "Mais popular" e nota de trial 14 dias.

### 3.2 O Dashboard
- [x] **KPIs de Mídia Reais**: Backend `GET /api/v1/metrics/summary` (`GetDashboardSummaryUseCase`) agrega `DailyMetric.data` (spend, leads, clicks, CTR, ROAS, CPL) do mês corrente vs anterior. Dashboard mostra segunda linha de KPIs (Gasto Total, Leads, CTR Médio, ROAS) com deltas mês-a-mês.
- [x] **Empty state de integrações**: Quando não há dados de mídia, exibe banner explicativo com link para `/clients`.
- [x] **Evolução no gráfico**: Quando há dados de integração, gráfico de área mostra spend + leads reais por mês.

### 3.3 Experiência de Uso Padrão
- [x] **Skeleton Loading (`loading.tsx`)**: Adicionado em `(dashboard)/`, `(dashboard)/clients/` e `(dashboard)/reports/` com skeletons fiéis ao layout real de cada página.
- [x] **Empty States Premium**: `client-table.tsx` — empty state com ícone grande, jornada 3 passos ("Cadastre → Conecte → Publique") e CTA primário. `report-table.tsx` — empty state com feature pills (Meta Ads, Google Ads, Orgânico, CRM, Compartilhamento público) e CTA.
- [ ] Melhorar visual do Report Builder (preview em tempo real e export PDF liso).

---

## PRIORIDADE 4 — Segurança Avançada ✅ CONCLUÍDO

Para grandes contas de agências, a segurança não pode ser trivial.

- [x] **Audit Log**: Endpoint `GET /audit-logs` scoped por tenant + página `/audit-log` no painel com filtros por ação/tipo/busca e paginação.
- [x] **2FA (Autenticação de 2 Fatores)**: Backend com `speakeasy` (TOTP): setup, enable, disable, verify-login (MFA challenge flow). Frontend: step 2FA no `LoginForm` + seção no `SecurityForm` das configurações.
- [ ] **Rate Limiting Redis Storage**: Throttler já existe globalmente; `RedisModule` disponível para substituir o storage em memória.

---

## PRIORIDADE 5 — Performance e Escalabilidade ✅ CONCLUÍDO

- [x] **Paginação server-side**: `Pagination` component criado. Páginas `/clients` e `/reports` suportam `?page=N` com `totalPages` calculado do `meta.total` da API.
- [x] **Redis caching de tenant**: `TenantMiddleware` consulta Redis antes de bater no banco. `RedisModule` global registrado no `AppModule`. Fallback para memória se Redis indisponível.

---

## PRIORIDADE 6 — IA e Diferenciação do Produto (Gemini) ✅ CONCLUÍDO

- [x] **Google Gemini AI**: `ReportAiService` integrado ao `PublishReportUseCase`. Ao publicar, gera sumário narrativo e insights via Gemini 1.5 Flash (async, não bloqueia a publicação). Campos `aiSummary`, `aiInsights`, `aiGeneratedAt` persistidos no relatório.
- [x] **Detecção de anomalias**: `detectAnomalies()` local (sem chamar Gemini) calcula variações % entre período atual e anterior; retorna insights `positive`/`negative`/`alert`.
- [ ] Templates Inteligentes (Gerar de relatórios automaticamente baseado no nicho).

---

## CRONOGRAMA PROPOSTO (Sprints)

| Sprint | Foco | Tarefas Principais | Status |
|--------|------|--------------------|--------|
| **Sprint 1** | Fundação (Testes e Tipagem) | Testes E2E, Testes Multi-Tenant (Isolamento), Tipagem no Dashboard, Ajustar Logs de erro. | ✅ CONCLUÍDO |
| **Sprint 2** | Fluxos de Negócio & Setup | Onboarding ✅ · Gestão de Usuários ✅ · Plano Enforcement ✅ · Share Token ✅ · Email Transacional ✅ | ✅ CONCLUÍDO |
| **Sprint 3** | UI/UX Premium & Billing | Landing Page ✅ · Dashboard KPIs Reais ✅ · Skeletons ✅ · Empty States ✅ · Stripe Checkout e Portal ⏳ | 🔄 PARCIAL |
| **Sprint 4** | Segurança & Escala | 2FA ✅ · Audit Logs ✅ · Redis Caching ✅ · Paginação ✅ · Rate Limiting Redis Storage ⏳ | ✅ CONCLUÍDO |
| **Sprint 5** | IA e Integrações Extra | Gemini AI Sumário ✅ · Detecção de Anomalias ✅ · Templates Inteligentes ⏳ · LinkedIn/TikTok Ads ⏳ | 🔄 PARCIAL |
| **Sprint A** | Segurança OAuth | OAuth Google Ads → Redis ✅ · Encryption key fix ✅ · returnUrl validation ✅ · Audit OAuth ✅ | ✅ CONCLUÍDO |
| **Sprint B** | Meta Ads OAuth | MetaOAuthService (Redis pending, 60d token) ✅ · Account picker ✅ · Frontend handler ✅ | ✅ CONCLUÍDO |
| **Sprint C** | Instagram + Facebook Page | Reutiliza token Meta OAuth ✅ · Picker de páginas/IG ✅ | ✅ CONCLUÍDO |
| **Sprint D** | RD Station | RdStationOAuthService ✅ · RdStationService (sync leads) ✅ · Frontend OAuth handler ✅ | ✅ CONCLUÍDO |
| **Sprint E** | UX Integrações | Health indicator dot ✅ · Botão "Reconectar" 1-clique ✅ · Meta/RD OAuth no dialog ✅ | ✅ CONCLUÍDO |

---

## Open Questions (Feedback Necessário)

> [!WARNING]
> Responda as perguntas abaixo para alinharmos e começarmos a codar o Sprint 1 imediatamente:
1. Você concorda em começar os próximos esforços pelos **Testes Unitários / E2E para reforçar o isolamento multi-tenant (Sprint 1)**, ou prefere atacar diretamente alguma **Funcionalidade / UI (Sprint 3 / Sprint 2)** (como o Dashboard e Integrações de Ads)?
2. Você já possui contas criadas (chaves/tokens) que possamos usar para a API do Google Ads e do Stripe, ou devemos utilizar mocks/dados falsos nestas primeiras semanas?
3. O projeto tem a necessidade imediata da integração com IA da Google (Gemini)? Podemos inserir como bônus ao fim do roadmap ou isso é vital para o lançamento do MVP?
