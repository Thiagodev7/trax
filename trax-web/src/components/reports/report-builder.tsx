'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Save, Calendar, Plug, ToggleLeft, ToggleRight,
  CheckSquare, Square, BarChart3, ImageIcon, CalendarDays, TrendingUp, Target
} from 'lucide-react'
import { useApiClient } from '@/lib/api-client-browser'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export type TabKey = 'META_ADS' | 'ORGANIC' | 'CALENDAR' | 'KPI' | 'GOOGLE_ADS' | 'LINKEDIN_ADS'

interface TabConfig {
  key: TabKey
  label: string
  icon: React.ElementType
  description: string
  requiresProvider?: string[]
}

const TAB_CONFIGS: TabConfig[] = [
  {
    key: 'META_ADS',
    label: 'Meta Ads',
    icon: Target,
    description: 'Campanhas, conjuntos, criativos, leads e gastos',
    requiresProvider: ['META_ADS'],
  },
  {
    key: 'ORGANIC',
    label: 'Orgânico',
    icon: ImageIcon,
    description: 'Instagram, Facebook — seguidores, alcance, posts',
    requiresProvider: ['INSTAGRAM', 'FACEBOOK_PAGE'],
  },
  {
    key: 'CALENDAR',
    label: 'Calendário',
    icon: CalendarDays,
    description: 'Calendário editorial com posts publicados',
    requiresProvider: ['INSTAGRAM', 'FACEBOOK_PAGE'],
  },
  {
    key: 'KPI',
    label: 'KPIs / CRM',
    icon: TrendingUp,
    description: 'Pipeline de vendas, receita, CAC, ROAS e LTV',
    requiresProvider: ['NECTAR_CRM'],
  },
  {
    key: 'GOOGLE_ADS',
    label: 'Google Ads',
    icon: BarChart3,
    description: 'Em breve — campanhas do Google Ads',
    requiresProvider: ['GOOGLE_ADS'],
  },
  {
    key: 'LINKEDIN_ADS',
    label: 'LinkedIn Ads',
    icon: BarChart3,
    description: 'Em breve — campanhas do LinkedIn',
    requiresProvider: ['LINKEDIN_ADS'],
  },
]

interface Integration {
  id: string
  provider: string
  displayName: string | null
  status: string
  externalAccount: string | null
}

interface ReportIntegration {
  integration: Integration
}

interface Report {
  id: string
  title: string
  description: string | null
  periodStart: string | null
  periodEnd: string | null
  moduleConfig: { enabledTabs: TabKey[]; defaultTab?: TabKey } | null
  integrations: ReportIntegration[]
  client: { id: string; name: string }
}

interface ClientIntegration {
  id: string
  provider: string
  displayName: string | null
  status: string
  externalAccount: string | null
}

interface Props {
  report: Report
  clientIntegrations: ClientIntegration[]
}

