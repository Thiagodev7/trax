'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Plus, ChevronDown, Info, ExternalLink } from 'lucide-react'
import { useApiClient } from '@/lib/api-client-browser'
import { toast } from 'sonner'
import type { Integration, IntegrationProvider } from './integration-list'

interface GuideDef {
  title: string
  steps: string[]
  links?: { label: string; url: string }[]
}

const PROVIDERS: Array<{ value: IntegrationProvider; label: string; icon: string; fields: FieldDef[]; guide?: GuideDef; oauth?: boolean; metaOauth?: boolean; rdOauth?: boolean }> = [
  {
    value: 'META_ADS',
    label: 'Meta Ads',
    icon: '📊',
    fields: [],
    metaOauth: true,
    guide: {
      title: 'Conectar Meta Ads via OAuth',
      steps: [
        'Clique em "Conectar com Meta" para autorizar o acesso com sua conta Facebook.',
        'Selecione a conta de anúncios (Ad Account) que deseja vincular a este cliente.',
        'O token é salvo de forma segura e renovado automaticamente (válido por 60 dias).',
        'Para produção, recomendamos usar um System User no Business Manager para tokens permanentes.',
      ],
      links: [
        { label: 'Business Manager', url: 'https://business.facebook.com/' },
        { label: 'Gerenciador de Anúncios', url: 'https://adsmanager.facebook.com/' },
      ],
    },
  },
  {
    value: 'INSTAGRAM',
    label: 'Instagram',
    icon: '📸',
    fields: [],
    metaOauth: true,
    guide: {
      title: 'Conectar Instagram via OAuth Meta',
      steps: [
        'A conta Instagram precisa ser Profissional (Comercial ou Criador) e vinculada a uma Página do Facebook.',
        'Clique em "Conectar com Meta" — o mesmo token do Meta dá acesso ao Instagram Business.',
        'Após autorizar, selecione a Página do Facebook vinculada à conta Instagram.',
      ],
      links: [
        { label: 'Meta Business Suite', url: 'https://business.facebook.com/' },
      ],
    },
  },
  {
    value: 'FACEBOOK_PAGE',
    label: 'Facebook Page',
    icon: '📘',
    fields: [],
    metaOauth: true,
    guide: {
      title: 'Conectar Facebook Page via OAuth Meta',
      steps: [
        'Clique em "Conectar com Meta" para autorizar.',
        'Selecione a Página do Facebook que deseja monitorar.',
        'Métricas de engajamento, alcance e posts serão sincronizadas automaticamente.',
      ],
      links: [
        { label: 'Graph API Explorer', url: 'https://developers.facebook.com/tools/explorer/' },
      ],
    }
  },
  {
    value: 'NECTAR_CRM',
    label: 'Nectar CRM',
    icon: '🌿',
    fields: [
      { key: 'apiToken', label: 'API Token', placeholder: 'seu-token-nectar', type: 'password' },
      { key: 'baseUrl', label: 'Base URL (opcional)', placeholder: 'https://app.nectarcrm.com.br', type: 'text' },
    ],
    guide: {
      title: 'Como obter o token do Nectar CRM',
      steps: [
        'Acesse a sua conta no Nectar CRM.',
        'Vá em "Configurações" (ícone de engrenagem no menu lateral).',
        'Acesse a seção "Integrações" e depois "API".',
        'Gere ou copie o seu "Token de API". A "Base URL" costuma ser https://app.nectarcrm.com.br.'
      ]
    }
  },
  {
    value: 'RD_STATION' as IntegrationProvider,
    label: 'RD Station',
    icon: '🚀',
    fields: [],
    rdOauth: true,
    guide: {
      title: 'Conectar RD Station via OAuth',
      steps: [
        'Clique em "Conectar com RD Station" para autorizar o acesso à sua conta.',
        'Faça login na sua conta RD Station Marketing e autorize o aplicativo Trax.',
        'Leads, conversões e métricas serão sincronizados automaticamente.',
      ],
      links: [
        { label: 'RD Station Marketing', url: 'https://app.rdstation.com.br/' },
      ],
    },
  },
  {
    value: 'GOOGLE_ADS',
    label: 'Google Ads',
    icon: '🎯',
    fields: [],
    oauth: true,
    guide: {
      title: 'Conectar Google Ads',
      steps: [
        'Clique em "Conectar com Google" para autorizar o acesso à sua conta de anúncios.',
        'Após o login, escolha a conta Google Ads (Customer ID) que deseja vincular a este cliente.',
        'O Developer Token e credenciais OAuth ficam configurados no servidor Trax (variáveis de ambiente).',
      ],
      links: [
        { label: 'Google Cloud Console', url: 'https://console.cloud.google.com/' },
        { label: 'Central de API Google Ads', url: 'https://ads.google.com/aw/apicenter' },
      ],
    },
  },
]

