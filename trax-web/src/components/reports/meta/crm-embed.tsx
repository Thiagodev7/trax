'use client'

import { Users, DollarSign, TrendingUp, Activity } from 'lucide-react'
import { TrendChip } from '@/components/ui/trend-chip'
import { fmtCurrency, fmtNum, fmtPct, type CrmEmbed as CrmEmbedData, type MetaSummary } from './types'

interface Props {
  crm: CrmEmbedData
  metaSummary: MetaSummary
}

function crmSourceLabel(source?: string, primarySource?: string): string {
  if (primarySource === 'MERGED' || source === 'MERGED') return 'Combinado (RD + Nectar)'
  if (primarySource === 'RD_STATION' || source === 'RD_STATION') return 'RD Station'
  return 'Nectar CRM'
}

export function CrmEmbed({ crm, metaSummary }: Props) {
  if (!crm.pipeline) return null

  const sourceLabel = crmSourceLabel(crm.source, crm.primarySource)
  const pipeline = crm.pipeline
  const contatos = pipeline.contatos ?? 0
  const qualificacao = pipeline.qualificacao ?? 0
  const agendamento = pipeline.agendamento ?? 0
  const qualificada = pipeline.qualificada ?? 0
  const vendida = crm.vendas ?? pipeline.vendida ?? 0
  const perdidas = pipeline.perdidas ?? 0

  const leads = metaSummary.totalLeads
  const spend = metaSummary.totalSpend
  const receita = crm.receita ?? 0

  const leadToSale = leads > 0 ? (vendida / leads) * 100 : 0
  const costPerSale = vendida > 0 ? spend / vendida : 0
  const roas = spend > 0 ? receita / spend : 0

  const prev = crm.previousPeriod

  const stages = [
    { label: 'Contatos', value: contatos, color: '#6366F1' },
    { label: 'Qualificação', value: qualificacao, color: '#8B5CF6' },
    { label: 'Agendamento', value: agendamento, color: '#F59E0B' },
    { label: 'Qualificada', value: qualificada, color: '#10B981' },
    { label: 'Vendida', value: vendida, color: '#059669' },
  ]
  const max = Math.max(...stages.map((s) => s.value), 1)

  const leadToSaleColor = leadToSale >= 5 ? '#10B981' : leadToSale >= 2 ? '#F59E0B' : '#94A3B8'

  return (
    <div className="card p-5 border-[var(--color-border)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">CRM — origem Meta Ads</h3>
        <span className="text-[10px] uppercase text-[var(--color-muted-foreground)]">{sourceLabel}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-2">
          {stages.map((s) => {
            const pct = (s.value / max) * 100
            return (
              <div key={s.label} className="flex items-center gap-2 text-xs">
                <span className="w-24 shrink-0 text-[var(--color-muted-foreground)]">{s.label}</span>
                <div className="flex-1 h-5 bg-[var(--color-surface-2)] rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all"
                    style={{ width: `${pct}%`, background: s.color, minWidth: '2rem' }}
                  />
                </div>
                <span className="w-10 text-right tabular-nums font-semibold">{fmtNum(s.value)}</span>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-lg bg-[var(--color-surface-2)]">
            <p className="text-[10px] uppercase text-[var(--color-muted-foreground)] flex items-center gap-1"><Users className="w-3 h-3" /> Vendidos</p>
            <p className="text-lg font-bold text-emerald-400">{fmtNum(vendida)}</p>
            {prev && <TrendChip current={vendida} previous={prev.vendas} />}
          </div>
          <div className="p-3 rounded-lg bg-[var(--color-surface-2)]">
            <p className="text-[10px] uppercase text-[var(--color-muted-foreground)] flex items-center gap-1"><DollarSign className="w-3 h-3" /> Receita</p>
            <p className="text-lg font-bold text-emerald-400">{fmtCurrency(receita)}</p>
            {prev && <TrendChip current={receita} previous={prev.receita} />}
          </div>
          <div className="p-3 rounded-lg bg-[var(--color-surface-2)]">
            <p className="text-[10px] uppercase text-[var(--color-muted-foreground)] flex items-center gap-1"><Activity className="w-3 h-3" /> Custo/Venda</p>
            <p className="text-lg font-bold">{costPerSale > 0 ? fmtCurrency(costPerSale) : '—'}</p>
            <p className="text-[10px] text-[var(--color-muted-foreground)]">{perdidas} perdidos</p>
          </div>
          <div className="p-3 rounded-lg bg-[var(--color-surface-2)]">
            <p className="text-[10px] uppercase text-[var(--color-muted-foreground)] flex items-center gap-1"><TrendingUp className="w-3 h-3" /> ROAS / Lead→Venda</p>
            <p className="text-lg font-bold" style={{ color: leadToSaleColor }}>
              {roas > 0 ? `${roas.toFixed(2)}x` : fmtPct(leadToSale)}
            </p>
            <p className="text-[10px] text-[var(--color-muted-foreground)]">
              {leads} leads · {vendida} vendas
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