export function ReportBuilder({ report, clientIntegrations }: Props) {
  const router = useRouter()
  const api = useApiClient()
  const [isPending, startTransition] = useTransition()

  const [title, setTitle] = useState(report.title)
  const [description, setDescription] = useState(report.description ?? '')
  const [periodStart, setPeriodStart] = useState(
    report.periodStart ? report.periodStart.split('T')[0] : ''
  )
  const [periodEnd, setPeriodEnd] = useState(
    report.periodEnd ? report.periodEnd.split('T')[0] : ''
  )

  const currentConfig = report.moduleConfig ?? { enabledTabs: [], defaultTab: undefined }
  const [enabledTabs, setEnabledTabs] = useState<TabKey[]>(currentConfig.enabledTabs ?? [])
  const [defaultTab, setDefaultTab] = useState<TabKey | ''>(currentConfig.defaultTab ?? '')

  const currentIntegrationIds = report.integrations.map((ri) => ri.integration.id)
  const [selectedIntegrationIds, setSelectedIntegrationIds] = useState<string[]>(currentIntegrationIds)

  const activeProviders = clientIntegrations
    .filter((ci) => selectedIntegrationIds.includes(ci.id))
    .map((ci) => ci.provider)

  function toggleTab(key: TabKey) {
    setEnabledTabs((prev) =>
      prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]
    )
    if (defaultTab === key) setDefaultTab('')
  }

  function toggleIntegration(id: string) {
    setSelectedIntegrationIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  async function handleSave() {
    try {
      await api.patch(`/reports/${report.id}`, {
        title,
        description: description || undefined,
        periodStart: periodStart || undefined,
        periodEnd: periodEnd || undefined,
        integrationIds: selectedIntegrationIds,
        moduleConfig: {
          enabledTabs,
          defaultTab: (defaultTab || enabledTabs[0]) ?? undefined,
        },
      })
      toast.success('Relatório atualizado!')
      startTransition(() => router.refresh())
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar')
    }
  }

  const PROVIDER_ICONS: Record<string, string> = {
    META_ADS: '📊',
    INSTAGRAM: '📸',
    FACEBOOK_PAGE: '📘',
    NECTAR_CRM: '🌿',
    GOOGLE_ADS: '🎯',
    GOOGLE_ANALYTICS: '📈',
    TIKTOK_ADS: '🎵',
    LINKEDIN_ADS: '💼',
    CUSTOM: '⚡',
  }

  const PROVIDER_LABELS: Record<string, string> = {
    META_ADS: 'Meta Ads',
    INSTAGRAM: 'Instagram',
    FACEBOOK_PAGE: 'Facebook Page',
    NECTAR_CRM: 'Nectar CRM',
    GOOGLE_ADS: 'Google Ads',
    GOOGLE_ANALYTICS: 'Google Analytics',
    TIKTOK_ADS: 'TikTok Ads',
    LINKEDIN_ADS: 'LinkedIn Ads',
    CUSTOM: 'Personalizado',
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href={`/reports/${report.id}`}
          className="p-2 -ml-2 rounded-lg text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] transition-colors shrink-0 mt-0.5"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <p className="text-sm text-[var(--color-muted-foreground)]">{report.client.name}</p>
          <h2 className="text-2xl font-bold text-[var(--color-foreground)] tracking-tight">
            Editar Relatório
          </h2>
        </div>
      </div>

      {/* Basic Info */}
      <div className="card p-6 border-[var(--color-border)] space-y-4">
        <h3 className="text-sm font-semibold text-[var(--color-foreground)] uppercase tracking-wide">
          Informações Gerais
        </h3>
        <div>
          <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1.5 uppercase tracking-wide">
            Título
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1.5 uppercase tracking-wide">
            Descrição (opcional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1.5 uppercase tracking-wide">
              Período — Início
            </label>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1.5 uppercase tracking-wide">
              Período — Fim
            </label>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Integrations */}
      <div className="card p-6 border-[var(--color-border)] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--color-foreground)] uppercase tracking-wide flex items-center gap-2">
            <Plug className="w-4 h-4 text-[var(--color-primary)]" />
            Integrações Vinculadas
          </h3>
          <Link
            href={`/clients/${report.client.id}/integrations`}
            className="text-xs text-[var(--color-primary)] hover:underline"
          >
            Gerenciar integrações →
          </Link>
        </div>

        {clientIntegrations.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)] text-center py-4">
            Nenhuma integração configurada para este cliente.{' '}
            <Link href={`/clients/${report.client.id}/integrations`} className="text-[var(--color-primary)] hover:underline">
              Adicionar agora
            </Link>
          </p>
        ) : (
          <div className="space-y-2">
            {clientIntegrations.map((ci) => {
              const selected = selectedIntegrationIds.includes(ci.id)
              const isActive = ci.status === 'ACTIVE'
              return (
                <button
                  key={ci.id}
                  type="button"
                  onClick={() => toggleIntegration(ci.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                    selected
                      ? 'border-[var(--color-primary)]/60 bg-[var(--color-primary)]/5'
                      : 'border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-primary)]/30'
                  }`}
                >
                  <span className="text-xl">{PROVIDER_ICONS[ci.provider] ?? '⚡'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-foreground)]">
                      {ci.displayName || PROVIDER_LABELS[ci.provider] || ci.provider}
                    </p>
                    {ci.externalAccount && (
                      <p className="text-xs text-[var(--color-muted-foreground)] font-mono truncate">{ci.externalAccount}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {isActive ? 'Ativo' : ci.status}
                  </span>
                  {selected ? (
                    <CheckSquare className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-[var(--color-muted)] shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Tabs / Modules */}
      <div className="card p-6 border-[var(--color-border)] space-y-4">
        <h3 className="text-sm font-semibold text-[var(--color-foreground)] uppercase tracking-wide">
          Tabs Habilitadas
        </h3>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Selecione quais seções serão exibidas no relatório do cliente.
        </p>
        <div className="space-y-2">
          {TAB_CONFIGS.map((tab) => {
            const enabled = enabledTabs.includes(tab.key)
            const hasRequiredProvider =
              !tab.requiresProvider ||
              tab.requiresProvider.some((p) => activeProviders.includes(p))
            const Icon = tab.icon

            return (
              <div
                key={tab.key}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  enabled
                    ? 'border-[var(--color-primary)]/60 bg-[var(--color-primary)]/5'
                    : 'border-[var(--color-border)] bg-[var(--color-surface-2)]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleTab(tab.key)}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  <div className={`p-2 rounded-lg ${enabled ? 'bg-[var(--color-primary)]/20' : 'bg-[var(--color-surface)]'}`}>
                    <Icon className={`w-4 h-4 ${enabled ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)]'}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--color-foreground)]">{tab.label}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">{tab.description}</p>
                  </div>
                  {!hasRequiredProvider && (
                    <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full mr-2">
                      Sem dados
                    </span>
                  )}
                  {enabled ? (
                    <ToggleRight className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-[var(--color-muted)] shrink-0" />
                  )}
                </button>
                {enabled && (
                  <button
                    type="button"
                    onClick={() => setDefaultTab(tab.key)}
                    className={`text-xs px-2 py-1 rounded border transition-all ${
                      defaultTab === tab.key
                        ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/10'
                        : 'border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]/40'
                    }`}
                  >
                    {defaultTab === tab.key ? '★ Padrão' : 'Definir padrão'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center justify-between pb-8">
        <Link
          href={`/reports/${report.id}`}
          className="px-4 py-2 text-sm font-medium text-[var(--color-foreground)] bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface)] transition-colors"
        >
          Cancelar
        </Link>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 px-6 py-2 text-sm font-medium bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-lg hover:opacity-90 transition-all shadow-sm disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {isPending ? 'Salvando…' : 'Salvar Relatório'}
        </button>
      </div>
    </div>
  )
}
