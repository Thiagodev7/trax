# Meta (Facebook) — Setup do App e variáveis

Integrações cobertas: **Meta Ads**, **Instagram Business**, **Facebook Page**.

## 1. Criar app no Meta for Developers

1. Acesse [developers.facebook.com](https://developers.facebook.com/) → **Meus apps** → **Criar app**.
2. Tipo: **Business** (acesso a Marketing API e páginas).
3. Anote **App ID** e **App Secret** (Configurações → Básico).

## 2. Produtos e permissões

No painel do app **Trax**, em **Adicionar casos de uso** / produtos, inclua pelo menos:

| Caso de uso | Uso no Trax |
|-------------|-------------|
| **Marketing API** (ou gerenciar anúncios) | Meta Ads |
| **Facebook Login** | OAuth |
| **Gerenciar Página** (opcional) | Facebook Page + Instagram via Page |

O Trax pede escopos **por tipo** de integração (não mistura Instagram com Ads no mesmo login):

| Integração | Escopos OAuth |
|------------|----------------|
| Meta Ads | `ads_read`, `ads_management`, `business_management` |
| Instagram / Facebook Page | `pages_show_list`, `pages_read_engagement` |

**Erro "Invalid Scopes: instagram_basic, read_insights"?** — versões antigas do Trax pediam permissões que seu app não tem habilitadas. Atualize o código e conecte de novo com `scopeGroup=ads` para Meta Ads.

Não use escopos deprecados (`read_insights`, `instagram_basic` no dialog genérico) até configurar o caso de uso Instagram no app Meta e passar por App Review.

## 3. OAuth — URLs de redirect

Devem coincidir **exatamente** com `META_REDIRECT_URI`:

| Ambiente | URI típica |
|----------|------------|
| Local | `http://localhost:3000/api/v1/integrations/meta/callback` |
| Produção | `https://api.SEUDOMINIO.com.br/api/v1/integrations/meta/callback` |

Em **Facebook Login → Configurações → URIs de redirecionamento OAuth válidos**, cadastre a mesma URL.

Domínios do app (dev): `localhost`, `agenciademo.localhost`, etc.

## 4. Variáveis no `.env`

```bash
META_APP_ID=
META_APP_SECRET=
# Opcional — padrão: {API_PUBLIC_URL}/api/v1/integrations/meta/callback
META_REDIRECT_URI=http://localhost:3000/api/v1/integrations/meta/callback
```

## 5. Fluxo no Trax

1. Cliente → **Integrações** → Meta Ads / Instagram / Facebook Page → **Conectar com Meta**.
2. Callback troca `code` por token **long-lived (~60 dias)**.
3. Escolha Ad Account ou Página no modal.
4. **Sincronizar** (manual ou cron 3h). Renovação automática semanal via `MetaTokenRefreshService`.

## 6. Conta secundária (ex.: Rio Verde)

Crie **duas** integrações `META_ADS` no mesmo cliente, com `metadata.isSecondary: true` na secundária (via API ou config). O relatório agrega ambas; o botão **Atualizar** na tab Meta sincroniza todas as contas vinculadas.

## 7. Produção — System User (opcional)

Para tokens de longa duração sem depender do login de um usuário:

1. [Business Manager](https://business.facebook.com/) → **Configurações do negócio** → **Usuários do sistema**.
2. Gere token com permissões de ads + páginas.
3. Use esse token apenas se o fluxo OAuth da agência não for suficiente (avançado).

## 8. Troubleshooting

| Sintoma | Ação |
|---------|------|
| `META_APP_ID não configurado` | Preencher `.env` e reiniciar API |
| Integração `ERROR` + mensagem de token | **Reconectar** na lista de integrações |
| Rate limit 429 no sync | Aguardar; sync retenta automaticamente |
| Instagram sem dados | Conta deve ser **Profissional** e vinculada a uma **Page** |

Ver também: [integrations-tron-mapping.md](./integrations-tron-mapping.md).