interface FieldDef {
  key: string
  label: string
  placeholder: string
  type: 'text' | 'password'
}

type ProviderDef = (typeof PROVIDERS)[number]

interface Props {
  companyId: string
  onAdded: (integration: Integration) => void
}

export function AddIntegrationDialog({ companyId, onAdded }: Props) {
  const [open, setOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<ProviderDef | null>(null)
  const [connectingOAuth, setConnectingOAuth] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [externalAccount, setExternalAccount] = useState('')
  const [fields, setFields] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const api = useApiClient()

  function getReturnUrl() {
    return typeof window !== 'undefined'
      ? `${window.location.origin}/companies/${companyId}/integrations`
      : undefined
  }

  async function handleGoogleConnect() {
    setConnectingOAuth(true)
    try {
      const returnUrl = getReturnUrl()
      const params = returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''
      const { url } = await api.get<{ url: string }>(
        `/companies/${companyId}/integrations/google-ads/connect${params}`,
      )
      window.location.href = url
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao iniciar OAuth')
      setConnectingOAuth(false)
    }
  }

  async function handleMetaConnect() {
    setConnectingOAuth(true)
    try {
      const returnUrl = getReturnUrl()
      const params = new URLSearchParams({ scopeGroup: 'all' })
      if (returnUrl) params.set('returnUrl', returnUrl)
      const { url } = await api.get<{ url: string }>(
        `/companies/${companyId}/integrations/meta/connect?${params.toString()}`,
      )
      window.location.href = url
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao iniciar OAuth Meta')
      setConnectingOAuth(false)
    }
  }

  async function handleRdStationConnect() {
    setConnectingOAuth(true)
    try {
      const returnUrl = getReturnUrl()
      const params = returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''
      const { url } = await api.get<{ url: string }>(
        `/companies/${companyId}/integrations/rd-station/connect${params}`,
      )
      window.location.href = url
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao iniciar OAuth RD Station')
      setConnectingOAuth(false)
    }
  }

  function handleProviderSelect(p: ProviderDef) {
    setSelectedProvider(p)
    setFields({})
    setDisplayName('')
    setExternalAccount('')
  }

  function handleReset() {
    setSelectedProvider(null)
    setFields({})
    setDisplayName('')
    setExternalAccount('')
    setOpen(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProvider) return
    if (selectedProvider.oauth || selectedProvider.metaOauth || selectedProvider.rdOauth) return
    setLoading(true)
    try {
      const credentials: Record<string, string> = {}
      for (const f of selectedProvider.fields) {
        if (fields[f.key]) credentials[f.key] = fields[f.key]
      }
      const integration = await api.post<Integration>(`/companies/${companyId}/integrations`, {
        provider: selectedProvider.value,
        displayName: displayName || undefined,
        credentials,
        externalAccount: externalAccount || undefined,
      })
      toast.success(`Integração "${selectedProvider.label}" adicionada!`)
      onAdded(integration)
      handleReset()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar integração')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-lg hover:opacity-90 transition-all shadow-sm">
          <Plus className="w-4 h-4" />
          Adicionar Integração
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl data-[state=open]:animate-fade-in max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-lg font-bold text-[var(--color-foreground)]">
                {selectedProvider ? `Configurar ${selectedProvider.label}` : 'Adicionar Integração'}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-1.5 rounded-lg text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>

            {!selectedProvider ? (
              <div className="grid grid-cols-2 gap-3">
                {PROVIDERS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => handleProviderSelect(p)}
                    className="flex items-center gap-3 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-primary)]/60 hover:bg-[var(--color-surface)] transition-all text-left"
                  >
                    <span className="text-2xl">{p.icon}</span>
                    <span className="text-sm font-medium text-[var(--color-foreground)]">{p.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <button
                  type="button"
                  onClick={() => setSelectedProvider(null)}
                  className="text-xs text-[var(--color-primary)] hover:underline mb-2 inline-flex items-center gap-1"
                >
                  ← Voltar
                </button>

                {selectedProvider.guide && (
                  <div className="mb-4 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-blue-500" />
                      <h4 className="font-semibold text-sm text-[var(--color-foreground)]">
                        {selectedProvider.guide.title}
                      </h4>
                    </div>
                    <ol className="list-decimal list-inside space-y-1.5 text-xs text-[var(--color-muted-foreground)] mb-3">
                      {selectedProvider.guide.steps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                    {selectedProvider.guide.links && selectedProvider.guide.links.length > 0 && (
                      <div className="flex flex-wrap gap-3 mt-2">
                        {selectedProvider.guide.links.map((link, idx) => (
                          <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-500 hover:text-blue-400 transition-colors"
                          >
                            {link.label}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1.5 uppercase tracking-wide">
                    Nome de exibição (opcional)
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={`Ex: ${selectedProvider.label} — Conta Principal`}
                    className="w-full px-3 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                  />
                </div>

                {selectedProvider.oauth ? (
                  <div className="py-4">
                    <button
                      type="button"
                      onClick={handleGoogleConnect}
                      disabled={connectingOAuth}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium bg-white text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-60"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      {connectingOAuth ? 'Redirecionando…' : 'Conectar com Google'}
                    </button>
                  </div>
                ) : selectedProvider.metaOauth ? (
                  <div className="py-4">
                    <button
                      type="button"
                      onClick={handleMetaConnect}
                      disabled={connectingOAuth}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all disabled:opacity-60"
                      style={{ background: '#1877F2', color: '#fff' }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden>
                        <path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
                      </svg>
                      {connectingOAuth ? 'Redirecionando…' : 'Conectar com Meta'}
                    </button>
                    <p className="text-xs text-[var(--color-muted-foreground)] text-center mt-2">
                      Após autorizar, você escolherá qual conta conectar (Ads, Instagram ou Facebook Page).
                    </p>
                  </div>
                ) : selectedProvider.rdOauth ? (
                  <div className="py-4">
                    <button
                      type="button"
                      onClick={handleRdStationConnect}
                      disabled={connectingOAuth}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all disabled:opacity-60"
                      style={{ background: '#00A0E3', color: '#fff' }}
                    >
                      <span className="text-lg leading-none">🚀</span>
                      {connectingOAuth ? 'Redirecionando…' : 'Conectar com RD Station'}
                    </button>
                    <p className="text-xs text-[var(--color-muted-foreground)] text-center mt-2">
                      Você será redirecionado para autorizar o Trax na sua conta RD Station.
                    </p>
                  </div>
                ) : selectedProvider.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1.5 uppercase tracking-wide">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      value={fields[field.key] ?? ''}
                      onChange={(e) => setFields((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      autoComplete="off"
                      className="w-full px-3 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors font-mono"
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1.5 uppercase tracking-wide">
                    ID da Conta / Recurso Externo (opcional)
                  </label>
                  <input
                    type="text"
                    value={externalAccount}
                    onChange={(e) => setExternalAccount(e.target.value)}
                    placeholder="ex: act_1088579197977036"
                    className="w-full px-3 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors font-mono"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="flex-1 px-4 py-2 text-sm font-medium text-[var(--color-foreground)] bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface)] transition-colors"
                    >
                      Cancelar
                    </button>
                  </Dialog.Close>
                  {!selectedProvider.oauth && !selectedProvider.metaOauth && !selectedProvider.rdOauth && (
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 text-sm font-medium bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-lg hover:opacity-90 transition-all disabled:opacity-60"
                    >
                      {loading ? 'Salvando…' : 'Salvar Integração'}
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
