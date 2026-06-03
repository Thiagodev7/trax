'use client'

import Link from 'next/link'
import { useState, useTransition, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ArrowLeft, Calendar, Building2, Globe, Share2, CheckCircle, Clock,
  Copy, ExternalLink, Pencil, BarChart3
} from 'lucide-react'
import { useApiClient } from '@/lib/api-client-browser'
import { useSharedApiClient } from '@/lib/shared-api-client'
import { reportMetricsPath } from '@/lib/report-metrics-path'
import { toast } from 'sonner'
import { MetaAdsTab } from './tabs/meta-ads-tab'
import { OrganicTab } from './tabs/organic-tab'
import { CalendarTab } from './tabs/calendar-tab'
import { KpiTab } from './tabs/kpi-tab'
import { GoogleAdsTab } from './tabs/google-ads-tab'
import { LinkedInAdsTab } from './tabs/linkedin-ads-tab'

type TabKey = 'META_ADS' | 'ORGANIC' | 'CALENDAR' | 'KPI' | 'GOOGLE_ADS' | 'LINKEDIN_ADS'

const TAB_META: Record<TabKey, { label: string; icon: string }> = {
  META_ADS: { label: 'Meta Ads', icon: '📊' },
  ORGANIC: { label: 'Orgânico', icon: '📸' },
  CALENDAR: { label: 'Calendário', icon: '📅' },
  KPI: { label: 'KPIs', icon: '📈' },
  GOOGLE_ADS: { label: 'Google Ads', icon: '🎯' },
  LINKEDIN_ADS: { label: 'LinkedIn Ads', icon: '💼' },
}

interface ModuleConfig {
  enabledTabs: TabKey[]
  defaultTab?: TabKey
}

interface Report {
  id: string
  title: string
  description?: string
  status: 'DRAFT' | 'PUBLISHED'
  periodStart: string
  periodEnd: string
  publishedAt: string | null
  createdAt: string
  shareToken: string | null
  moduleConfig: ModuleConfig | null
  layoutJson: unknown
  company: {
    id: string
    name: string
    logoUrl: string | null
    website?: string
  }
  integrations?: Array<{
    integration: { id: string; provider: string; status: string }
  }>
}

const EMPTY_TABS: TabKey[] = []

