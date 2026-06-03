'use client'

import { Suspense, useState } from 'react'
import { GoogleAdsOAuthHandler } from './google-ads-oauth-handler'
import { MetaOAuthHandler } from './meta-oauth-handler'
import { RdStationOAuthHandler } from './rd-station-oauth-handler'
import {
  RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle,
  Trash2, Pencil, Plug, Zap, RotateCcw
} from 'lucide-react'
import { useApiClient } from '@/lib/api-client-browser'
import { toast } from 'sonner'
import { AddIntegrationDialog } from './add-integration-dialog'
import { EditIntegrationDialog } from './edit-integration-dialog'

export type IntegrationProvider =
  | 'META_ADS' | 'INSTAGRAM' | 'FACEBOOK_PAGE' | 'NECTAR_CRM'
  | 'GOOGLE_ADS' | 'GOOGLE_ANALYTICS' | 'TIKTOK_ADS' | 'LINKEDIN_ADS'
  | 'RD_STATION' | 'CUSTOM'

export type IntegrationStatus = 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'PENDING_AUTH'

export interface Integration {
  id: string
  provider: IntegrationProvider
  displayName: string | null
  status: IntegrationStatus
  metadata: Record<string, unknown> | null
  externalAccount: string | null
  lastSyncAt: string | null
  lastErrorMsg: string | null
  createdAt: string
  updatedAt: string
}

const PROVIDER_LABELS: Record<IntegrationProvider, string> = {
  META_ADS: 'Meta Ads',
  INSTAGRAM: 'Instagram',
  FACEBOOK_PAGE: 'Facebook Page',
  NECTAR_CRM: 'Nectar CRM',
  GOOGLE_ADS: 'Google Ads',
  GOOGLE_ANALYTICS: 'Google Analytics',
  TIKTOK_ADS: 'TikTok Ads',
  LINKEDIN_ADS: 'LinkedIn Ads',
  RD_STATION: 'RD Station',
  CUSTOM: 'Personalizado',
}

const PROVIDER_COLORS: Record<IntegrationProvider, string> = {
  META_ADS: '#1877F2',
  INSTAGRAM: '#E1306C',
  FACEBOOK_PAGE: '#1877F2',
  NECTAR_CRM: '#00C4B4',
  GOOGLE_ADS: '#4285F4',
  GOOGLE_ANALYTICS: '#F4B400',
  TIKTOK_ADS: '#000000',
  LINKEDIN_ADS: '#0077B5',
  RD_STATION: '#00A0E3',
  CUSTOM: 'var(--color-primary)',
}

const PROVIDER_ICONS: Record<IntegrationProvider, string> = {
  META_ADS: '📊',
  INSTAGRAM: '📸',
  FACEBOOK_PAGE: '📘',
  NECTAR_CRM: '🌿',
  GOOGLE_ADS: '🎯',
  GOOGLE_ANALYTICS: '📈',
  TIKTOK_ADS: '🎵',
  LINKEDIN_ADS: '💼',
  RD_STATION: '🚀',
  CUSTOM: '⚡',
}

/** Providers that support 1-click reconnect via OAuth */
const OAUTH_PROVIDERS = new Set<IntegrationProvider>(['GOOGLE_ADS', 'META_ADS', 'INSTAGRAM', 'FACEBOOK_PAGE', 'RD_STATION'])

