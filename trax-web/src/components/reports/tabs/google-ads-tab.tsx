'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import {
  DollarSign, MousePointerClick, Eye, TrendingUp, RefreshCw,
  Target, AlertCircle, BarChart3,
} from 'lucide-react'
import { useApiClient } from '@/lib/api-client-browser'
import { useSharedApiClient } from '@/lib/shared-api-client'
import { reportMetricsPath } from '@/lib/report-metrics-path'
import { fmtCurrency, fmtNum, fmtPct } from './format-metrics'

interface GoogleMetrics {
  campaigns: Campaign[]
  dailyData: DailyPoint[]
  byChannelType: ChannelPoint[]
  summary: Summary | null
}

interface Campaign {
  id: string
  name: string
  spend: number
  clicks: number
  impressions: number
  conversions: number
  ctr: number
  cpc: number
  cpa: number
}

interface DailyPoint {
  date: string
  spend: number
  clicks: number
  impressions: number
  conversions: number
}

interface ChannelPoint {
  label: string
  conversions: number
}

interface Summary {
  totalSpend: number
  totalClicks: number
  totalImpressions: number
  totalConversions: number
  conversionRate: number
  cpa: number
  avgCpc: number
  impressionShare: number
  avgQualityScore: number | null
}

interface Props {
  reportId: string
  periodStart?: string
  periodEnd?: string
  shareToken?: string
}

const PERIOD_OPTIONS = [
  { label: 'Este mês', getValue: () => {
    const now = new Date()
    return { start: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`, end: now.toISOString().split('T')[0] }
  }},
  { label: '30 dias', getValue: () => {
    const end = new Date()
    const start = new Date(end); start.setDate(start.getDate() - 30)
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
  }},
  { label: '90 dias', getValue: () => {
    const end = new Date()
    const start = new Date(end); start.setDate(start.getDate() - 90)
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
  }},
]

const CHANNEL_COLORS = ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#69C9D0', '#8B5CF6']

function KpiCard({ label, value, icon: Icon, sub }: { label: string; value: string; icon: React.ElementType; sub?: string }) {
  return (
    <div className="card p-5 border-[var(--color-border)]">
      <div className="flex justify-between items-start mb-3">
        <p className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wide">{label}</p>
        <div className="p-2 rounded-lg bg-[var(--color-surface-2)] text-[var(--color-primary)]">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-[var(--color-foreground)] tracking-tight">{value}</p>
      {sub && <p className="text-xs text-[var(--color-muted-foreground)] mt-1">{sub}</p>}
    </div>
  )
}

export function GoogleAdsTab({ reportId, periodStart, periodEnd, shareToken }: Props) {
  const authApi = useApiClient()
  const sharedApi = useSharedApiClient()
  const api = shareToken ? sharedApi : authApi
  const [metrics, setMetrics] = useState<GoogleMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activePeriod, setActivePeriod] = useState(0)

  const period = PERIOD_OPTIONS[activePeriod].getValue()
  const startDate = periodStart || period.start
  const endDate = periodEnd || period.end

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ startDate, endDate })
      const data = await api.get<GoogleMetrics>(`${reportMetricsPath(reportId, 'google-ads', shareToken)}?${params}`)
      setMetrics(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar métricas')
    } finally {
      setLoading(false)
    }
  }, [api, reportId, shareToken, startDate, endDate])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="card p-5 border-[var(--color-border)] animate-pulse">
            <div className="h-3 bg-[var(--color-surface-2)] rounded mb-3 w-24" />
            <div className="h-7 bg-[var(--color-surface-2)] rounded w-32" />
          </div>
        ))}
      </div>
    )
  }

  if (error || !metrics || (metrics.campaigns.length === 0 && metrics.dailyData.length === 0)) {
    return (
      <div className="card p-10 border-[var(--color-border)] text-center">
        <AlertCircle className="w-10 h-10 text-[var(--color-muted)] mx-auto mb-3" />
        <p className="font-medium text-[var(--color-foreground)]">Dados não disponíveis</p>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1 mb-4">
          {error || 'Conecte e sincronize a integração Google Ads deste cliente.'}
        </p>
        <button onClick={fetchData} className="text-sm text-[var(--color-primary)] hover:underline inline-flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Tentar novamente
        </button>
      </div>
    )
  }

  const { campaigns, dailyData, byChannelType } = metrics
  const summary = metrics.summary!

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
        {PERIOD_OPTIONS.map((p, i) => (
          <button
            key={p.label}
            onClick={() => setActivePeriod(i)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              activePeriod === i
                ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                : 'border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]/50'
            }`}
          >
            {p.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
          <span>{startDate}</span> → <span>{endDate}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Gasto Total" value={fmtCurrency(summary.totalSpend)} icon={DollarSign} />
        <KpiCard label="Conversões" value={fmtNum(summary.totalConversions)} icon={Target} />
        <KpiCard label="CPA" value={fmtCurrency(summary.cpa)} icon={TrendingUp} />
        <KpiCard label="Taxa Conv." value={fmtPct(summary.conversionRate)} icon={MousePointerClick} />
        <KpiCard label="CPC Médio" value={fmtCurrency(summary.avgCpc)} icon={DollarSign} />
        <KpiCard label="Impressões" value={fmtNum(summary.totalImpressions)} icon={Eye} />
        <KpiCard label="Impr. Share" value={fmtPct(summary.impressionShare)} icon={BarChart3} sub="Search" />
        <KpiCard
          label="Quality Score"
          value={summary.avgQualityScore != null ? summary.avgQualityScore.toFixed(1) : '—'}
          icon={BarChart3}
        />
      </div>

      {dailyData.length > 0 && (
        <div className="card p-6 border-[var(--color-border)]">
          <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-4">Gasto por Dia</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
              <Area type="monotone" dataKey="spend" stroke="#EA4335" fill="#EA433533" name="Gasto" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {campaigns.length > 0 && (
          <div className="card p-6 border-[var(--color-border)]">
            <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-4">CPC × CTR por Campanha</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={campaigns.slice(0, 8)} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={75} tick={{ fontSize: 9 }} />
                <Tooltip />
                <Bar dataKey="cpc" fill="#4285F4" name="CPC" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {byChannelType.length > 0 && (
          <div className="card p-6 border-[var(--color-border)]">
            <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-4">Conversões por Tipo</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={byChannelType} dataKey="conversions" nameKey="label" cx="50%" cy="50%" outerRadius={80} label>
                  {byChannelType.map((_, i) => (
                    <Cell key={i} fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {campaigns.length > 0 && (
        <div className="card overflow-hidden border-[var(--color-border)]">
          <div className="p-4 border-b border-[var(--color-border)]">
            <h3 className="text-sm font-semibold text-[var(--color-foreground)]">Campanhas</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-surface-2)] text-xs text-[var(--color-muted-foreground)] uppercase">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Campanha</th>
                  <th className="px-4 py-3 text-right font-medium">Gasto</th>
                  <th className="px-4 py-3 text-right font-medium">Conv.</th>
                  <th className="px-4 py-3 text-right font-medium">CPA</th>
                  <th className="px-4 py-3 text-right font-medium">CTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-[var(--color-surface-2)]">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-right">{fmtCurrency(c.spend)}</td>
                    <td className="px-4 py-3 text-right">{fmtNum(c.conversions)}</td>
                    <td className="px-4 py-3 text-right">{fmtCurrency(c.cpa)}</td>
                    <td className="px-4 py-3 text-right">{fmtPct(c.ctr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
