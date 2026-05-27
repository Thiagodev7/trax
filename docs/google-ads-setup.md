# Google Ads — Configuração e validação

## Trax (OAuth)

1. Google Cloud: ativar **Google Ads API**, criar credenciais OAuth Web.
2. Redirect URI: `http://localhost:3000/api/v1/integrations/google-ads/callback` (ajustar em produção).
3. Preencher no `.env` da API:

```
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=
GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_LOGIN_CUSTOMER_ID=    # MCC, se aplicável
GOOGLE_ADS_REDIRECT_URI=
API_PUBLIC_URL=http://localhost:3000
WEB_APP_URL=http://localhost:3001
```

4. No Trax: Cliente → Integrações → Google Ads → **Conectar com Google** → escolher Customer ID → Sync.

## Tron (API direta)

No `meta_ads_config.env` (ou variáveis do ambiente):

```
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=
GOOGLE_ADS_REFRESH_TOKEN=
GOOGLE_ADS_CUSTOMER_ID=1234567890
GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_LOGIN_CUSTOMER_ID=
```

Rodar: `python update_dashboard.py` — injeta `GOOGLE_DATA` no `index.html`.

## Validação cruzada (mesmo customer_id e mês)

| Métrica | Trax (relatório) | Tron (aba Google) |
|---------|------------------|-------------------|
| Gasto | `summary.totalSpend` | `GOOGLE_DATA.kpis.spend` |
| Conversões | `summary.totalConversions` | `GOOGLE_DATA.kpis.conversions` |
| CPC | `summary.avgCpc` | `GOOGLE_DATA.kpis.avgCpc` |

Tolerância: arredondamento de centavos e delay de sync (Trax usa `DailyMetric` sincronizado; Tron busca ao vivo no script).
