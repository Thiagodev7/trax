'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Calendar, Building2, Globe, Share2, CheckCircle, Clock,
  TrendingUp, TrendingDown, MousePointerClick, Eye, DollarSign, BarChart3, Copy, ExternalLink
} from 'lucide-react'
import { useApiClient } from '@/lib/api-client-browser'
import { toast } from 'sonner'

interface Widget {
  type: 'kpi' | 'chart_line' | 'chart_bar'
  metric: string
  label: string
  value?: number
  delta?: number
}

interface Report {
  id: string
  title: string
  description?: string
  status: 'DRAFT' | 'PUBLISHED'
  periodStart: string
  periodEnd: string
  publishedAt: string | null
  createdAt: string
  shareToken: string | null
  layoutJson: { widgets: Widget[] } | null
  client: {
    id: string
    name: string
    logoUrl: string | null
    website?: string
  }
}

const METRIC_ICONS: Record<string, React.ElementType> = {
  clicks: MousePointerClick,
  impressions: Eye,
  conversions: CheckCircle,
  roas: TrendingUp,
  ctr: BarChart3,
  cpl: DollarSign,
  reach: Globe,
  default: TrendingUp,
}

function KpiWidget({ widget, index }: { widget: Widget; index: number }) {
  const isPositive = (widget.delta ?? 0) > 0
  const isNeutral = widget.delta === undefined || widget.delta === 0
  const Icon = METRIC_ICONS[widget.metric] || METRIC_ICONS.default

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      className="card p-6 border-[var(--color-border)] group hover:border-[var(--color-primary)] transition-all relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)] to-transparent opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300" />
      <div className="flex justify-between items-start mb-4">
        <p className="text-sm font-medium text-[var(--color-muted-foreground)]">{widget.label}</p>
        <div className="p-2 rounded-lg bg-[var(--color-surface-2)] text-[var(--color-primary)] group-hover:scale-110 transition-transform">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold text-[var(--color-foreground)] tracking-tight">
          {typeof widget.value === 'number' ? widget.value.toLocaleString('pt-BR') : '—'}
        </p>
        {!isNeutral && (
          <span
            className={`text-sm font-medium px-1.5 py-0.5 rounded-full bg-white/5 flex items-center gap-0.5 ${
              isPositive ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isPositive ? '+' : ''}{widget.delta}%
          </span>
        )}
      </div>
    </motion.div>
  )
}

function ChartPlaceholder({ widget, index }: { widget: Widget; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      className="card p-6 border-[var(--color-border)] col-span-1 md:col-span-2 lg:col-span-4"
    >
      <h3 className="text-sm font-medium text-[var(--color-muted-foreground)] mb-4">{widget.label}</h3>
      {/* Gráfico simulado com barras animadas */}
      <div className="flex items-end gap-2 h-40">
        {[65, 42, 78, 55, 90, 67, 83, 50, 72, 88, 61, 95].map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ duration: 0.6, delay: i * 0.05, ease: 'easeOut' }}
            className="flex-1 rounded-t-md opacity-80"
            style={{
              background: `linear-gradient(to top, var(--color-primary), var(--color-secondary))`,
            }}
          />
        ))}
      </div>
      <p className="text-xs text-[var(--color-muted)] mt-3 text-center">
        Integração com dados reais em breve · Exibindo dados simulados
      </p>
    </motion.div>
  )
}

export function ReportViewer({ report }: { report: Report }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const api = useApiClient()
  const widgets = report.layoutJson?.widgets || []
  const kpiWidgets = widgets.filter((w) => w.type === 'kpi')
  const chartWidgets = widgets.filter((w) => w.type === 'chart_line' || w.type === 'chart_bar')

  async function handlePublish() {
    try {
      const updated = await api.patch<any>(`/reports/${report.id}/publish`, {})
      toast.success('Relatório publicado! Compartilhe o link com seu cliente.')
      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      toast.error(error.message || 'Erro ao publicar relatório')
    }
  }

  function handleCopyLink() {
    if (!report.shareToken) return
    const url = `${window.location.origin}/share/${report.shareToken}`
    navigator.clipboard.writeText(url)
    toast.success('Link copiado!')
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header do relatório */}
      <div className="flex items-start gap-4">
        <Link
          href="/reports"
          className="p-2 -ml-2 rounded-lg text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] transition-colors shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold text-[var(--color-foreground)] tracking-tight leading-tight">
                {report.title}
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {/* Cliente */}
                <div className="flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)]">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{report.client.name}</span>
                </div>
                {/* Período */}
                <div className="flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {format(new Date(report.periodStart), "dd 'de' MMM", { locale: ptBR })} —{' '}
                    {format(new Date(report.periodEnd), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                  </span>
                </div>
                {/* Status badge */}
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    report.status === 'PUBLISHED'
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  }`}
                >
                  {report.status === 'PUBLISHED' ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <Clock className="w-3 h-3" />
                  )}
                  {report.status === 'PUBLISHED' ? 'Publicado' : 'Rascunho'}
                </span>
              </div>
              {report.description && (
                <p className="mt-3 text-sm text-[var(--color-muted-foreground)] max-w-2xl">
                  {report.description}
                </p>
              )}
            </div>

            {/* Botões de ação */}
            <div className="flex items-center gap-2 shrink-0">
              {report.status === 'DRAFT' && (
                <button
                  onClick={handlePublish}
                  disabled={isPending}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] rounded-lg hover:opacity-90 transition-all shadow-sm glow-primary disabled:opacity-60"
                >
                  <Globe className="w-4 h-4" />
                  Publicar Relatório
                </button>
              )}
              {report.status === 'PUBLISHED' && report.shareToken && (
                <>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--color-foreground)] bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface)] transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Copiar Link
                  </button>
                  <a
                    href={`/share/${report.shareToken}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] rounded-lg hover:opacity-90 transition-all shadow-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ver Público
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      {kpiWidgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiWidgets.map((w, i) => (
            <KpiWidget key={i} widget={w} index={i} />
          ))}
        </div>
      ) : (
        <div className="card p-12 border-[var(--color-border)] border-dashed text-center">
          <BarChart3 className="w-10 h-10 text-[var(--color-muted)] mx-auto mb-3" />
          <p className="font-medium text-[var(--color-foreground)]">Sem widgets de KPI</p>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            Os dados aparecerão aqui quando as integrações estiverem ativas.
          </p>
        </div>
      )}

      {/* Charts */}
      {chartWidgets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {chartWidgets.map((w, i) => (
            <ChartPlaceholder key={i} widget={w} index={i + kpiWidgets.length} />
          ))}
        </div>
      )}
    </div>
  )
}
