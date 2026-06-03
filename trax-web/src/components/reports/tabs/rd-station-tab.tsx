'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  Users, TrendingUp, Star, Target, DollarSign, AlertCircle, RefreshCw, Zap, Info,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useApiClient } from '@/lib/api-client-browser'
import { useSharedApiClient } from '@/lib/shared-api-client'
import { reportMetricsPath } from '@/lib/report-metrics-path'

interface FunnelStage {
  etapa: string
  total: number
  cor: string
  taxaConversao: number | null
}

interface OfficialFunnel {
  available: boolean
  advancedRequired?: boolean
  unauthorized?: boolean
  referenceDay?: string
  stages: FunnelStage[]
}

interface TrendPoint {
  date: string
  leads: number
  qualifiedLeads: number
  customers: number
}

interface CplCruzado {
  spend: number
  leads: number
  cpl: number
}

interface RdMetrics {
  funil: FunnelStage[]
  officialFunnel: OfficialFunnel | null
  kpis: {
    totalLeads: number
    qualifiedLeads: number
    customers: number
    taxaQualificacao: number
    taxaConversao: number
    leads?: number
    enrichedDetailCount?: number
    officialLeads?: number
    officialQualified?: number
  }
  trend: TrendPoint[]
  conversionsTrend: Array<{ date: string; conversions: number }>
  topForms: Array<{ name: string; conversions: number }>
  cplCruzado: CplCruzado | null
  accountName: string | null
  syncedAt: string | null
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

function fmtPct(v: number) {
  return `${v.toFixed(1)}%`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function KpiCard({
  label, value, sub, icon: Icon, color = 'text-[var(--color-primary)]',
}: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  color?: string
}) {
  return (
    <div className="card p-5 border-[var(--color-border)]">
      <div className="flex justify-between items-start mb-3">
        <p className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wide">{label}</p>
        <div className={`p-2 rounded-lg bg-[var(--color-surface-2)] ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-[var(--color-foreground)] tracking-tight">{value}</p>
      {sub && <p className="text-xs text-[var(--color-muted-foreground)] mt-1">{sub}</p>}
    </div>
  )
}

function FunnelChart({ stages, title }: { stages: FunnelStage[]; title: string }) {
  if (stages.length === 0) return null
  const max = stages[0]?.total || 1

  return (
    <div className="card p-6 border-[var(--color-border)]">
      <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-5">{title}</h3>
      <div className="space-y-3">
        {stages.map((stage, i) => {
          const pct = (stage.total / max) * 100
          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                  {stage.etapa}
                </span>
                <div className="flex items-center gap-3">
                  {stage.taxaConversao !== null && (
                    <span className="text-xs text-[var(--color-muted-foreground)]">
                      {fmtPct(stage.taxaConversao)} conversão
                    </span>
                  )}
                  <span className="text-sm font-bold text-[var(--color-foreground)]">
                    {stage.total.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
              <div className="h-8 bg-[var(--color-surface-2)] rounded-lg overflow-hidden">
                <div
                  className="h-full rounded-lg flex items-center px-3 text-xs font-medium text-white transition-all duration-700"
                  style={{
                    width: `${Math.max(pct, 4)}%`,
                    background: stage.cor,
                    minWidth: '3rem',
                  }}
                >
                  {stage.total > 0 ? stage.total.toLocaleString('pt-BR') : '0'}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TrendChart({ data }: { data: TrendPoint[] }) {
  if (data.length === 0) return null
  const chartData = data.map((p) => ({
    date: fmtDate(p.date),
    'Leads': p.leads,
    'Qualificados': p.qualifiedLeads,
    'Clientes': p.customers,
  }))

  return (
    <div className="card p-6 border-[var(--color-border)]">
      <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-5">
        Evolução Diária de Leads (contatos sincronizados)
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="Leads" stroke="#3B82F6" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="Qualificados" stroke="#F59E0B" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="Clientes" stroke="#10B981" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function TopForms({ forms }: { forms: Array<{ name: string; conversions: number }> }) {
  if (forms.length === 0) return null
  const max = forms[0]?.conversions || 1

  return (
    <div className="card p-6 border-[var(--color-border)]">
      <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-5">
        Top Formulários / Origens (período)
      </h3>
      <div className="space-y-2.5">
        {forms.map((form, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-[var(--color-muted-foreground)] font-mono w-4 shrink-0 text-right">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-medium text-[var(--color-foreground)] truncate">
                  {form.name}
                </span>
                <span className="text-xs font-bold text-[var(--color-foreground)] ml-2 shrink-0">
                  {form.conversions}
                </span>
              </div>
              <div className="h-1.5 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${(form.conversions / max) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function RdStationTab({ reportId, periodStart, periodEnd, shareToken }: Props) {
  const { status: sessionStatus } = useSession()
  const authApi = useApiClient()
  const sharedApi = useSharedApiClient()
  const api = shareToken ? sharedApi : authApi

  const [metrics, setMetrics] = useState<RdMetrics | null>(null)
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
      const path = reportMetricsPath(reportId, 'rd-station', shareToken)
      const data = await api.get<RdMetrics>(qs ? `${path}?${qs}` : path)
      setMetrics(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar métricas RD Station')
    } finally {
      setLoading(false)
    }
  }, [api, reportId, shareToken, periodStart, periodEnd])

  useEffect(() => {
    if (shareToken) {
      fetchData()
      return
    }
    if (sessionStatus === 'loading') return
    if (sessionStatus === 'unauthenticated') {
      setLoading(false)
      setError('Sessão expirada. Faça login novamente.')
      return
    }
    fetchData()
  }, [fetchData, shareToken, sessionStatus])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse h-28 border-[var(--color-border)]">
              <div className="h-3 bg-[var(--color-surface-2)] rounded w-24 mb-4" />
              <div className="h-7 bg-[var(--color-surface-2)] rounded w-20" />
            </div>
          ))}
        </div>
        <div className="card p-6 animate-pulse h-48 border-[var(--color-border)]" />
        <div className="card p-6 animate-pulse h-64 border-[var(--color-border)]" />
      </div>
    )
  }

  if (error || !metrics?.hasData) {
    return (
      <div className="card p-12 border-[var(--color-border)] text-center">
        <AlertCircle className="w-10 h-10 text-[var(--color-muted)] mx-auto mb-3" />
        <p className="font-medium text-[var(--color-foreground)]">Dados RD Station não disponíveis</p>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1 max-w-sm mx-auto">
          {error || 'Sincronize a integração RD Station para visualizar leads, funil e origens.'}
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

  const {
    kpis, funil, officialFunnel, trend, conversionsTrend, topForms, cplCruzado, accountName, syncedAt,
  } = metrics
  const enriched = (kpis.enrichedDetailCount ?? 0) > 0
  const officialAvailable = officialFunnel?.available === true
  const showAdvancedBanner = officialFunnel?.advancedRequired === true

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-lg">🚀</span>
        <div>
          {accountName && (
            <p className="text-sm font-semibold text-[var(--color-foreground)]">{accountName}</p>
          )}
          {syncedAt && (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Sincronizado em {new Date(syncedAt).toLocaleDateString('pt-BR')}
              {periodStart && periodEnd && (
                <> · Período {periodStart} → {periodEnd}</>
              )}
            </p>
          )}
        </div>
        {officialAvailable && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Funil RD (API oficial)
          </span>
        )}
        {enriched ? (
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Dados enriquecidos (lifecycle)
          </span>
        ) : (
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Funil local via listagem
          </span>
        )}
      </div>

      {showAdvancedBanner && (
        <div className="card p-4 border-amber-500/30 bg-amber-500/5 flex gap-3">
          <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-[var(--color-foreground)]">
              Funil oficial RD indisponível
            </p>
            <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
              A API de analytics da RD Station exige plano Advanced. Os números abaixo usam contatos
              sincronizados no período do relatório.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label={officialAvailable ? 'Leads (RD oficial)' : 'Total de Leads'}
          value={kpis.totalLeads.toLocaleString('pt-BR')}
          sub={officialAvailable ? 'API analytics / funil' : 'Contatos no período'}
          icon={Users}
          color="text-blue-400"
        />
        <KpiCard
          label={officialAvailable ? 'Qualificados (RD oficial)' : 'Qualificados'}
          value={kpis.qualifiedLeads.toLocaleString('pt-BR')}
          sub={
            officialAvailable
              ? 'Alinhado ao painel RD'
              : `${fmtPct(kpis.taxaQualificacao)} dos leads`
          }
          icon={Star}
          color="text-amber-400"
        />
        <KpiCard
          label="Clientes (sync)"
          value={kpis.customers.toLocaleString('pt-BR')}
          sub={`${fmtPct(kpis.taxaConversao)} de conversão`}
          icon={Target}
          color="text-emerald-400"
        />
        <KpiCard
          label="Taxa de Qualificação"
          value={fmtPct(kpis.taxaQualificacao)}
          sub="leads → qualificados (local)"
          icon={TrendingUp}
        />
      </div>

      {cplCruzado && (
        <div className="card p-5 border-blue-500/30 bg-blue-500/5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Zap className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--color-foreground)] mb-1">
                CPL Cruzado — Custo por Lead Real
              </p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Investimento em anúncios (Meta + Google) dividido pelos leads
                {officialAvailable ? ' do funil oficial RD' : ' sincronizados no período'}
              </p>
              <div className="flex flex-wrap items-center gap-6 mt-3">
                <div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">Investido</p>
                  <p className="text-lg font-bold text-[var(--color-foreground)]">
                    {fmtCurrency(cplCruzado.spend)}
                  </p>
                </div>
                <div className="text-[var(--color-muted-foreground)]">÷</div>
                <div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">Leads</p>
                  <p className="text-lg font-bold text-[var(--color-foreground)]">
                    {cplCruzado.leads.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="text-[var(--color-muted-foreground)]">=</div>
                <div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">CPL</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {fmtCurrency(cplCruzado.cpl)}
                  </p>
                </div>
              </div>
            </div>
            <DollarSign className="w-5 h-5 text-[var(--color-muted)] shrink-0" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {officialAvailable && officialFunnel?.stages.length ? (
          <FunnelChart
            stages={officialFunnel.stages}
            title={
              officialFunnel.referenceDay
                ? `Funil RD (oficial) · ref. ${officialFunnel.referenceDay}`
                : 'Funil RD (oficial)'
            }
          />
        ) : null}
        {funil.length > 0 ? (
          <FunnelChart stages={funil} title="Contatos criados no período (sync)" />
        ) : null}
        <TopForms forms={topForms} />
      </div>

      <TrendChart data={trend} />

      {conversionsTrend.length > 0 && (
        <div className="card p-6 border-[var(--color-border)]">
          <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-5">
            Conversões por dia (last_conversion_date)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={conversionsTrend.map((p) => ({
                date: fmtDate(p.date),
                Conversões: p.conversions,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                }}
              />
              <Line type="monotone" dataKey="Conversões" stroke="#8B5CF6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
