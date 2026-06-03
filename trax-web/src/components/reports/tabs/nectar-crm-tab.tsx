'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts'
import {
  Users, DollarSign, TrendingUp, Target, AlertCircle, RefreshCw, Zap,
} from 'lucide-react'
import { useApiClient } from '@/lib/api-client-browser'
import { useSharedApiClient } from '@/lib/shared-api-client'
import { reportMetricsPath } from '@/lib/report-metrics-path'

interface NectarMetrics {
  pipeline: {
    contatos: number
    qualificacao: number
    agendamento: number
    qualificada: number
    vendida: number
    perdidas: number
  } | null
  vendas: number
  receita: number
  ticketMedio: number
  mrr: number
  historico: Array<{ mes: string; ganhas: number; perdidas: number; receita: number }>
  funil: Array<{ etapa: string; quantidade: number; valor: number }>
  trend: Array<{ date: string; contacts: number }>
  cplCruzado: { spend: number; leads: number; cpl: number } | null
  syncedAt: string | null
  hasData: boolean
}

interface Props {
  reportId: string
  shareToken?: string
}

function fmtCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function KpiCard({
  label, value, sub, icon: Icon, color = 'text-[var(--color-primary)]',
}: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  color?: string
}) {
  return (
    <div className="card p-5 border-[var(--color-border)]">
      <div className="flex justify-between items-start mb-3">
        <p className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wide">{label}</p>
        <div className={`p-2 rounded-lg bg-[var(--color-surface-2)] ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-[var(--color-foreground)] tracking-tight">{value}</p>
      {sub && <p className="text-xs text-[var(--color-muted-foreground)] mt-1">{sub}</p>}
    </div>
  )
}

export function NectarCrmTab({ reportId, shareToken }: Props) {
  const authApi = useApiClient()
  const sharedApi = useSharedApiClient()
  const api = shareToken ? sharedApi : authApi

  const [metrics, setMetrics] = useState<NectarMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<NectarMetrics>(reportMetricsPath(reportId, 'nectar', shareToken))
      setMetrics(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar métricas Nectar')
    } finally {
      setLoading(false)
    }
  }, [api, reportId, shareToken])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse h-28 border-[var(--color-border)]" />
          ))}
        </div>
        <div className="card p-6 animate-pulse h-48 border-[var(--color-border)]" />
      </div>
    )
  }

  if (error || !metrics?.hasData || !metrics.pipeline) {
    return (
      <div className="card p-12 border-[var(--color-border)] text-center">
        <AlertCircle className="w-10 h-10 text-[var(--color-muted)] mx-auto mb-3" />
        <p className="font-medium text-[var(--color-foreground)]">Dados Nectar CRM não disponíveis</p>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1 max-w-sm mx-auto">
          {error || 'Sincronize a integração Nectar CRM para visualizar pipeline e receita.'}
        </p>
        <button
          onClick={fetchData}
          className="mt-4 text-sm text-[var(--color-primary)] hover:underline inline-flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" /> Tentar novamente
        </button>
      </div>
    )
  }

  const { pipeline, receita, ticketMedio, mrr, funil, historico, trend, cplCruzado, syncedAt } = metrics
  const maxFunil = funil[0]?.quantidade || 1

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-lg">🌿</span>
        <div>
          <p className="text-sm font-semibold text-[var(--color-foreground)]">Nectar CRM</p>
          {syncedAt && (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Sincronizado em {new Date(syncedAt).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Contatos" value={String(pipeline.contatos)} icon={Users} color="text-emerald-400" />
        <KpiCard label="Vendas" value={String(pipeline.vendida)} icon={Target} color="text-emerald-400" />
        <KpiCard label="Receita" value={fmtCurrency(receita)} icon={DollarSign} color="text-emerald-400" />
        <KpiCard label="MRR" value={fmtCurrency(mrr)} icon={TrendingUp} sub={`Ticket ${fmtCurrency(ticketMedio)}`} />
      </div>

      {cplCruzado && (
        <div className="card p-5 border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--color-foreground)] mb-1">CPL Cruzado</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Investimento em anúncios ÷ contatos no pipeline
              </p>
              <div className="flex flex-wrap items-center gap-6 mt-3">
                <div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">Investido</p>
                  <p className="text-lg font-bold">{fmtCurrency(cplCruzado.spend)}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">Contatos</p>
                  <p className="text-lg font-bold">{cplCruzado.leads}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">CPL</p>
                  <p className="text-2xl font-bold text-emerald-400">{fmtCurrency(cplCruzado.cpl)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {funil.length > 0 && (
        <div className="card p-6 border-[var(--color-border)]">
          <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-4">Funil de Vendas</h3>
          <div className="space-y-2">
            {funil.map((stage, i) => {
              const pct = (stage.quantidade / maxFunil) * 100
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-[var(--color-muted-foreground)] w-28 shrink-0">{stage.etapa}</span>
                  <div className="flex-1 h-7 bg-[var(--color-surface-2)] rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg flex items-center px-3 text-xs font-medium text-[var(--color-primary-foreground)]"
                      style={{ width: `${Math.max(pct, 4)}%`, background: 'var(--color-primary)', minWidth: '3rem' }}
                    >
                      {stage.quantidade}
                    </div>
                  </div>
                  <span className="text-xs w-20 text-right shrink-0">{fmtCurrency(stage.valor)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {trend.length > 0 && (
          <div className="card p-6 border-[var(--color-border)]">
            <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-4">Contatos por dia</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend.map((t) => ({ date: fmtDate(t.date), Contatos: t.contacts }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
                <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
                <Line type="monotone" dataKey="Contatos" stroke="#10B981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {historico.length > 0 && (
          <div className="card p-6 border-[var(--color-border)]">
            <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-4">Histórico mensal</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={historico}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
                <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
                <Bar dataKey="ganhas" name="Ganhas" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="receita" name="Receita" fill="#10B981" opacity={0.7} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
