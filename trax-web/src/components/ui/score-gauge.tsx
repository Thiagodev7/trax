'use client'

interface Props {
  score: number
  size?: number
  strokeWidth?: number
  label?: string
}

function colorForScore(score: number) {
  if (score >= 65) return '#10B981'
  if (score >= 40) return '#F59E0B'
  return '#EF4444'
}

function labelForScore(score: number) {
  if (score >= 65) return 'Bom'
  if (score >= 40) return 'Atenção'
  return 'Crítico'
}

export function ScoreGauge({ score, size = 120, strokeWidth = 8, label }: Props) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - score / 100)
  const color = colorForScore(score)

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-surface-2)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 600ms ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums">{score}</span>
          <span className="text-[10px] uppercase font-medium" style={{ color }}>
            {labelForScore(score)}
          </span>
        </div>
      </div>
      {label && <p className="text-xs text-[var(--color-muted-foreground)] mt-2">{label}</p>}
    </div>
  )
}