export function ReportViewer({ report, shareToken }: { report: Report; shareToken?: string }) {
  const isPublic = !!shareToken
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const authApi = useApiClient()
  const sharedApi = useSharedApiClient()
  const api = shareToken ? sharedApi : authApi

  const moduleConfig = report.moduleConfig
  const enabledTabs = useMemo<TabKey[]>(
    () => (moduleConfig?.enabledTabs?.length ? moduleConfig.enabledTabs : EMPTY_TABS),
    [moduleConfig?.enabledTabs],
  )

  const defaultTab = moduleConfig?.defaultTab ?? enabledTabs[0] ?? null
  const [activeTab, setActiveTab] = useState<TabKey | null>(defaultTab)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [metaSpend, setMetaSpend] = useState<number | undefined>(undefined)

  const periodStart = report.periodStart?.split('T')[0]
  const periodEnd = report.periodEnd?.split('T')[0]

  const fetchMetaSpend = useCallback(async () => {
    if (!enabledTabs.includes('KPI') && !enabledTabs.includes('META_ADS')) return
    try {
      const params = new URLSearchParams()
      if (periodStart) params.set('startDate', periodStart)
      if (periodEnd) params.set('endDate', periodEnd)
      const data = await api.get<{ summary: { totalSpend: number } | null }>(
        `${reportMetricsPath(report.id, 'meta-ads', shareToken)}?${params}`,
      )
      setMetaSpend(data.summary?.totalSpend)
    } catch {
      setMetaSpend(undefined)
    }
  }, [api, report.id, shareToken, periodStart, periodEnd, enabledTabs])

  useEffect(() => { fetchMetaSpend() }, [fetchMetaSpend])

  async function handlePublish() {
    try {
      await api.patch<unknown>(`/reports/${report.id}/publish`, {})
      toast.success('Relatório publicado! Compartilhe o link com a empresa.')
      startTransition(() => router.refresh())
    } catch (error: any) {
      toast.error(error.message || 'Erro ao publicar relatório')
    }
  }

  function handleCopyLink() {
    if (!report.shareToken) return
    const url = `${window.location.origin}/share/${report.shareToken}`
    navigator.clipboard.writeText(url)
    toast.success('Link copiado!')
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Report header */}
      <div className="flex items-start gap-4">
        {!isPublic && (
          <Link
            href="/reports"
            className="p-2 -ml-2 rounded-lg text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              {isPublic && report.company.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={report.company.logoUrl} alt={report.company.name} className="h-10 w-auto rounded border border-[var(--color-border)] mb-3" />
              )}
              <h2 className="text-2xl font-bold text-[var(--color-foreground)] tracking-tight leading-tight">
                {report.title}
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <div className="flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)]">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{report.company.name}</span>
                </div>
                {report.periodStart && report.periodEnd && (
                  <div className="flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {format(new Date(report.periodStart), "dd 'de' MMM", { locale: ptBR })} —{' '}
                      {format(new Date(report.periodEnd), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                    </span>
                  </div>
                )}
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    report.status === 'PUBLISHED'
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  }`}
                >
                  {report.status === 'PUBLISHED' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {report.status === 'PUBLISHED' ? (isPublic ? 'Relatório compartilhado' : 'Publicado') : 'Rascunho'}
                </span>
              </div>
              {report.description && (
                <p className="mt-3 text-sm text-[var(--color-muted-foreground)] max-w-2xl">{report.description}</p>
              )}
            </div>

            {/* Actions */}
            {!isPublic && (
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <Link
                href={`/reports/${report.id}/edit`}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--color-foreground)] bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface)] transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Editar Layout
              </Link>
              {report.status === 'DRAFT' && (
                <button
                  onClick={handlePublish}
                  disabled={isPending}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] rounded-lg hover:opacity-90 transition-all shadow-sm disabled:opacity-60"
                >
                  <Globe className="w-4 h-4" />
                  Publicar
                </button>
              )}
              {report.status === 'PUBLISHED' && report.shareToken && (
                <>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--color-foreground)] bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface)] transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Copiar Link
                  </button>
                  <a
                    href={`/share/${report.shareToken}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] rounded-lg hover:opacity-90 transition-all shadow-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ver Público
                  </a>
                </>
              )}
            </div>
            )}
          </div>
        </div>
      </div>

      {/* No tabs configured */}
      {enabledTabs.length === 0 && isPublic && (
        <div className="card p-12 border-[var(--color-border)] text-center">
          <BarChart3 className="w-10 h-10 text-[var(--color-muted)] mx-auto mb-3" />
          <p className="font-medium text-[var(--color-foreground)]">Relatório sem módulos configurados</p>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            Este relatório ainda não possui tabs habilitadas no editor.
          </p>
        </div>
      )}

      {enabledTabs.length === 0 && !isPublic && (
        <div className="card p-12 border-[var(--color-border)] border-dashed text-center">
          <BarChart3 className="w-10 h-10 text-[var(--color-muted)] mx-auto mb-3" />
          <p className="font-medium text-[var(--color-foreground)]">Nenhuma tab configurada</p>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1 mb-4">
            Configure as tabs e integrações no editor do relatório.
          </p>
          <Link
            href={`/reports/${report.id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-lg hover:opacity-90 transition-all"
          >
            <Pencil className="w-4 h-4" />
            Abrir Editor
          </Link>
        </div>
      )}

      {/* Tab bar */}
      {enabledTabs.length > 0 && (
        <>
          <div className="flex items-center gap-1 p-1 bg-[var(--color-surface-2)] rounded-xl border border-[var(--color-border)] overflow-x-auto">
            {enabledTabs.map((tab) => {
              const meta = TAB_META[tab]
              if (!meta) return null
              const isActive = activeTab === tab
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-sm'
                      : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
                  }`}
                >
                  <span>{meta.icon}</span>
                  {meta.label}
                </button>
              )
            })}
          </div>

          {/* Tab content */}
          <div>
            {activeTab === 'META_ADS' && (
              <MetaAdsTab reportId={report.id} periodStart={periodStart} periodEnd={periodEnd} shareToken={shareToken} />
            )}
            {activeTab === 'ORGANIC' && (
              <OrganicTab reportId={report.id} periodStart={periodStart} periodEnd={periodEnd} selectedDate={selectedDate} shareToken={shareToken} />
            )}
            {activeTab === 'CALENDAR' && (
              <CalendarTab
                reportId={report.id}
                periodStart={periodStart}
                periodEnd={periodEnd}
                selectedDate={selectedDate}
                onSelectDate={(d) => { setSelectedDate(d); if (d) setActiveTab('ORGANIC') }}
                companyId={isPublic ? undefined : report.company.id}
                shareToken={shareToken}
              />
            )}
            {activeTab === 'KPI' && (
              <KpiTab reportId={report.id} metaSpend={metaSpend} shareToken={shareToken} />
            )}
            {activeTab === 'GOOGLE_ADS' && (
              <GoogleAdsTab reportId={report.id} periodStart={periodStart} periodEnd={periodEnd} shareToken={shareToken} />
            )}
            {activeTab === 'LINKEDIN_ADS' && <LinkedInAdsTab />}
          </div>
        </>
      )}
    </div>
  )
}
