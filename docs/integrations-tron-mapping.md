# Mapeamento tron-dashboard → Trax

Referência para migrar credenciais e funcionalidades do [tron-dashboard](https://github.com/) para o Trax.

## Credenciais

| tron `.env` | Integração Trax | Campo no formulário |
|-------------|-----------------|---------------------|
| `META_ACCESS_TOKEN` | **META_ADS** | Access Token (somente o valor `EAA...`) |
| Conta `act_1088579197977036` (código) | **META_ADS** | Ad Account ID |
| Conta `act_250138776254796` (RV) | **META_ADS** (2ª integração) | Ad Account ID + nome "Rio Verde" |
| `IG_USER_ID` | **INSTAGRAM** | Instagram User ID |
| `FB_PAGE_ID` | **FACEBOOK_PAGE** | Page ID (+ Page Access Token) |
| Token Nectar (scripts Python) | **NECTAR_CRM** | API Token |

## Funcionalidades equivalentes

| tron-dashboard | Trax |
|----------------|------|
| Tab Meta Ads | Relatório → tab **Meta Ads** |
| Tab Orgânico | Relatório → tab **Orgânico** |
| Tab Calendário | Relatório → tab **Calendário** |
| KPIs CRM + Meta | Tab **KPIs** (CAC/ROAS com `metaSpend`) + bloco CRM na tab Meta |
| `_ROTEIROS` estáticos | [`editorial-scripts.ts`](../trax-web/src/lib/editorial-scripts.ts) + `moduleConfig.editorialScripts` |
| Agendamento posts (Vercel KV) | API `POST /clients/:id/scheduled-posts` + cron NestJS |
| `update_dashboard.py` batch | Sync integração + `DailyMetric` |
| `/api/data` live | Sync manual + cron 3h (live snapshot futuro) |

## Heurísticas de produto/estado

Portadas de `detectProduct()` e `detectStates()` do tron:

- Backend: [`meta-heuristics.ts`](../trax-api/src/common/utils/meta-heuristics.ts)
- Frontend: [`meta-heuristics.ts`](../trax-web/src/lib/meta-heuristics.ts)

Produtos: TGC, DP, Box, Ordix, QIAE, E-book, Institucional, Editorial.

## Setup recomendado no Trax

1. Cliente → Integrações:
   - Meta Ads (token + `act_...`)
   - Instagram (token + `IG_USER_ID`)
   - Facebook Page (Page token + `FB_PAGE_ID`)
   - Nectar CRM (se aplicável)
2. Relatório → vincular integrações → habilitar tabs: Meta Ads, Orgânico, Calendário, KPIs
3. Sincronizar cada integração
4. Abrir relatório e validar paridade com tron

## URLs locais

Ver [local-development.md](./local-development.md).
