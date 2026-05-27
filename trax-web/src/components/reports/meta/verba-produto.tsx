'use client'

import { useState } from 'react'
import { Box, ChevronDown, ChevronUp } from 'lucide-react'
import { colorForMetric, MetaConfigShape } from '@/lib/meta-heuristics'
import { fmtCurrency, fmtCurrency2, fmtNum, fmtPct, type VerbaProduto } from './types'

interface Props {
  data: VerbaProduto
  config: MetaConfigShape
}

function pacingColor(pct: number) {
  if (pct >= 88 && pct <= 115) return '#10B981'
  if (pct < 88) return '#F59E0B'
  return '#EF4444'
}

export function VerbaProdutoSection({ data, config }: Props) {
  const [stateFilter, setStateFilter] = useState<string>('all')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const visible = stateFilter === 'all'
    ? data.products
    : data.products.filter((p) => {
        const dist = config.stateBudgetByProduct[p.key] ?? {}
        return Number(dist[stateFilter] ?? 0) > 0
      })

  if (data.products.length === 0) return null

  return (
    <div className="card p-5 border-[var(--color-border)]">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4 text-[var(--color-primary)]" />
          <h3 className="text-sm font-semibold">Verba por Produto & Estado</h3>
        </div>
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] py-1 px-2"
        >
          <option value="all">Todos estados</option>
          {config.states.map((s) => (
            <option key={s.code} value={s.code}>
              {s.code} — {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 p-3 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)]">
        <div>
          <p className="text-[10px] uppercase text-[var(--color-muted-foreground)]">Investido (mês)</p>
          <p className="text-lg font-bold">{fmtCurrency(data.totalSpent)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-[var(--color-muted-foreground)]">Meta total</p>
          <p className="text-lg font-bold">{fmtCurrency(data.totalTarget)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-[var(--color-muted-foreground)]">% Atingido</p>
          <p className="text-lg font-bold" style={{ color: pacingColor(data.pctOfTarget) }}>
            {fmtPct(data.pctOfTarget)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {visible.map((p) => {
          const isOpen = expanded[p.key] ?? false
          const pacingPct = p.pct
          return (
            <div key={p.key} className="rounded-lg border border-[var(--color-border)] overflow-hidden">
              <div className="p-3" style={{ borderLeft: `4px solid ${p.color}` }}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{p.label}</p>
                  <button
                    type="button"
                    onClick={() => setExpanded((e) => ({ ...e, [p.key]: !isOpen }))}
                    className="p-1 rounded hover:bg-[var(--color-surface-2)]"
                  >
                    {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="mt-2 h-2 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, pacingPct)}%`,
                      background: pacingColor(pacingPct),
                    }}
                  />
                </div>
                <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <p className="text-[9px] uppercase text-[var(--color-muted-foreground)]">Investido</p>
                    <p className="font-semibold">{fmtCurrency(p.spent)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase text-[var(--color-muted-foreground)]">Meta</p>
                    <p className="font-semibold">{fmtCurrency(p.target)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase text-[var(--color-muted-foreground)]">Leads</p>
                    <p className="font-semibold">{fmtNum(p.leads)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase text-[var(--color-muted-foreground)]">CPL</p>
                    <p className="font-semibold" style={{ color: p.cpl > 0 ? colorForMetric('cpl', p.cpl, config) : undefined }}>
                      {p.cpl > 0 ? fmtCurrency2(p.cpl) : '—'}
                    </p>
                  </div>
                </div>
              </div>
              {isOpen && p.byState.length > 0 && (
                <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-2)]/40">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[10px] uppercase text-[var(--color-muted-foreground)]">
                        <th className="text-left px-3 py-1">UF</th>
                        <th className="text-right px-3 py-1">%</th>
                        <th className="text-right px-3 py-1">Investido</th>
                        <th className="text-right px-3 py-1">Meta</th>
                        <th className="text-right px-3 py-1">Leads</th>
                        <th className="text-right px-3 py-1">CPL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]/40">
                      {p.byState
                        .filter((s) => s.pct > 0)
                        .map((s) => (
                          <tr key={s.state}>
                            <td className="px-3 py-1.5 font-medium">{s.state}</td>
                            <td className="px-3 py-1.5 text-right tabular-nums">{s.pct.toFixed(1)}%</td>
                            <td className="px-3 py-1.5 text-right tabular-nums">{fmtCurrency(s.spent)}</td>
                            <td className="px-3 py-1.5 text-right tabular-nums">{fmtCurrency(s.target)}</td>
                            <td className="px-3 py-1.5 text-right tabular-nums">{fmtNum(s.leads)}</td>
                            <td
                              className="px-3 py-1.5 text-right tabular-nums"
                              style={{ color: s.cpl > 0 ? colorForMetric('cpl', s.cpl, config) : undefined }}
                            >
                              {s.cpl > 0 ? fmtCurrency2(s.cpl) : '—'}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
