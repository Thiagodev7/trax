'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  value: string
  onChange: (next: string) => void
  options: string[]
  format?: (key: string) => string
}

function defaultFormat(key: string) {
  const [y, m] = key.split('-')
  const names = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const monthName = names[Number(m) - 1] ?? m
  return `${monthName} ${y}`
}

export function MonthNavigator({ value, onChange, options, format = defaultFormat }: Props) {
  const sorted = [...options].sort()
  const currentIdx = sorted.indexOf(value)
  const prev = currentIdx > 0 ? sorted[currentIdx - 1] : null
  const next = currentIdx >= 0 && currentIdx < sorted.length - 1 ? sorted[currentIdx + 1] : null

  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        disabled={!prev}
        onClick={() => prev && onChange(prev)}
        className="p-1 rounded hover:bg-[var(--color-surface-2)] disabled:opacity-30"
        aria-label="Mês anterior"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>
      <span className="text-xs font-medium uppercase min-w-[80px] text-center">{format(value)}</span>
      <button
        type="button"
        disabled={!next}
        onClick={() => next && onChange(next)}
        className="p-1 rounded hover:bg-[var(--color-surface-2)] disabled:opacity-30"
        aria-label="Próximo mês"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
