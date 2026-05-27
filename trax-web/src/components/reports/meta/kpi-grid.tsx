'use client'

import { DollarSign, Users, MousePointerClick, Eye, Layers, TrendingUp, Activity, Wallet, ArrowRightLeft } from 'lucide-react'
import { Sparkline } from '@/components/ui/sparkline'
import { TrendChip } from '@/components/ui/trend-chip'
import { colorForMetric, MetaConfigShape } from '@/lib/meta-heuristics'
import { fmtCurrency, fmtCurrency2, fmtNum, fmtPct, type MetaSummary, type PreviousSummary, type TrendDaily } from './types'

interface Props {
  summary: MetaSummary
  previous: PreviousSummary | null
  trend: TrendDaily | null
  config: MetaConfigShape
  compare: boolean
}

interface KpiCardProps {
  label: string
  value: string
  icon: React.ElementType
  color?: string
  spark?: number[]
  current?: number
  previous?: number | null
  invert?: boolean
  showCompare?: boolean
}

function KpiCard({ label, value, icon: Icon, color, spark, current, previous, invert, showCompare }: KpiCardProps) {
  return (
    <div className="card p-4 border-[var(--color-border)] flex flex-col gap-2 group hover:border-[var(--color-primary)]/40 transition-colors">
      <div className="flex justify-between items-start gap-2">
        <p className="text-[10px] font-medium text-[var(--color-muted-foreground)] uppercase tracking-wide leading-tight">{label}</p>
        <Icon className="w-3.5 h-3.5 text-[var(--color-primary)]" />
      </div>
      <p className="text-xl font-bold tracking-tight tabular-nums" style={color ? { color } : undefined}>
        {value}
      </p>
      <div className="flex items-end justify-between gap-1 min-h-[24px]">
        {showCompare && current != null && previous != null ? (
          <TrendChip current={current} previous={previous} invertColors={invert} />
        ) : (
          <span />
        )}
        {spark && spark.length > 1 && (
          <Sparkline data={spark} width={70} height={22} color={color ?? 'var(--color-primary)'} />
        )}
      </div>
    </div>
  )
}

export function KpiGrid({ summary, previous, trend, config, compare }: Props) {
  const showSparks = !!trend && trend.dates.length > 1
  const showTrend = compare && !!previous

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
      <KpiCard label="Gasto Hoje" value={fmtCurrency(summary.todaySpend)} icon={DollarSign}
        spark={showSparks ? trend!.spend.slice(-7) : undefined} />
      <KpiCard label="Gasto Mês" value={fmtCurrency(summary.monthSpend)} icon={DollarSign}
        spark={showSparks ? trend!.spend : undefined}
        current={summary.totalSpend} previous={previous?.totalSpend ?? null}
        showCompare={showTrend} />
      <KpiCard label="Verba Diária" value={fmtCurrency(summary.totalDailyBudget)} icon={Wallet} />
      <KpiCard label="Leads" value={fmtNum(summary.totalLeads)} icon={Users}
        spark={showSparks ? trend!.leads : undefined}
        current={summary.totalLeads} previous={previous?.totalLeads ?? null}
        showCompare={showTrend} />
      <KpiCard label="CPL" value={fmtCurrency2(summary.cpl)} icon={TrendingUp}
        color={colorForMetric('cpl', summary.cpl, config)}
        spark={showSparks ? trend!.cpl : undefined}
        current={summary.cpl} previous={previous?.cpl ?? null} invert
        showCompare={showTrend} />
      <KpiCard label="CTR" value={fmtPct(summary.ctr)} icon={MousePointerClick}
        color={colorForMetric('ctr', summary.ctr, config)}
        spark={showSparks ? trend!.ctr : undefined}
        current={summary.ctr} previous={previous?.ctr ?? null}
        showCompare={showTrend} />
      <KpiCard label="CPC" value={fmtCurrency2(summary.cpc)} icon={MousePointerClick}
        color={colorForMetric('cpc', summary.cpc, config)}
        spark={showSparks ? trend!.cpc : undefined}
        current={summary.cpc} previous={previous?.cpc ?? null} invert
        showCompare={showTrend} />
      <KpiCard label="CPM" value={fmtCurrency2(summary.cpm)} icon={Layers}
        color={colorForMetric('cpm', summary.cpm, config)}
        spark={showSparks ? trend!.cpm : undefined}
        current={summary.cpm} previous={previous?.cpm ?? null} invert
        showCompare={showTrend} />
      <KpiCard label="Cliques" value={fmtNum(summary.totalClicks)} icon={MousePointerClick}
        spark={showSparks ? trend!.clicks : undefined}
        current={summary.totalClicks} previous={previous?.totalClicks ?? null}
        showCompare={showTrend} />
      <KpiCard label="Alcance (est.)" value={fmtNum(summary.estimatedReach)} icon={Eye}
        spark={showSparks ? trend!.impressions : undefined}
        current={summary.estimatedReach} previous={previous?.estimatedReach ?? null}
        showCompare={showTrend} />
      <KpiCard label="CVR" value={fmtPct(summary.cvr)} icon={Activity}
        current={summary.cvr} previous={previous?.cvr ?? null}
        showCompare={showTrend} />
      <KpiCard label="Impressões" value={fmtNum(summary.totalImpressions)} icon={ArrowRightLeft}
        spark={showSparks ? trend!.impressions : undefined}
        current={summary.totalImpressions} previous={previous?.totalImpressions ?? null}
        showCompare={showTrend} />
    </div>
  )
}
