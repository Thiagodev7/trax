'use client'

import { useEffect, useState, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { DollarSign, TrendingUp, Users, Target, AlertCircle, RefreshCw } from 'lucide-react'
import { useApiClient } from '@/lib/api-client-browser'

interface CrmMetrics {
  pipeline: {
    totalContatos: number
    oportunidadesAbertas: number
    oportunidadesGanhas: number
    oportunidadesPerdidas: number
  } | null
  vendas: number
  receita: number
  ticketMedio: number
  mrr: number
  historico: Array<{ mes: string; ganhas: number; perdidas: number; receita: number }>
  funil: Array<{ etapa: string; quantidade: number; valor: number }>
  syncedAt?: string
}

interface Props {
  reportId: string
  metaSpend?: number
}

function KpiCard({
  label, value, icon: Icon, sub, color = 'text-[var(--color-primary)]',
}: {
  label: string; value: string; icon: React.ElementType; sub?: string; color?: string
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

function fmtCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export function KpiTab({ reportId, metaSpend }: Props) {
  const api = useApiClient()
  const [metrics, setMetrics] = useState<CrmMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<CrmMetrics>(`/reports/${reportId}/metrics/crm`)
      setMetrics(data)
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar KPIs')
    } finally {
      setLoading(false)
    }
  }, [reportId])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="card p-5 animate-pulse h-28 border-[var(--color-border)]">
            <div className="h-3 bg-[var(--color-surface-2)] rounded w-20 mb-4" />
            <div className="h-7 bg-[var(--color-surface-2)] rounded w-28" />
          </div>
        ))}
      </div>
    )
  }

  if (error || !metrics?.pipeline) {
    return (
      <div className="card p-10 border-[var(--color-border)] text-center">
        <AlertCircle className="w-10 h-10 text-[var(--color-muted)] mx-auto mb-3" />
        <p className="font-medium text-[var(--color-foreground)]">Dados de CRM não disponíveis</p>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
          {error || 'Sincronize a integração Nectar CRM para visualizar os KPIs.'}
        </p>
        <button onClick={fetchData} className="mt-3 text-sm text-[var(--color-primary)] hover:underline inline-flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Tentar novamente
        </button>
      </div>
    )
  }

  const { pipeline, vendas, receita, ticketMedio, mrr, historico, funil } = metrics

  const cac = metaSpend && vendas > 0 ? metaSpend / vendas : 0
  const roas = metaSpend && metaSpend > 0 ? receita / metaSpend : 0
  const ltv72 = ticketMedio * 72

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Contatos (Mês)" value={String(pipeline?.totalContatos ?? 0)} icon={Users} />
        <KpiCard label="Vendas Fechadas" value={String(vendas)} icon={Target} color="text-emerald-400" />
        <KpiCard label="Receita Total" value={fmtCurrency(receita)} icon={DollarSign} color="text-emerald-400" />
        <KpiCard label="MRR" value={fmtCurrency(mrr)} icon={TrendingUp} />
        <KpiCard label="Ticket Médio" value={fmtCurrency(ticketMedio)} icon={DollarSign} />
        {cac > 0 && <KpiCard label="CAC" value={fmtCurrency(cac)} icon={Target} sub="Gasto Meta ÷ Vendas" />}
        {roas > 0 && <KpiCard label="ROAS" value={`${roas.toFixed(2)}x`} icon={TrendingUp} sub="Receita ÷ Gasto Meta" color="text-emerald-400" />}
        {ltv72 > 0 && <KpiCard label="LTV 72m" value={fmtCurrency(ltv72)} icon={TrendingUp} sub="Ticket Médio × 72" />}
      </div>

      {/* Funil */}
      {funil.length > 0 && (
        <div className="card p-6 border-[var(--color-border)]">
          <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-4">Funil de Vendas</h3>
          <div className="space-y-2">
            {funil.map((stage, i) => {
              const maxQty = funil[0]?.quantidade || 1
              const pct = (stage.quantidade / maxQty) * 100
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-[var(--color-muted-foreground)] w-28 shrink-0">{stage.etapa}</span>
                  <div className="flex-1 h-7 bg-[var(--color-surface-2)] rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg flex items-center px-3 text-xs font-medium text-[var(--color-primary-foreground)] transition-all duration-700"
                      style={{ width: `${pct}%`, background: 'var(--color-primary)', minWidth: '3rem' }}
                    >
                      {stage.quantidade}
                    </div>
                  </div>
                  <span className="text-xs text-[var(--color-muted-foreground)] w-16 text-right shrink-0">
                    {fmtCurrency(stage.valor)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Histórico mensal */}
      {historico.length > 0 && (
        <div className="card p-6 border-[var(--color-border)]">
          <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-4">Histórico Mensal</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={historico} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="mes" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
              <Bar dataKey="ganhas" name="Vendas Ganhas" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="perdidas" name="Perdidas" fill="#ef4444" opacity={0.6} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm">
              <thead className="text-xs text-[var(--color-muted-foreground)] uppercase">
                <tr>
                  <th className="py-2 text-left font-medium">Mês</th>
                  <th className="py-2 text-right font-medium">Vendas</th>
                  <th className="py-2 text-right font-medium">Perdidas</th>
                  <th className="py-2 text-right font-medium">Receita</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {historico.map((h, i) => (
                  <tr key={i} className="hover:bg-[var(--color-surface-2)] transition-colors">
                    <td className="py-2 text-[var(--color-foreground)]">{h.mes}</td>
                    <td className="py-2 text-right text-emerald-400">{h.ganhas}</td>
                    <td className="py-2 text-right text-red-400">{h.perdidas}</td>
                    <td className="py-2 text-right text-[var(--color-foreground)]">{fmtCurrency(h.receita)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