function StatusBadge({ status }: { status: IntegrationStatus }) {
  const configs = {
    ACTIVE: { icon: <CheckCircle2 className="w-3 h-3" />, label: 'Ativo', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    ERROR: { icon: <XCircle className="w-3 h-3" />, label: 'Erro', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
    PENDING_AUTH: { icon: <Clock className="w-3 h-3" />, label: 'Aguardando', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    INACTIVE: { icon: <AlertTriangle className="w-3 h-3" />, label: 'Inativo', cls: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  }
  const { icon, label, cls } = configs[status]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {icon} {label}
    </span>
  )
}

interface Props {
  companyId: string
  initialIntegrations: Integration[]
}

export function IntegrationList({ companyId, initialIntegrations }: Props) {
  const [integrations, setIntegrations] = useState<Integration[]>(initialIntegrations)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [testing, setTesting] = useState<string | null>(null)
  const [reconnecting, setReconnecting] = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<Integration | null>(null)
  const api = useApiClient()

  async function handleSync(id: string) {
    setSyncing(id)
    try {
      const result = await api.post<{ synced: number }>(`/integrations/${id}/sync`, {})
      toast.success(`Sincronização concluída! ${result.synced} registros atualizados.`)
      setIntegrations((prev) =>
        prev.map((i) => i.id === id ? { ...i, status: 'ACTIVE', lastSyncAt: new Date().toISOString() } : i)
      )
    } catch (err: any) {
      toast.error(err.message || 'Erro ao sincronizar')
      setIntegrations((prev) =>
        prev.map((i) => i.id === id ? { ...i, status: 'ERROR' } : i)
      )
    } finally {
      setSyncing(null)
    }
  }

  async function handleTest(id: string) {
    setTesting(id)
    try {
      const result = await api.post<{ valid: boolean; name?: string }>(`/integrations/${id}/test`, {})
      if (result.valid) {
        toast.success(`Conexão válida${result.name ? ` — ${result.name}` : ''}!`)
        setIntegrations((prev) =>
          prev.map((i) => i.id === id ? { ...i, status: 'ACTIVE' } : i)
        )
      } else {
        toast.error('Credenciais inválidas ou expiradas.')
        setIntegrations((prev) =>
          prev.map((i) => i.id === id ? { ...i, status: 'ERROR' } : i)
        )
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao testar conexão')
    } finally {
      setTesting(null)
    }
  }

  async function handleReconnect(integration: Integration) {
    setReconnecting(integration.id)
    try {
      const returnUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/companies/${companyId}/integrations`
        : undefined
      const params = returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''

      let endpoint = ''
      if (integration.provider === 'GOOGLE_ADS') {
        endpoint = `/companies/${companyId}/integrations/google-ads/connect${params}`
      } else if (['META_ADS', 'INSTAGRAM', 'FACEBOOK_PAGE'].includes(integration.provider)) {
        const scopeGroup = integration.provider === 'META_ADS' ? 'ads' : 'instagram'
        endpoint = `/companies/${companyId}/integrations/meta/connect?scopeGroup=${scopeGroup}${returnUrl ? `&returnUrl=${encodeURIComponent(returnUrl)}` : ''}`
      } else if (integration.provider === 'RD_STATION') {
        endpoint = `/companies/${companyId}/integrations/rd-station/connect${params}`
      }

      if (!endpoint) { toast.error('Reconexão não suportada para este provider.'); return }
      const { url } = await api.get<{ url: string }>(endpoint)
      window.location.href = url
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao reconectar')
      setReconnecting(null)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remover integração "${name}"? Os dados sincronizados serão excluídos.`)) return
    try {
      await api.delete(`/integrations/${id}`)
      setIntegrations((prev) => prev.filter((i) => i.id !== id))
      toast.success('Integração removida.')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover')
    }
  }

  function handleAdded(integration: Integration) {
    setIntegrations((prev) => [...prev, integration])
  }

  function handleUpdated(integration: Integration) {
    setIntegrations((prev) => prev.map((i) => i.id === integration.id ? integration : i))
    setEditTarget(null)
  }

  return (
    <div className="space-y-4">
      <Suspense fallback={null}>
        <GoogleAdsOAuthHandler companyId={companyId} onIntegrationAdded={handleAdded} />
        <MetaOAuthHandler companyId={companyId} onIntegrationAdded={handleAdded} />
        <RdStationOAuthHandler companyId={companyId} onIntegrationAdded={handleAdded} />
      </Suspense>
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {integrations.length} integração{integrations.length !== 1 ? 'ões' : ''} configurada{integrations.length !== 1 ? 's' : ''}
        </p>
        <AddIntegrationDialog companyId={companyId} onAdded={handleAdded} />
      </div>

      {integrations.length === 0 ? (
        <div className="card p-12 border-dashed border-[var(--color-border)] text-center">
          <Plug className="w-10 h-10 text-[var(--color-muted)] mx-auto mb-3" />
          <p className="font-medium text-[var(--color-foreground)]">Nenhuma integração ainda</p>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1 mb-4">
            Conecte plataformas de marketing para sincronizar dados automaticamente.
          </p>
          <AddIntegrationDialog companyId={companyId} onAdded={handleAdded} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {integrations.map((integration) => {
            const label = integration.displayName || PROVIDER_LABELS[integration.provider]
            const color = PROVIDER_COLORS[integration.provider]
            const icon = PROVIDER_ICONS[integration.provider]
            const isSyncing = syncing === integration.id
            const isTesting = testing === integration.id
            const isReconnecting = reconnecting === integration.id
            const isError = integration.status === 'ERROR'
            const canReconnect = OAUTH_PROVIDERS.has(integration.provider)

            return (
              <div
                key={integration.id}
                className={`card p-5 transition-colors group ${
                  isError
                    ? 'border-red-500/40 hover:border-red-400/60'
                    : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/40'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 relative"
                      style={{ background: `${color}20`, border: `1px solid ${color}40` }}
                    >
                      {icon}
                      {/* Health indicator dot */}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--color-surface)] ${
                          integration.status === 'ACTIVE' ? 'bg-emerald-400' :
                          integration.status === 'ERROR' ? 'bg-red-400 animate-pulse' :
                          integration.status === 'PENDING_AUTH' ? 'bg-amber-400' :
                          'bg-slate-400'
                        }`}
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--color-foreground)] text-sm">{label}</p>
                      {integration.externalAccount && (
                        <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5 font-mono">
                          {integration.externalAccount}
                        </p>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={integration.status} />
                </div>

                {/* Meta */}
                <div className="space-y-1 mb-4">
                  <div className="text-xs text-[var(--color-muted-foreground)]">
                    {integration.lastSyncAt ? (
                      <>Última sync: {new Date(integration.lastSyncAt).toLocaleString('pt-BR')}</>
                    ) : (
                      'Nunca sincronizado'
                    )}
                  </div>
                  {isError && integration.lastErrorMsg && (
                    <p className="text-xs text-red-400 bg-red-500/10 rounded p-1.5 mt-1">
                      {integration.lastErrorMsg.slice(0, 120)}
                    </p>
                  )}
                </div>

                {/* Reconnect CTA when ERROR + OAuth */}
                {isError && canReconnect && (
                  <button
                    onClick={() => handleReconnect(integration)}
                    disabled={isReconnecting}
                    className="w-full mb-3 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all disabled:opacity-60"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isReconnecting ? 'animate-spin' : ''}`} />
                    {isReconnecting ? 'Redirecionando…' : 'Reconectar agora'}
                  </button>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleSync(integration.id)}
                    disabled={isSyncing}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90 transition-all disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Sincronizando…' : 'Sincronizar'}
                  </button>
                  <button
                    onClick={() => handleTest(integration.id)}
                    disabled={isTesting}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-foreground)] hover:border-[var(--color-primary)]/50 transition-all disabled:opacity-60"
                  >
                    <Zap className={`w-3 h-3 ${isTesting ? 'animate-pulse' : ''}`} />
                    {isTesting ? 'Testando…' : 'Testar'}
                  </button>
                  <div className="ml-auto flex items-center gap-1">
                    <button
                      onClick={() => setEditTarget(integration)}
                      className="p-1.5 rounded-md text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] transition-colors"
                      title="Editar integração"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(integration.id, label)}
                      className="p-1.5 rounded-md text-[var(--color-muted-foreground)] hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      title="Remover integração"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editTarget && (
        <EditIntegrationDialog
          integration={editTarget}
          onUpdated={handleUpdated}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  )
}
