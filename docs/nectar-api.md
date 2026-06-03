# Nectar CRM — Mapeamento de API (Trax)

> Spike de integração — base oficial: [Apiary](https://nectarcrm.docs.apiary.io/) e [Central de Ajuda](https://ajuda.nectarcrm.com.br/hc/pt-br/articles/5604437715475).

## Base URL e autenticação

| Item | Valor |
|------|--------|
| Base | `https://app.nectarcrm.com.br/crm/api/1` |
| Header | `Access-Token: {token}` (preferido) |
| Query (alternativo) | `?api_token={token}` |
| Legado Trax | `Authorization: Bearer` — mantido como fallback |

Token: Configurações → Integrações → API no Nectar.

## Endpoints usados pelo Trax

| Recurso | Método | Uso no sync |
|---------|--------|-------------|
| `/contatos` | GET | Listagem paginada (`page`, `displayLength`); filtro de data em memória via `dataCriacao` |
| `/oportunidades` | GET | Pipeline: abertas, ganhas, perdidas; receita; funil por status |
| `/pipelines` | GET | Etapas do funil (quando disponível) |

**Não usar** (não documentado na API v1 pública):

- `/negociacoes/resumo` — path legado do código inicial; substituído por agregação de `/oportunidades` + `/contatos`.

## Métricas persistidas (`DailyMetric`)

| metricType | entityId | Conteúdo |
|------------|----------|----------|
| `crm` | `summary` | Snapshot: pipeline, receita, funil, historicoMensal, byOrigin (somente se API retornar origem) |
| `nectar_daily` | `daily` | Contatos criados por dia no período |

## Limitações conhecidas

- `byOrigin` só é preenchido quando oportunidades/contatos trazem campo `origem` / UTM; não duplicar totais em "Meta Ads".
- Paginação máxima ~20 páginas × 100 registros por sync manual.
