'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { colorForMetric, MetaConfigShape } from '@/lib/meta-heuristics'
import { fmtCurrency, fmtCurrency2, fmtNum, fmtPct, type RioVerdeData } from './types'

interface Props {
  data: RioVerdeData
  config: MetaConfigShape
}

type Period = '7' | '14' | '30' | 'month'

export function RioVerdeSection({ data, config }: Props) {
  const [open, setOpen] = useState(true)
  const [period, setPeriod] = useState<Period>('30')

  const tailDays = useMemo(() => {
    if (period === 'month') {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return Math.ceil((now.getTime() - start.getTime()) / 86400000) + 1
    }
    return Number(period)
  }, [period])

  const filteredDaily = useMemo(() => data.dailyData.slice(-tailDays), [data.dailyData, tailDays])
  const totals = useMemo(() => {
    const t = filteredDaily.reduce(
      (acc, d) => {
        acc.spend += d.spend
        acc.leads += d.leads
        acc.impressions += d.impressions
        acc.clicks += d.clicks
        return acc
      },
      { spend: 0, leads: 0, impressions: 0, clicks: 0 },
    )
    return {
      ...t,
      cpl: t.leads > 0 ? t.spend / t.leads : 0,
      ctr: t.impressions > 0 ? (t.clicks / t.impressions) * 100 : 0,
      cpc: t.clicks > 0 ? t.spend / t.clicks : 0,
    }
  }, [filteredDaily])

  const ytd = data.summary
  const dailyBudget = data.summary?.totalDailyBudget ?? 0

  return (
    <div className="card border-[var(--color-border)] overflow-hidden" style={{ borderLeft: `4px solid ${data.color}` }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-4 hover:bg-[var(--color-surface-2)]/30"
      >
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: data.color }} />
          <div className="text-left">
            <h3 className="text-sm font-semibold">{data.label}</h3>
            <p className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5">Conta secundária · YTD</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="p-4 border-t border-[var(--color-border)] space-y-4">
          <div className="flex items-center gap-1">
            {(['7', '14', '30', 'month'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded border ${
                  period === p
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'border-[var(--color-border)] text-[var(--color-muted-foreground)]'
                }`}
              >
                {p === 'month' ? 'Mês' : `${p}d`}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-[var(--color-surface-2)]">
              <p className="text-[10px] uppercase text-[var(--color-muted-foreground)]">Gasto (período)</p>
              <p className="text-base font-bold">{fmtCurrency(totals.spend)}</p>
              <p className="text-[10px] text-[var(--color-muted-foreground)]">YTD: {fmtCurrency(ytd?.totalSpend ?? 0)}</p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--color-surface-2)]">
              <p className="text-[10px] uppercase text-[var(--color-muted-foreground)]">Leads</p>
              <p className="text-base font-bold">{fmtNum(totals.leads)}</p>
              <p className="text-[10px] text-[var(--color-muted-foreground)]">YTD: {fmtNum(ytd?.totalLeads ?? 0)}</p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--color-surface-2)]">
              <p className="text-[10px] uppercase text-[var(--color-muted-foreground)]">CPL</p>
              <p className="text-base font-bold" style={totals.cpl > 0 ? { color: colorForMetric('cpl', totals.cpl, config) } : undefined}>
                {totals.cpl > 0 ? fmtCurrency2(totals.cpl) : '—'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--color-surface-2)]">
              <p className="text-[10px] uppercase text-[var(--color-muted-foreground)]">Verba/dia</p>
              <p className="text-base font-bold">{fmtCurrency(dailyBudget)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold mb-2">Por Campanha (YTD)</p>
              <div className="overflow-hidden rounded-lg border border-[var(--color-border)]">
                <table className="w-full text-xs">
                  <thead className="text-[10px] uppercase text-[var(--color-muted-foreground)] bg-[var(--color-surface-2)]">
                    <tr>
                      <th className="px-2 py-1.5 text-left">Campanha</th>
                      <th className="px-2 py-1.5 text-right">Gasto</th>
                      <th className="px-2 py-1.5 text-right">Leads</th>
                      <th className="px-2 py-1.5 text-right">CPL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {data.campaigns.length === 0 ? (
                      <tr><td colSpan={4} className="px-2 py-3 text-center text-[var(--color-muted-foreground)]">Sem dados.</td></tr>
                    ) : data.campaigns.map((c) => (
                      <tr key={c.id}>
                        <td className="px-2 py-1.5 truncate max-w-[160px]">{c.name}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums">{fmtCurrency(c.spend)}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums">{fmtNum(c.leads)}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums" style={c.cpl > 0 ? { color: colorForMetric('cpl', c.cpl, config) } : undefined}>
                          {c.cpl > 0 ? fmtCurrency2(c.cpl) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold mb-2">Conjuntos ({period === 'month' ? 'mês' : `${period}d`})</p>
              <div className="overflow-hidden rounded-lg border border-[var(--color-border)] max-h-[260px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="text-[10px] uppercase text-[var(--color-muted-foreground)] bg-[var(--color-surface-2)] sticky top-0">
                    <tr>
                      <th className="px-2 py-1.5 text-left">Conjunto</th>
                      <th className="px-2 py-1.5 text-right">Gasto</th>
                      <th className="px-2 py-1.5 text-right">Leads</th>
                      <th className="px-2 py-1.5 text-right">CPL</th>
                      <th className="px-2 py-1.5 text-right hidden md:table-cell">CTR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {data.adsetTable.length === 0 ? (
                      <tr><td colSpan={5} className="px-2 py-3 text-center text-[var(--color-muted-foreground)]">Sem dados.</td></tr>
                    ) : data.adsetTable.map((a) => (
                      <tr key={a.id}>
                        <td className="px-2 py-1.5 truncate max-w-[140px]" title={a.name}>
                          <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${a.active ? 'bg-emerald-400' : 'bg-[var(--color-muted)]'}`} />
                          {a.name}
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums">{fmtCurrency(a.spend)}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums">{fmtNum(a.leads)}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums" style={a.cpl != null ? { color: colorForMetric('cpl', a.cpl, config) } : undefined}>
                          {a.cpl != null ? fmtCurrency2(a.cpl) : '—'}
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums hidden md:table-cell" style={{ color: colorForMetric('ctr', a.ctr, config) }}>
                          {fmtPct(a.ctr)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
