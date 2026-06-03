'use client'

import { ExternalLink, ImageIcon, X } from 'lucide-react'
import { colorForMetric, MetaConfigShape } from '@/lib/meta-heuristics'
import { fmtCurrency, fmtCurrency2, fmtNum, fmtPct, type CreativeRow } from './types'

interface Props {
  creative: CreativeRow
  config: MetaConfigShape
  onClose: () => void
}

export function CreativeDetailModal({ creative, config, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-5 border-b border-[var(--color-border)]">
          <div className="min-w-0">
            <p className="text-[10px] uppercase text-[var(--color-muted-foreground)]">Criativo</p>
            <h3 className="text-base font-bold truncate">{creative.ad_name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-[var(--color-surface-2)] font-medium">{creative.campaign_code}</span>
              <span className={`text-[10px] uppercase ${creative.active ? 'text-emerald-400' : 'text-[var(--color-muted-foreground)]'}`}>
                {creative.status}
              </span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="aspect-square max-h-[400px] rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-2)] mx-auto flex items-center justify-center">
            {creative.thumbnailUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={creative.thumbnailUrl} alt={creative.ad_name} className="max-h-full w-auto object-contain" />
            ) : (
              <ImageIcon className="w-12 h-12 text-[var(--color-muted)]" />
            )}
          </div>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            <div className="p-2 rounded bg-[var(--color-surface-2)]">
              <p className="text-[10px] uppercase text-[var(--color-muted-foreground)]">Gasto</p>
              <p className="font-bold">{fmtCurrency(creative.spend)}</p>
            </div>
            <div className="p-2 rounded bg-[var(--color-surface-2)]">
              <p className="text-[10px] uppercase text-[var(--color-muted-foreground)]">Leads</p>
              <p className="font-bold">{fmtNum(creative.leads)}</p>
            </div>
            <div className="p-2 rounded bg-[var(--color-surface-2)]">
              <p className="text-[10px] uppercase text-[var(--color-muted-foreground)]">CPL</p>
              <p className="font-bold" style={creative.cpl != null ? { color: colorForMetric('cpl', creative.cpl, config) } : undefined}>
                {creative.cpl != null ? fmtCurrency2(creative.cpl) : '—'}
              </p>
            </div>
            <div className="p-2 rounded bg-[var(--color-surface-2)]">
              <p className="text-[10px] uppercase text-[var(--color-muted-foreground)]">CTR</p>
              <p className="font-bold" style={{ color: colorForMetric('ctr', creative.ctr, config) }}>{fmtPct(creative.ctr)}</p>
            </div>
            <div className="p-2 rounded bg-[var(--color-surface-2)]">
              <p className="text-[10px] uppercase text-[var(--color-muted-foreground)]">CPC</p>
              <p className="font-bold" style={{ color: colorForMetric('cpc', creative.cpc, config) }}>{fmtCurrency2(creative.cpc)}</p>
            </div>
            <div className="p-2 rounded bg-[var(--color-surface-2)]">
              <p className="text-[10px] uppercase text-[var(--color-muted-foreground)]">Cliques</p>
              <p className="font-bold">{fmtNum(creative.clicks)}</p>
            </div>
          </div>

          {creative.permalink?.trim() && (
            <a
              href={creative.permalink.trim()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[var(--color-primary)] hover:underline"
            >
              Abrir no Facebook <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
