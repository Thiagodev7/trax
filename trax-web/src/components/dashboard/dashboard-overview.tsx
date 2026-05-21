'use client'

import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import {
  TrendingUp, TrendingDown, CheckCircle, Clock, ExternalLink,
  ArrowRight, BarChart3, Users,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts'

const areaData = [
  { mes: 'Jan', Relatórios: 8, Clientes: 4 },
  { mes: 'Fev', Relatórios: 15, Clientes: 6 },
  { mes: 'Mar', Relatórios: 22, Clientes: 9 },
  { mes: 'Abr', Relatórios: 35, Clientes: 13 },
  { mes: 'Mai', Relatórios: 58, Clientes: 18 },
  { mes: 'Jun', Relatórios: 75, Clientes: 22 },
  { mes: 'Jul', Relatórios: 89, Clientes: 24 },
]

const barData = [
  { name: 'TechStore', relatórios: 12, fill: '#6366F1' },
  { name: 'Saúde Total', relatórios: 8, fill: '#818CF8' },
  { name: 'ImovStore', relatórios: 15, fill: '#F59E0B' },
  { name: 'SportMax', relatórios: 6, fill: '#10B981' },
  { name: 'Others', relatórios: 4, fill: '#64748B' },
]

interface DashboardChartsProps {
  recentClients?: Array<{
    id: string
    name: string
    logoUrl: string | null
    isActive: boolean
    _count?: { reports: number }
  }>
  recentReports?: Array<{
    id: string
    title: string
    status: 'DRAFT' | 'PUBLISHED'
    createdAt: string
    shareToken: string | null
    client: { name: string; logoUrl: string | null }
  }>
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3 shadow-xl">
        <p className="text-xs text-[var(--color-muted-foreground)] mb-2">{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-[var(--color-foreground)]">{p.name}: <strong>{p.value}</strong></span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function DashboardCharts({ recentClients = [], recentReports = [] }: DashboardChartsProps) {
  return (
    <div className="space-y-6">
      {/* Gráficos lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart — Crescimento */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="card p-6 border-[var(--color-border)] lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-[var(--color-foreground)]">Crescimento da Agência</h3>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">Últimos 7 meses</p>
            </div>
            <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
              <TrendingUp className="w-3 h-3" />
              +24% vs. mês anterior
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={areaData}>
              <defs>
                <linearGradient id="colorRelatorios" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorClientes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="mes" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="Relatórios"
                stroke="var(--color-primary)"
                strokeWidth={2}
                fill="url(#colorRelatorios)"
              />
              <Area
                type="monotone"
                dataKey="Clientes"
                stroke="var(--color-accent)"
                strokeWidth={2}
                fill="url(#colorClientes)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Bar Chart — Relatórios por cliente */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="card p-6 border-[var(--color-border)]"
        >
          <div className="mb-6">
            <h3 className="text-base font-semibold text-[var(--color-foreground)]">Por Cliente</h3>
            <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">Relatórios gerados</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} layout="vertical">
              <XAxis type="number" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={65}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="relatórios" radius={[0, 4, 4, 0]}>
                {barData.map((entry, index) => (
                  <rect key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recentes — Clientes + Relatórios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clientes Recentes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="card border-[var(--color-border)] overflow-hidden"
        >
          <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--color-primary)]" />
              <h3 className="text-sm font-semibold text-[var(--color-foreground)]">Clientes Recentes</h3>
            </div>
            <Link
              href="/clients"
              className="text-xs text-[var(--color-primary)] hover:text-[var(--color-primary)]/80 flex items-center gap-1 transition-colors"
            >
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {recentClients.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-[var(--color-muted-foreground)]">Nenhum cliente ainda</p>
                <Link
                  href="/clients/new"
                  className="text-xs text-[var(--color-primary)] hover:underline mt-1 block"
                >
                  Cadastrar primeiro cliente →
                </Link>
              </div>
            ) : (
              recentClients.slice(0, 5).map((client) => (
                <div key={client.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-surface-2)] transition-colors">
                  {client.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={client.logoUrl} alt={client.name} className="w-8 h-8 rounded-lg object-cover border border-[var(--color-border)]" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-primary)] font-bold text-sm">
                      {client.name[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-foreground)] truncate">{client.name}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">{client._count?.reports || 0} relatório(s)</p>
                  </div>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${client.isActive ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Relatórios Recentes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="card border-[var(--color-border)] overflow-hidden"
        >
          <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[var(--color-primary)]" />
              <h3 className="text-sm font-semibold text-[var(--color-foreground)]">Relatórios Recentes</h3>
            </div>
            <Link
              href="/reports"
              className="text-xs text-[var(--color-primary)] hover:text-[var(--color-primary)]/80 flex items-center gap-1 transition-colors"
            >
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {recentReports.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-[var(--color-muted-foreground)]">Nenhum relatório ainda</p>
                <Link
                  href="/reports/new"
                  className="text-xs text-[var(--color-primary)] hover:underline mt-1 block"
                >
                  Criar primeiro relatório →
                </Link>
              </div>
            ) : (
              recentReports.slice(0, 5).map((report) => (
                <Link
                  key={report.id}
                  href={`/reports/${report.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-surface-2)] transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-foreground)] truncate group-hover:text-[var(--color-primary)] transition-colors">
                      {report.title}
                    </p>
                    <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{report.client.name} · {format(new Date(report.createdAt), "dd/MM/yyyy")}</p>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                      report.status === 'PUBLISHED'
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}
                  >
                    {report.status === 'PUBLISHED' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {report.status === 'PUBLISHED' ? 'Publicado' : 'Rascunho'}
                  </span>
                </Link>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
