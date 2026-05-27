'use client'

import { ArrowDown, ArrowUp, Minus } from 'lucide-react'

interface Props {
  current: number
  previous?: number | null
  invertColors?: boolean
  format?: (pct: number) => string
  className?: string
  showWhenZero?: boolean
}

export function TrendChip({
  current,
  previous,
  invertColors = false,
  format,
  className,
  showWhenZero = false,
}: Props) {
  if (previous == null || (previous === 0 && current === 0)) return null
  if (!previous) return null

  const pct = ((current - previous) / Math.abs(previous)) * 100
  if (!showWhenZero && Math.abs(pct) < 0.05) {
    return (
      <span className={`inline-flex items-center gap-0.5 text-[10px] text-[var(--color-muted-foreground)] ${className ?? ''}`}>
        <Minus className="w-2.5 h-2.5" /> 0%
      </span>
    )
  }

  const positive = pct >= 0
  const good = invertColors ? !positive : positive
  const color = good ? 'text-emerald-400' : 'text-red-400'
  const Icon = positive ? ArrowUp : ArrowDown
  const label = format ? format(pct) : `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`

  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${color} ${className ?? ''}`}>
      <Icon className="w-2.5 h-2.5" />
      {label}
    </span>
  )
}
