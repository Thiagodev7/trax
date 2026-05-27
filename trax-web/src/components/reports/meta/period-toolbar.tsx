'use client'

import { useMemo, useState } from 'react'
import { Calendar, Download, RefreshCw, GitCompare } from 'lucide-react'

export type PeriodKey = 'today' | 'yesterday' | 'week' | 'month' | 'custom'

export interface PeriodValue {
  key: PeriodKey
  start: string
  end: string
  monthKey?: string
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function shiftDate(d: string, days: number) {
  const dt = new Date(d)
  dt.setDate(dt.getDate() + days)
  return dt.toISOString().split('T')[0]
}

function monthRange(year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const last = new Date(year, month, 0).getDate()
  const end = `${year}-${String(month).padStart(2, '0')}-${String(last).padStart(2, '0')}`
  return { start, end }
}

export function buildPeriod(key: PeriodKey, monthKey?: string): PeriodValue {
  const today = todayStr()
  if (key === 'today') return { key, start: today, end: today }
  if (key === 'yesterday') {
    const y = shiftDate(today, -1)
    return { key, start: y, end: y }
  }
  if (key === 'week') {
    return { key, start: shiftDate(today, -6), end: today }
  }
  if (key === 'month') {
    const now = new Date()
    const mk = monthKey ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const [y, m] = mk.split('-').map(Number)
    const { start, end } = monthRange(y, m)
    return { key: 'month', start, end: end > today ? today : end, monthKey: mk }
  }
  return { key: 'custom', start: shiftDate(today, -30), end: today }
}

interface Props {
  value: PeriodValue
  onChange: (next: PeriodValue) => void
  compare: boolean
  onCompareChange: (next: boolean) => void
  onRefresh?: () => void
  onExport?: (entity: 'adsets' | 'creatives' | 'daily') => void
  monthOptions?: string[]
  syncing?: boolean
}

const QUICK: Array<{ key: PeriodKey; label: string }> = [
  { key: 'today', label: 'Hoje' },
  { key: 'yesterday', label: 'Ontem' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mês' },
]

export function PeriodToolbar({
  value,
  onChange,
  compare,
  onCompareChange,
  onRefresh,
  onExport,
  monthOptions = [],
  syncing,
}: Props) {
  const [showMonth, setShowMonth] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [customStart, setCustomStart] = useState(value.start)
  const [customEnd, setCustomEnd] = useState(value.end)

  const currentMonthLabel = useMemo(() => {
    const names = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    if (value.key === 'month' && value.monthKey) {
      const [y, m] = value.monthKey.split('-')
      return `${names[Number(m) - 1]}/${y.slice(-2)}`
    }
    return 'Mês'
  }, [value])

  return (
    <div className="flex flex-wrap items-center gap-1.5 p-2 bg-[var(--color-surface-2)] rounded-xl border border-[var(--color-border)]">
      {QUICK.map((q) => {
        const active = value.key === q.key
        if (q.key === 'month') {
          return (
            <div key={q.key} className="relative">
              <button
                type="button"
                onClick={() => {
                  if (active) setShowMonth((v) => !v)
                  else onChange(buildPeriod('month'))
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border inline-flex items-center gap-1 ${
                  active
                    ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                    : 'border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
                }`}
              >
                {currentMonthLabel} ▾
              </button>
              {showMonth && monthOptions.length > 0 && (
                <div className="absolute z-30 mt-1 min-w-[140px] max-h-64 overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
                  {[...monthOptions].sort().reverse().map((mk) => (
                    <button
                      key={mk}
                      type="button"
                      onClick={() => {
                        onChange(buildPeriod('month', mk))
                        setShowMonth(false)
                      }}
                      className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--color-surface-2)] ${
                        value.monthKey === mk ? 'text-[var(--color-primary)]' : ''
                      }`}
                    >
                      {mk}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        }
        return (
          <button
            key={q.key}
            type="button"
            onClick={() => onChange(buildPeriod(q.key))}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${
              active
                ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                : 'border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
            }`}
          >
            {q.label}
          </button>
        )
      })}

      <div className="relative">
        <button
          type="button"
          onClick={() => setShowCustom((v) => !v)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border inline-flex items-center gap-1 ${
            value.key === 'custom'
              ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-[var(--color-primary-foreground)]'
              : 'border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
          }`}
        >
          <Calendar className="w-3 h-3" /> Personalizado
        </button>
        {showCustom && (
          <div className="absolute z-30 mt-1 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg flex flex-col gap-2 min-w-[220px]">
            <label className="text-xs">
              Início
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full mt-1 text-xs bg-[var(--color-surface-2)] rounded p-1 border border-[var(--color-border)]"
              />
            </label>
            <label className="text-xs">
              Fim
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full mt-1 text-xs bg-[var(--color-surface-2)] rounded p-1 border border-[var(--color-border)]"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                onChange({ key: 'custom', start: customStart, end: customEnd })
                setShowCustom(false)
              }}
              className="text-xs bg-[var(--color-primary)] text-[var(--color-primary-foreground)] py-1 rounded font-medium"
            >
              Aplicar
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => onCompareChange(!compare)}
        title="Comparar com período anterior"
        className={`px-2.5 py-1.5 text-xs rounded-lg border inline-flex items-center gap-1 ${
          compare
            ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-300'
            : 'border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
        }`}
      >
        <GitCompare className="w-3 h-3" /> Comparar
      </button>

      <div className="ml-auto inline-flex items-center gap-1.5">
        <span className="text-[11px] text-[var(--color-muted-foreground)] hidden md:inline">
          {value.start} → {value.end}
        </span>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={syncing}
            className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface)] disabled:opacity-50"
            title="Sincronizar agora"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          </button>
        )}
        {onExport && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExport((v) => !v)}
              className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface)] inline-flex items-center gap-1 text-xs"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            {showExport && (
              <div className="absolute right-0 z-30 mt-1 min-w-[160px] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg overflow-hidden">
                {(['adsets', 'creatives', 'daily'] as const).map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => {
                      onExport(e)
                      setShowExport(false)
                    }}
                    className="block w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--color-surface-2)]"
                  >
                    {e === 'adsets' ? 'Conjuntos' : e === 'creatives' ? 'Criativos' : 'Por dia'}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
