'use client'

import { motion } from 'framer-motion'
import { getDeltaColor, getDeltaSign } from '@/lib/utils'

interface KpiCardProps {
  title: string
  value: string | number
  delta?: number
  icon: React.ReactNode
  subtitle?: string
  delay?: number
}

export function KpiCard({ title, value, delta, icon, subtitle, delay = 0 }: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="card p-6 flex flex-col justify-between group hover:border-[var(--color-primary)] transition-all duration-300 relative overflow-hidden cursor-default"
    >
      {/* Background glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)] to-transparent opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300 pointer-events-none" />
      
      {/* Brilho sutil no canto superior direito */}
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-[var(--color-primary)] opacity-0 group-hover:opacity-[0.06] blur-2xl transition-opacity duration-300 pointer-events-none" />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <p className="text-sm font-medium text-[var(--color-muted-foreground)]">{title}</p>
        <div className="p-2 rounded-lg bg-[var(--color-surface-2)] text-[var(--color-primary)] group-hover:scale-110 group-hover:bg-[var(--color-primary)]/10 transition-all duration-200">
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

      {/* Linha de destaque no fundo */}
      <div className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] transition-all duration-500 ease-out" />
    </motion.div>
  )
}
