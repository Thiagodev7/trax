'use client'

import { Activity } from 'lucide-react'
import { computePerformanceScore, MetaConfigShape } from '@/lib/meta-heuristics'
import { fmtCurrency, fmtNum, fmtCurrency2, type BudgetPacingItem } from './types'

interface Props {
  items: BudgetPacingItem[]
  config: MetaConfigShape
}

const STATUS_LABEL: Record<BudgetPacingItem['pacingStatus'], { label: string; color: string }> = {
  'on-track': { label: 'No ritmo', color: '#10B981' },
  below: { label: 'Abaixo', color: '#F59E0B' },
  above: { label: 'Acima', color: '#EF4444' },
}

function MiniScore({ score }: { score: number }) {
  const color = score >= 65 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444'
  const circumference = 2 * Math.PI * 12
  const offset = circumference * (1 - score / 100)
  return (
    <div className="relative w-9 h-9 shrink-0">
      <svg viewBox="0 0 30 30" className="-rotate-90 w-full h-full">
        <circle cx="15" cy="15" r="12" fill="none" stroke="var(--color-surface-2)" strokeWidth="3" />
        <circle
          cx="15" cy="15" r="12" fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">{score}</span>
    </div>
  )
}

export function BudgetPacing({ items, config }: Props) {
  if (items.length === 0) return null

  return (
    <div className="card p-5 border-[var(--color-border)]">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-[var(--color-primary)]" />
        <h3 className="text-sm font-semibold">Ritmo de Gasto</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((b) => {
          const status = STATUS_LABEL[b.pacingStatus]
          const score = computePerformanceScore(
            { ctr: b.ctr, cpc: 0, cpl: b.cpl, totalLeads: b.leads },
            config,
          )
          return (
            <div key={b.campaignId} className="p-3 rounded-lg border border-[var(--color-border)] flex items-start gap-3">
              <MiniScore score={score} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold truncate">{b.campaignName}</p>
                  <span
                    className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                    style={{ background: `${status.color}22`, color: status.color }}
                  >
                    {status.label}
                  </span>
                </div>
                <div className="mt-1 h-1.5 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, b.pctMonth)}%`, background: status.color }} />
                </div>
                <div className="mt-1.5 grid grid-cols-4 gap-2 text-[11px] tabular-nums">
                  <div>
                    <p className="text-[9px] uppercase text-[var(--color-muted-foreground)]">Gasto</p>
                    <p className="font-medium">{fmtCurrency(b.monthSpend)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase text-[var(--color-muted-foreground)]">Esperado</p>
                    <p className="font-medium">{fmtCurrency(b.expectedSpend)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase text-[var(--color-muted-foreground)]">Leads</p>
                    <p className="font-medium">{fmtNum(b.leads)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase text-[var(--color-muted-foreground)]">CPL</p>
                    <p className="font-medium">{b.cpl > 0 ? fmtCurrency2(b.cpl) : '—'}</p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
