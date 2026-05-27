'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import { useApiClient } from '@/lib/api-client-browser'
import { useSharedApiClient } from '@/lib/shared-api-client'
import { toast } from 'sonner'
import { getPublicApiV1Base } from '@/lib/api-base-url'
import { useSession } from 'next-auth/react'

import { PeriodToolbar, buildPeriod, type PeriodValue } from '../meta/period-toolbar'
import { FilterToolbar } from '../meta/filter-toolbar'
import { HeroRow } from '../meta/hero-row'
import { KpiGrid } from '../meta/kpi-grid'
import { AnnualSummary } from '../meta/annual-summary'
import { VerbaProdutoSection } from '../meta/verba-produto'
import { BudgetPacing } from '../meta/budget-pacing'
import { ChartsRow } from '../meta/charts-row'
import { FunnelInsights } from '../meta/funnel-insights'
import { CrmEmbed } from '../meta/crm-embed'
import { RioVerdeSection } from '../meta/rio-verde-section'
import { AdsetTable } from '../meta/adset-table'
import { CreativesCarousel } from '../meta/creatives-carousel'
import { AdsetDetailModal } from '../meta/adset-detail-modal'
import { CreativeDetailModal } from '../meta/creative-detail-modal'

import type {
  MetaMetricsResponse,
  CrmEmbed as CrmEmbedData,
  AdsetRow,
  CreativeRow,
  StatusFilter,
} from '../meta/types'

import { reportMetricsPath } from '@/lib/report-metrics-path'

interface Props {
  reportId: string
  periodStart?: string
  periodEnd?: string
  shareToken?: string
}

