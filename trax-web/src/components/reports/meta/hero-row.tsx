'use client'

import { Target, Layers, ImageIcon, Megaphone } from 'lucide-react'
import { ScoreGauge } from '@/components/ui/score-gauge'
import { TrendChip } from '@/components/ui/trend-chip'
import { computePerformanceScore, MetaConfigShape } from '@/lib/meta-heuristics'
import type { Hierarchy, MetaSummary, PreviousSummary } from './types'

interface Props {
  summary: MetaSummary
  previous: PreviousSummary | null
  hierarchy: Hierarchy
  config: MetaConfigShape
  compare: boolean
}

function MiniCount({
  label,
  icon: Icon,
  active,
  total,
}: {
  label: string
  icon: React.ElementType
  active: number
  total: number
}) {
  return (
    <div className="card p-4 border-[var(--color-border)] flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wide text-[var(--color-muted-foreground)]">{label}</p>
        <Icon className="w-3.5 h-3.5 text-[var(--color-primary)]" />
      </div>
      <p className="text-2xl font-bold tabular-nums">{active}</p>
      <p className="text-[10px] text-[var(--color-muted-foreground)]">de {total} total</p>
    </div>
  )
}

export function HeroRow({ summary, previous, hierarchy, config, compare }: Props) {
  const score = computePerformanceScore(summary, config)

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <div className="card p-4 border-[var(--color-border)] flex flex-col items-center justify-center col-span-2 md:col-span-1">
        <ScoreGauge score={score} size={110} label="Performance" />
      </div>
      <MiniCount label="Campanhas" icon={Megaphone} active={hierarchy.campaigns.active} total={hierarchy.campaigns.total} />
      <MiniCount label="Conjuntos" icon={Layers} active={hierarchy.adsets.active} total={hierarchy.adsets.total} />
      <MiniCount label="Anúncios" icon={ImageIcon} active={hierarchy.ads.active} total={hierarchy.ads.total} />
      <div className="card p-4 border-[var(--color-border)]">
        <p className="text-[10px] uppercase tracking-wide text-[var(--color-muted-foreground)] mb-1">Resumo do período</p>
        <p className="text-lg font-bold leading-tight">
          {summary.totalLeads} <span className="text-[11px] font-normal text-[var(--color-muted-foreground)]">leads</span>
        </p>
        {compare && previous && (
          <div className="flex flex-col gap-0.5 mt-1">
            <TrendChip current={summary.totalLeads} previous={previous.totalLeads} />
            <TrendChip current={summary.cpl} previous={previous.cpl} invertColors format={(p) => `${p >= 0 ? '+' : ''}${p.toFixed(1)}% CPL`} />
          </div>
        )}
        {!compare && (
          <p className="text-[11px] text-[var(--color-muted-foreground)] mt-1 inline-flex items-center gap-1">
            <Target className="w-3 h-3" /> Score {score}/100
          </p>
        )}
      </div>
    </div>
  )
}
