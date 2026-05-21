'use client'

import { motion } from 'framer-motion'
import { getDeltaColor, getDeltaSign } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface KpiCardProps {
  title: string
  value: string | number
  delta?: number
  icon: React.ReactNode
  subtitle?: string
  delay?: number
  loading?: boolean
}

export function KpiCard({ title, value, delta, icon, subtitle, delay = 0, loading = false }: KpiCardProps) {
  if (loading) {
    return (
      <Card className="p-6 flex flex-col justify-between gap-4">
        <div className="flex justify-between items-start">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-9 rounded-[var(--radius-md)]" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="p-6 flex flex-col justify-between group hover:border-[var(--color-primary)] transition-all duration-300 relative overflow-hidden cursor-default h-full">
        {/* Background glow on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)] to-transparent opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300 pointer-events-none" />
        <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-[var(--color-primary)] opacity-0 group-hover:opacity-[0.06] blur-2xl transition-opacity duration-300 pointer-events-none" />

        <div className="flex justify-between items-start mb-4 relative z-10">
          <p className="text-sm font-medium text-[var(--color-muted-foreground)]">{title}</p>
          <div className="p-2 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] text-[var(--color-primary)] group-hover:scale-110 group-hover:bg-[var(--color-primary)]/10 transition-all duration-200">
            {icon}
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-baseline gap-2">
            <h4 className="text-3xl font-bold text-[var(--color-foreground)] tracking-tight">
              {value}
            </h4>
            {delta !== undefined && (
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-white/5 flex items-center gap-0.5 ${getDeltaColor(delta)}`}
              >
                {getDeltaSign(delta)}{Math.abs(delta)}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-[var(--color-muted)] mt-1.5">{subtitle}</p>
          )}
        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] transition-all duration-500 ease-out" />
      </Card>
    </motion.div>
  )
}
