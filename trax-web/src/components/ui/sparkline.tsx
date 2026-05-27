'use client'

import React from 'react'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  fill?: boolean
  strokeWidth?: number
  className?: string
}

export function Sparkline({
  data,
  width = 80,
  height = 24,
  color = 'currentColor',
  fill = true,
  strokeWidth = 1.5,
  className,
}: SparklineProps) {
  if (!data || data.length < 2) {
    return <div style={{ width, height }} className={className} />
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const stepX = data.length > 1 ? width / (data.length - 1) : 0

  const points = data.map((v, i) => {
    const x = i * stepX
    const y = height - ((v - min) / span) * (height - 2) - 1
    return [x, y] as const
  })

  const pathLine = points
    .map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`))
    .join(' ')
  const pathArea = fill
    ? `${pathLine} L${points[points.length - 1][0]},${height} L${points[0][0]},${height} Z`
    : ''

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{ display: 'block' }}
    >
      {fill && <path d={pathArea} fill={color} fillOpacity={0.15} />}
      <path d={pathLine} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