export function MetaAdsTab({ reportId, periodStart, periodEnd, shareToken }: Props) {
  const authApi = useApiClient()
  const sharedApi = useSharedApiClient()
  const api = shareToken ? sharedApi : authApi
  const { data: session } = useSession() as any
  const isPublic = !!shareToken

  const initialPeriod: PeriodValue = useMemo(() => {
    if (periodStart && periodEnd) return { key: 'custom', start: periodStart, end: periodEnd }
    return buildPeriod('month')
  }, [periodStart, periodEnd])

  const [period, setPeriod] = useState<PeriodValue>(initialPeriod)
  const [compare, setCompare] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [product, setProduct] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [campaign, setCampaign] = useState('all')

  const [metrics, setMetrics] = useState<MetaMetricsResponse | null>(null)
  const [crm, setCrm] = useState<CrmEmbedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

  const [selectedAdset, setSelectedAdset] = useState<AdsetRow | null>(null)
  const [selectedCreative, setSelectedCreative] = useState<CreativeRow | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        startDate: period.start,
        endDate: period.end,
      })
      if (campaign !== 'all') params.set('campaign', campaign)
      if (status !== 'all') params.set('status', status)
      if (product) params.set('product', product)
      if (stateFilter) params.set('state', stateFilter)
      if (search) params.set('search', search)

      const [data, crmData] = await Promise.all([
        api.get<MetaMetricsResponse>(`${reportMetricsPath(reportId, 'meta-ads', shareToken)}?${params.toString()}`),
        api.get<CrmEmbedData>(`${reportMetricsPath(reportId, 'crm', shareToken)}?origin=meta`).catch(() => null),
      ])
      setMetrics(data)
      setCrm(crmData)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar métricas')
    } finally {
      setLoading(false)
    }
  }, [api, reportId, shareToken, period.start, period.end, campaign, status, product, stateFilter, search])

  useEffect(() => { fetchData() }, [fetchData])

  const handleRefresh = useCallback(async () => {
    if (isPublic) {
      await fetchData()
      toast.success('Dados atualizados')
      return
    }
    if (!metrics?.accounts?.length) {
      fetchData()
      return
    }
    setSyncing(true)
    try {
      const primary = metrics.accounts.find((a) => !a.isSecondary) ?? metrics.accounts[0]
      await api.post(`/integrations/${primary.id}/sync`, {})
      toast.success('Sincronização disparada — atualizando dados…')
      await fetchData()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao sincronizar')
    } finally {
      setSyncing(false)
    }
  }, [api, metrics, fetchData, isPublic])

  const handleExport = useCallback((entity: 'adsets' | 'creatives' | 'daily') => {
    const params = new URLSearchParams({ startDate: period.start, endDate: period.end, entity })
    const url = `${getPublicApiV1Base()}${reportMetricsPath(reportId, 'meta-ads/export.csv', shareToken)}?${params.toString()}`
    const headers: Record<string, string> = {}
    if (session?.accessToken) headers['Authorization'] = `Bearer ${session.accessToken}`
    if (typeof window !== 'undefined') headers['X-Agency-Domain'] = window.location.hostname
    fetch(url, { headers })
      .then((r) => r.blob())
      .then((blob) => {
        const downloadUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `meta-ads-${entity}.csv`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(downloadUrl)
      })
      .catch(() => toast.error('Erro ao exportar CSV'))
  }, [period, reportId, shareToken, session])

  const campaignCodes = useMemo(() => {
    if (!metrics?.campaigns) return [] as string[]
    return Array.from(new Set(metrics.campaigns.map((c) => c.code))).filter(Boolean)
  }, [metrics?.campaigns])

  const monthOptions = useMemo(() => Object.keys(metrics?.monthlySummaries ?? {}), [metrics?.monthlySummaries])

  if (loading && !metrics) {
    return (
      <div className="space-y-4">
        <div className="h-12 animate-pulse bg-[var(--color-surface-2)] rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse bg-[var(--color-surface-2)] rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse bg-[var(--color-surface-2)] rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !metrics?.summary) {
    return (
      <div className="card p-10 border-[var(--color-border)] text-center">
        <AlertCircle className="w-10 h-10 text-[var(--color-muted)] mx-auto mb-3" />
        <p className="font-medium">{error || 'Nenhum dado Meta Ads sincronizado para este relatório.'}</p>
        <p className="text-xs text-[var(--color-muted-foreground)] mt-1 mb-3">
          Verifique a integração Meta Ads do cliente e execute uma sincronização.
        </p>
        <button onClick={fetchData} className="text-sm text-[var(--color-primary)] hover:underline inline-flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Tentar novamente
        </button>
      </div>
    )
  }

  const config = metrics.config

  return (
    <div className="space-y-4">
      <PeriodToolbar
        value={period}
        onChange={setPeriod}
        compare={compare}
        onCompareChange={setCompare}
        onRefresh={handleRefresh}
        onExport={handleExport}
        monthOptions={monthOptions}
        syncing={syncing}
      />

      <FilterToolbar
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        product={product}
        onProductChange={setProduct}
        state={stateFilter}
        onStateChange={setStateFilter}
        campaign={campaign}
        onCampaignChange={setCampaign}
        campaignCodes={campaignCodes}
        config={config}
      />

      {loading && metrics && (
        <div className="text-xs text-[var(--color-muted-foreground)] flex items-center gap-1.5">
          <Loader2 className="w-3 h-3 animate-spin" /> Atualizando…
        </div>
      )}

      <HeroRow
        summary={metrics.summary}
        previous={metrics.previousPeriodSummary}
        hierarchy={metrics.hierarchy}
        config={config}
        compare={compare}
      />

      <KpiGrid
        summary={metrics.summary}
        previous={metrics.previousPeriodSummary}
        trend={metrics.trendDaily}
        config={config}
        compare={compare}
      />

      {metrics.annualSummary && (
        <AnnualSummary annual={metrics.annualSummary} monthly={metrics.monthlySummaries} />
      )}

      {metrics.verbaProduto.products.length > 0 && (
        <VerbaProdutoSection data={metrics.verbaProduto} config={config} />
      )}

      <BudgetPacing items={metrics.budgetPacing} config={config} />

      <ChartsRow dailyData={metrics.dailyData} />

      <FunnelInsights
        summary={metrics.summary}
        adsets={metrics.adsetTable}
        creatives={metrics.creatives}
        config={config}
      />

      {crm?.pipeline && <CrmEmbed crm={crm} metaSummary={metrics.summary} />}

      {metrics.rioVerde && <RioVerdeSection data={metrics.rioVerde} config={config} />}

      <AdsetTable
        rows={metrics.adsetTable}
        config={config}
        onSelect={setSelectedAdset}
      />

      <CreativesCarousel
        creatives={metrics.creatives}
        config={config}
        onSelect={setSelectedCreative}
      />

      {selectedAdset && (
        <AdsetDetailModal
          reportId={reportId}
          adsetId={selectedAdset.id}
          startDate={period.start}
          endDate={period.end}
          config={config}
          shareToken={shareToken}
          onClose={() => setSelectedAdset(null)}
        />
      )}

      {selectedCreative && (
        <CreativeDetailModal
          creative={selectedCreative}
          config={config}
          onClose={() => setSelectedCreative(null)}
        />
      )}
    </div>
  )
}
