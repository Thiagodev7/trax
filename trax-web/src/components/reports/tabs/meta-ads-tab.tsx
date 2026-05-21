'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  DollarSign, Users, MousePointerClick, Eye, TrendingUp, TrendingDown,
  RefreshCw, Target, Layers, ImageIcon, AlertCircle
} from 'lucide-react'
import { useApiClient } from '@/lib/api-client-browser'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface MetaMetrics {
  campaigns: Campaign[]
  adsets: AdsetInfo[]
  adsetMetrics: AdsetMetric[]
  creatives: Creative[]
  dailyData: DailyPoint[]
  summary: Summary | null
}

interface Campaign {
  id: string
  name: string
  spend: number
  leads: number
  impressions: number
  clicks: number
  cpl: number
  ctr: number
}

interface AdsetInfo {
  id: string
  name: string
  dailyBudget: number
  status: string
}

interface AdsetMetric {
  date: string
  adset_id: string
  adset_name: string
  spend: number
  leads: number
  ctr: number
  cpc: number
}

interface Creative {
  ad_id: string
  ad_name: string
  spend: number
  leads: number
  impressions: number
  thumbnailUrl?: string
}

interface DailyPoint {
  date: string
  spend: number
  leads: number
  impressions: number
  clicks: number
}

interface Summary {
  totalSpend: number
  totalLeads: number
  totalImpressions: number
  totalClicks: number
  cpl: number
  ctr: number
  cpc: number
  cpm: number
}

interface Props {
  reportId: string
  periodStart?: string
  periodEnd?: string
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

function fmtCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}
function fmtNum(v: number) {
  return new Intl.NumberFormat('pt-BR').format(Math.round(v))
}
function fmtPct(v: number) {
  return `${v.toFixed(2)}%`
}

export function MetaAdsTab({ reportId, periodStart, periodEnd }: Props) {
  const api = useApiClient()
  const [metrics, setMetrics] = useState<MetaMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activePeriod, setActivePeriod] = useState(0)
  const [campaignFilter, setCampaignFilter] = useState('all')

  const period = PERIOD_OPTIONS[activePeriod].getValue()
  const startDate = periodStart || period.start
  const endDate = periodEnd || period.end

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        ...(campaignFilter !== 'all' && { campaign: campaignFilter }),
      })
      const data = await api.get<MetaMetrics>(`/reports/${reportId}/metrics/meta-ads?${params}`)
      setMetrics(data)
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar métricas')
    } finally {
      setLoading(false)
    }
  }, [reportId, startDate, endDate, campaignFilter])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card p-5 border-[var(--color-border)] animate-pulse">
              <div className="h-3 bg-[var(--color-surface-2)] rounded mb-3 w-24" />
              <div className="h-7 bg-[var(--color-surface-2)] rounded w-32" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <div className="card p-10 border-[var(--color-border)] text-center">
        <AlertCircle className="w-10 h-10 text-[var(--color-muted)] mx-auto mb-3" />
        <p className="font-medium text-[var(--color-foreground)]">Dados não disponíveis</p>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1 mb-4">{error || 'Nenhum dado sincronizado ainda.'}</p>
        <button onClick={fetchData} className="text-sm text-[var(--color-primary)] hover:underline inline-flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Tentar novamente
        </button>
      </div>
    )
  }

  const { summary, campaigns, dailyData, adsets, creatives } = metrics
  const uniqueCampaigns = [...new Set(campaigns.map((c) => c.name))]

  return (
    <div className="space-y-6">
      {/* Period filter */}
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

      {/* KPI Grid */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Gasto Total" value={fmtCurrency(summary.totalSpend)} icon={DollarSign} />
          <KpiCard label="Leads" value={fmtNum(summary.totalLeads)} icon={Users} />
          <KpiCard label="CPL" value={fmtCurrency(summary.cpl)} icon={Target} />
          <KpiCard label="CTR" value={fmtPct(summary.ctr)} icon={MousePointerClick} />
          <KpiCard label="Impressões" value={fmtNum(summary.totalImpressions)} icon={Eye} />
          <KpiCard label="Cliques" value={fmtNum(summary.totalClicks)} icon={MousePointerClick} />
          <KpiCard label="CPC" value={fmtCurrency(summary.cpc)} icon={TrendingDown} />
          <KpiCard label="CPM" value={fmtCurrency(summary.cpm)} icon={Layers} />
        </div>
      )}

      {/* Daily leads chart */}
      {dailyData.length > 0 && (
        <div className="card p-6 border-[var(--color-border)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--color-foreground)]">Leads por Dia</h3>
            {/* Campaign filter */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setCampaignFilter('all')}
                className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                  campaignFilter === 'all'
                    ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'border-[var(--color-border)] text-[var(--color-muted-foreground)]'
                }`}
              >
                Todas
              </button>
              {uniqueCampaigns.slice(0, 5).map((name) => (
                <button
                  key={name}
                  onClick={() => setCampaignFilter(name.slice(0, 4).toUpperCase())}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                    campaignFilter === name.slice(0, 4).toUpperCase()
                      ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)]'
                      : 'border-[var(--color-border)] text-[var(--color-muted-foreground)]'
                  }`}
                >
                  {name.slice(0, 6)}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dailyData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-foreground)' }}
              />
              <Area type="monotone" dataKey="leads" stroke="var(--color-primary)" fill="url(#leadGrad)" strokeWidth={2} name="Leads" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Campaigns table */}
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
                  <th className="px-4 py-3 text-right font-medium">Leads</th>
                  <th className="px-4 py-3 text-right font-medium">CPL</th>
                  <th className="px-4 py-3 text-right font-medium">CTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-[var(--color-surface-2)] transition-colors">
                    <td className="px-4 py-3 font-medium text-[var(--color-foreground)]">{c.name}</td>
                    <td className="px-4 py-3 text-right text-[var(--color-foreground)]">{fmtCurrency(c.spend)}</td>
                    <td className="px-4 py-3 text-right text-[var(--color-foreground)]">{fmtNum(c.leads)}</td>
                    <td className="px-4 py-3 text-right text-[var(--color-foreground)]">{fmtCurrency(c.cpl)}</td>
                    <td className="px-4 py-3 text-right text-[var(--color-foreground)]">{fmtPct(c.ctr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Creatives */}
      {creatives.length > 0 && (
        <div className="card p-5 border-[var(--color-border)]">
          <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-4">Criativos</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {creatives.slice(0, 8).map((c) => (
              <div key={c.ad_id} className="rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-2)]">
                {c.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.thumbnailUrl} alt={c.ad_name} className="w-full aspect-video object-cover" />
                ) : (
                  <div className="w-full aspect-video flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-[var(--color-muted)]" />
                  </div>
                )}
                <div className="p-3">
                  <p className="text-xs font-medium text-[var(--color-foreground)] line-clamp-1">{c.ad_name}</p>
                  <div className="flex justify-between mt-1.5 text-xs text-[var(--color-muted-foreground)]">
                    <span>{fmtCurrency(c.spend)}</span>
                    <span>{fmtNum(c.leads)} leads</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
