'use client'

import { useMemo, useState } from 'react'
import { Calendar, TrendingUp } from 'lucide-react'
import { MonthNavigator } from '@/components/ui/month-navigator'
import { fmtCurrency, fmtNum, fmtCurrency2 } from './types'

interface Props {
  annual: { year: number; spend: number; leads: number; cpl: number }
  monthly: Record<string, { spend: number; leads: number; cpl: number }>
}

function currentMonthKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function AnnualSummary({ annual, monthly }: Props) {
  const months = useMemo(() => Object.keys(monthly).sort(), [monthly])
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const cur = currentMonthKey()
    return months.includes(cur) ? cur : months[months.length - 1] ?? cur
  })

  const current = monthly[selectedMonth] ?? { spend: 0, leads: 0, cpl: 0 }
  const idx = months.indexOf(selectedMonth)
  const prev = idx > 0 ? monthly[months[idx - 1]] : null
  const delta = (curV: number, prevV?: number) => {
    if (!prevV) return null
    const pct = ((curV - prevV) / Math.abs(prevV)) * 100
    return pct
  }

  const dSpend = prev ? delta(current.spend, prev.spend) : null
  const dLeads = prev ? delta(current.leads, prev.leads) : null
  const dCpl = prev ? delta(current.cpl, prev.cpl) : null

  function deltaSpan(v: number | null, invert = false) {
    if (v == null) return null
    const positive = v >= 0
    const good = invert ? !positive : positive
    return (
      <span className={`text-[10px] font-medium ${good ? 'text-emerald-400' : 'text-red-400'}`}>
        {positive ? '+' : ''}{v.toFixed(1)}%
      </span>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="card p-5 border-[var(--color-border)]">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-[var(--color-primary)]" />
          <h3 className="text-sm font-semibold">Resultado Anual {annual.year}</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-[10px] uppercase text-[var(--color-muted-foreground)]">Investido</p>
            <p className="text-lg font-bold">{fmtCurrency(annual.spend)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-[var(--color-muted-foreground)]">Leads</p>
            <p className="text-lg font-bold">{fmtNum(annual.leads)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-[var(--color-muted-foreground)]">CPL</p>
            <p className="text-lg font-bold">{annual.cpl > 0 ? fmtCurrency2(annual.cpl) : '—'}</p>
          </div>
        </div>
      </div>

      <div className="card p-5 border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--color-primary)]" />
            <h3 className="text-sm font-semibold">Resultado do Mês</h3>
          </div>
          {months.length > 1 && (
            <MonthNavigator value={selectedMonth} onChange={setSelectedMonth} options={months} />
          )}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-[10px] uppercase text-[var(--color-muted-foreground)]">Investido</p>
            <p className="text-lg font-bold">{fmtCurrency(current.spend)}</p>
            {deltaSpan(dSpend)}
          </div>
          <div>
            <p className="text-[10px] uppercase text-[var(--color-muted-foreground)]">Leads</p>
            <p className="text-lg font-bold">{fmtNum(current.leads)}</p>
            {deltaSpan(dLeads)}
          </div>
          <div>
            <p className="text-[10px] uppercase text-[var(--color-muted-foreground)]">CPL</p>
            <p className="text-lg font-bold">{current.cpl > 0 ? fmtCurrency2(current.cpl) : '—'}</p>
            {deltaSpan(dCpl, true)}
          </div>
        </div>
      </div>
    </div>
  )
}
