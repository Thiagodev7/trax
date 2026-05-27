'use client'

import { Zap, AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { MetaConfigShape } from '@/lib/meta-heuristics'
import { fmtNum, fmtPct, type AdsetRow, type CreativeRow, type MetaSummary } from './types'

interface Insight {
  level: 'good' | 'warn' | 'bad'
  text: string
}

function generateInsights(
  summary: MetaSummary,
  adsets: AdsetRow[],
  creatives: CreativeRow[],
  config: MetaConfigShape,
): Insight[] {
  const t = config.thresholds
  const out: Insight[] = []

  if (summary.ctr >= t.ctr.good) out.push({ level: 'good', text: `CTR excelente (${summary.ctr.toFixed(2)}%) — criativos estão performando acima da média.` })
  else if (summary.ctr < t.ctr.warn) out.push({ level: 'bad', text: `CTR baixo (${summary.ctr.toFixed(2)}%) — considere renovar criativos ou ajustar público.` })

  if (summary.cpl > 0 && summary.cpl <= t.cpl.warn) out.push({ level: 'good', text: `CPL saudável (R$ ${summary.cpl.toFixed(2)}).` })
  else if (summary.cpl > t.cpl.bad) out.push({ level: 'bad', text: `CPL elevado (R$ ${summary.cpl.toFixed(2)}) — revise segmentação e landing pages.` })
  else if (summary.cpl > t.cpl.warn) out.push({ level: 'warn', text: `CPL acima do ideal (R$ ${summary.cpl.toFixed(2)}).` })

  if (summary.cpc > t.cpc.bad) out.push({ level: 'bad', text: `CPC alto (R$ ${summary.cpc.toFixed(2)}) — otimize lances ou qualidade dos anúncios.` })
  else if (summary.cpc > t.cpc.warn) out.push({ level: 'warn', text: `CPC subindo (R$ ${summary.cpc.toFixed(2)}).` })

  if (summary.cpm > t.cpm.bad) out.push({ level: 'warn', text: `CPM alto (R$ ${summary.cpm.toFixed(2)}) — leilão competitivo, considere ampliar público.` })

  const cvr = summary.cvr
  if (cvr >= 8) out.push({ level: 'good', text: `Taxa de conversão clique→lead em ${fmtPct(cvr)}.` })
  else if (cvr > 0 && cvr < 3) out.push({ level: 'warn', text: `Conversão clique→lead em ${fmtPct(cvr)} — landing page pode estar perdendo leads.` })

  const activeAdsets = adsets.filter((a) => a.active).length
  if (activeAdsets > 10) out.push({ level: 'warn', text: `${activeAdsets} conjuntos ativos — fragmentação pode prejudicar aprendizado.` })

  const top = [...creatives].sort((a, b) => b.leads - a.leads)[0]
  if (top && top.leads > 0) out.push({ level: 'good', text: `Melhor criativo: "${top.ad_name}" com ${top.leads} leads.` })

  const noLeadsHighSpend = adsets.filter((a) => a.leads === 0 && a.spend > 100)
  if (noLeadsHighSpend.length > 0) {
    out.push({ level: 'bad', text: `${noLeadsHighSpend.length} conjunto(s) gastaram acima de R$ 100 sem leads — avalie pausar.` })
  }

  if (summary.totalLeads === 0 && summary.totalSpend > 0) {
    out.push({ level: 'bad', text: 'Investimento sem leads — verifique pixel e formulário de captura.' })
  }

  return out.slice(0, 8)
}

interface Props {
  summary: MetaSummary
  adsets: AdsetRow[]
  creatives: CreativeRow[]
  config: MetaConfigShape
}

function levelStyles(level: Insight['level']) {
  if (level === 'good') return { border: 'border-emerald-500/50', bg: 'bg-emerald-500/10', icon: CheckCircle2, color: 'text-emerald-400' }
  if (level === 'warn') return { border: 'border-amber-500/50', bg: 'bg-amber-500/10', icon: AlertTriangle, color: 'text-amber-400' }
  return { border: 'border-red-500/50', bg: 'bg-red-500/10', icon: AlertTriangle, color: 'text-red-400' }
}

export function FunnelInsights({ summary, adsets, creatives, config }: Props) {
  const insights = generateInsights(summary, adsets, creatives, config)

  const funnel = [
    { name: 'Impressões', value: summary.totalImpressions },
    { name: 'Cliques', value: summary.totalClicks },
    { name: 'Leads', value: summary.totalLeads },
  ]
  const max = funnel[0].value || 1

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <div className="card p-5 border-[var(--color-border)]">
        <h3 className="text-sm font-semibold mb-4">Funil de Conversão</h3>
        <div className="space-y-3">
          {funnel.map((f, i) => {
            const pct = (f.value / max) * 100
            const conv = i > 0 ? (f.value / funnel[i - 1].value) * 100 : 100
            return (
              <div key={f.name}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="font-medium">{f.name}</span>
                  <span className="tabular-nums text-[var(--color-muted-foreground)]">
                    {fmtNum(f.value)}
                    {i > 0 && Number.isFinite(conv) && ` · ${conv.toFixed(1)}%`}
                  </span>
                </div>
                <div className="h-4 bg-[var(--color-surface-2)] rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all"
                    style={{ width: `${pct}%`, background: 'var(--color-primary)' }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card p-5 border-[var(--color-border)] lg:col-span-2">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold">Insights Automáticos</h3>
        </div>
        {insights.length === 0 ? (
          <p className="text-xs text-[var(--color-muted-foreground)]">Nenhum insight para o período.</p>
        ) : (
          <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
            {insights.map((ins, i) => {
              const s = levelStyles(ins.level)
              const Icon = s.icon
              return (
                <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg border-l-4 ${s.border} ${s.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${s.color} shrink-0 mt-0.5`} />
                  <p className="text-xs leading-relaxed text-[var(--color-foreground)]">{ins.text}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
