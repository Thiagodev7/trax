'use client'

import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import {
  TrendingUp, CheckCircle, Clock,
  ArrowRight, BarChart3, Users,
  Activity, Plus, FileText, Plug
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts'
import { Card } from '@/components/ui/card'

const BAR_CHART_COLORS = [
  'var(--color-primary)',
  'var(--color-secondary)',
  'var(--color-accent)',
  'var(--color-success)',
  'var(--color-muted)',
]

interface DashboardChartsProps {
  chartData: Array<{ mes: string; Relatórios: number; Clientes: number }>
  barData: Array<{ name: string; relatórios: number }>
  activities: Array<{
    id: string
    type: 'CLIENT' | 'REPORT' | 'INTEGRATION'
    title: string
    subtitle: string
    date: Date
    link: string
    status?: string
  }>
}

const ChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] p-3 shadow-xl">
        <p className="text-xs text-[var(--color-muted-foreground)] mb-2">{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-[var(--color-foreground)]">
              {p.name}: <strong>{p.value}</strong>
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function DashboardCharts({ chartData, barData, activities }: DashboardChartsProps) {
  return (
    <div className="space-y-6">
      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-semibold text-[var(--color-foreground)]">Crescimento da Agência</h3>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">Evolução nos últimos 6 meses</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gradRelatorios" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradClientes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="mes"
                  tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="Relatórios"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#gradRelatorios)"
                />
                <Area
                  type="monotone"
                  dataKey="Clientes"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  fill="url(#gradClientes)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="p-6">
            <div className="mb-6">
              <h3 className="text-base font-semibold text-[var(--color-foreground)]">Top Clientes</h3>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">Por volume de relatórios</p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} layout="vertical">
                <XAxis
                  type="number"
                  tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={65}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="relatórios" radius={[0, 4, 4, 0]}>
                  {barData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={BAR_CHART_COLORS[index % BAR_CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </div>

      {/* Activity Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="overflow-hidden">
          <div className="p-5 border-b border-[var(--color-border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[var(--color-primary)]" />
              <h3 className="text-sm font-semibold text-[var(--color-foreground)]">Feed de Atividades</h3>
            </div>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {activities.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-[var(--color-muted-foreground)]">Nenhuma atividade recente.</p>
              </div>
            ) : (
              activities.map((activity) => {
                let Icon = FileText;
                let bgClass = 'bg-sky-500/10 text-sky-400';
                
                if (activity.type === 'CLIENT') {
                  Icon = Users;
                  bgClass = 'bg-emerald-500/10 text-emerald-400';
                } else if (activity.type === 'INTEGRATION') {
                  Icon = Plug;
                  bgClass = 'bg-violet-500/10 text-violet-400';
                }

                return (
                  <Link
                    key={activity.id}
                    href={activity.link}
                    className="flex items-start gap-4 px-5 py-4 hover:bg-[var(--color-surface-2)] transition-colors group"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bgClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-foreground)] group-hover:text-[var(--color-primary)] transition-colors">
                        {activity.title}
                      </p>
                      <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                        {activity.subtitle}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[var(--color-muted)]">
                        {format(activity.date, "dd MMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                      {activity.status && (
                        <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-muted-foreground)]">
                          {activity.status}
                        </span>
                      )}
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
