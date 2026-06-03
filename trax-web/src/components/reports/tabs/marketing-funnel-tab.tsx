'use client'

import { useEffect, useState, useCallback } from 'react'
import { AlertCircle, RefreshCw, TrendingUp, DollarSign, Users, Target } from 'lucide-react'
import { useApiClient } from '@/lib/api-client-browser'
import { useSharedApiClient } from '@/lib/shared-api-client'
import { reportMetricsPath } from '@/lib/report-metrics-path'

interface FunnelStage {
  id: string
  label: string
  value: number
  formato: 'currency' | 'number'
  taxaConversao: number | null
  cplParcial: number | null
}

interface MarketingFunnelMetrics {
  stages: FunnelStage[]
  kpis: {
    spend: number
    metaLeads: number
    rdLeads: number
    nectarContacts: number
    nectarSales: number
    nectarRevenue: number
    cplAdsToRd: number | null
    cplAdsToSale: number | null
    roas: number | null
  }
  hasData: boolean
}

interface Props {
  reportId: string
  periodStart?: string
  periodEnd?: string
  shareToken?: string
}

function fmtCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function fmtValue(stage: FunnelStage) {
  return stage.formato === 'currency' ? fmtCurrency(stage.value) : stage.value.toLocaleString('pt-BR')
}

export function MarketingFunnelTab({ reportId, periodStart, periodEnd, shareToken }: Props) {
  const authApi = useApiClient()
  const sharedApi = useSharedApiClient()
  const api = shareToken ? sharedApi : authApi

  const [metrics, setMetrics] = useState<MarketingFunnelMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (periodStart) params.set('startDate', periodStart)
      if (periodEnd) params.set('endDate', periodEnd)
      const qs = params.toString()
      const path = reportMetricsPath(reportId, 'marketing-funnel', shareToken)
      const data = await api.get<MarketingFunnelMetrics>(qs ? `${path}?${qs}` : path)
      setMetrics(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar funil')
    } finally {
      setLoading(false)
    }
  }, [api, reportId, shareToken, periodStart, periodEnd])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card p-4 animate-pulse h-16 border-[var(--color-border)]" />
        ))}
      </div>
    )
  }

  if (error || !metrics?.hasData) {
    return (
      <div className="card p-12 border-[var(--color-border)] text-center">
        <AlertCircle className="w-10 h-10 text-[var(--color-muted)] mx-auto mb-3" />
        <p className="font-medium text-[var(--color-foreground)]">Funil de marketing indisponível</p>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1 max-w-md mx-auto">
          {error || 'Vincule Meta/Google Ads e/ou CRM (RD Station, Nectar) e sincronize os dados.'}
        </p>
        <button
          onClick={fetchData}
          className="mt-4 text-sm text-[var(--color-primary)] hover:underline inline-flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" /> Tentar novamente
        </button>
      </div>
    )
  }

  const { stages, kpis } = metrics
  const numericStages = stages.filter((s) => s.formato === 'number' && s.value > 0)
  const maxVal = Math.max(...numericStages.map((s) => s.value), 1)

  return (
    <div className="space-y-6">
      <p className="text-sm text-[var(--color-muted-foreground)]">
        Jornada unificada: investimento em anúncios → leads → pipeline → vendas e receita.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-muted-foreground)] uppercase flex items-center gap-1">
            <DollarSign className="w-3 h-3" /> Investimento
          </p>
          <p className="text-xl font-bold mt-1">{fmtCurrency(kpis.spend)}</p>
        </div>
        <div className="card p-4 border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-muted-foreground)] uppercase flex items-center gap-1">
            <Users className="w-3 h-3" /> CPL → RD
          </p>
          <p className="text-xl font-bold mt-1">
            {kpis.cplAdsToRd != null ? fmtCurrency(kpis.cplAdsToRd) : '—'}
          </p>
        </div>
        <div className="card p-4 border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-muted-foreground)] uppercase flex items-center gap-1">
            <Target className="w-3 h-3" /> CPL → Venda
          </p>
          <p className="text-xl font-bold mt-1">
            {kpis.cplAdsToSale != null ? fmtCurrency(kpis.cplAdsToSale) : '—'}
          </p>
        </div>
        <div className="card p-4 border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-muted-foreground)] uppercase flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> ROAS
          </p>
          <p className="text-xl font-bold mt-1 text-emerald-400">
            {kpis.roas != null ? `${kpis.roas.toFixed(2)}x` : '—'}
          </p>
        </div>
      </div>

      <div className="card p-6 border-[var(--color-border)] space-y-4">
        <h3 className="text-sm font-semibold text-[var(--color-foreground)]">Estágios do funil</h3>
        {stages.map((stage, i) => {
          const width =
            stage.formato === 'number' && stage.value > 0
              ? Math.max((stage.value / maxVal) * 100, 6)
              : stage.formato === 'currency' && stage.value > 0
                ? 100
                : 4
          return (
            <div key={stage.id}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                  {i + 1}. {stage.label}
                </span>
                <div className="flex items-center gap-3 text-xs">
                  {stage.taxaConversao != null && (
                    <span className="text-[var(--color-muted-foreground)]">
                      {stage.taxaConversao}% conv.
                    </span>
                  )}
                  {stage.cplParcial != null && (
                    <span className="text-blue-400">CPL {fmtCurrency(stage.cplParcial)}</span>
                  )}
                  <span className="text-sm font-bold text-[var(--color-foreground)]">
                    {fmtValue(stage)}
                  </span>
                </div>
              </div>
              <div className="h-9 bg-[var(--color-surface-2)] rounded-lg overflow-hidden">
                <div
                  className="h-full rounded-lg transition-all duration-500 flex items-center px-3 text-xs font-medium text-white"
                  style={{
                    width: `${width}%`,
                    background: i === 0 ? '#6366F1' : i === stages.length - 1 ? '#10B981' : 'var(--color-primary)',
                    minWidth: '2.5rem',
                  }}
                >
                  {stage.formato === 'number' ? stage.value.toLocaleString('pt-BR') : ''}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
