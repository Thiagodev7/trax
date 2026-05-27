'use client'

import { useRef } from 'react'
import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react'
import { colorForMetric, MetaConfigShape } from '@/lib/meta-heuristics'
import { fmtCurrency, fmtCurrency2, fmtNum, type CreativeRow } from './types'

interface Props {
  creatives: CreativeRow[]
  config: MetaConfigShape
  onSelect?: (creative: CreativeRow) => void
}

export function CreativesCarousel({ creatives, config, onSelect }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  if (creatives.length === 0) return null

  function scroll(dir: 'prev' | 'next') {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: dir === 'next' ? 320 : -320, behavior: 'smooth' })
  }

  return (
    <div className="card p-5 border-[var(--color-border)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold">Performance por Criativo</h3>
          <p className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5">{creatives.length} criativo(s) · clique para detalhes</p>
        </div>
        <div className="hidden md:flex gap-1">
          <button type="button" onClick={() => scroll('prev')} className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-2)]">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => scroll('next')} className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-2)]">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div ref={ref} className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth">
        {creatives.map((c) => (
          <button
            type="button"
            key={c.ad_id}
            onClick={() => onSelect?.(c)}
            className="snap-start shrink-0 w-[220px] rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-2)]/40 hover:border-[var(--color-primary)]/50 transition-colors text-left"
          >
            <div className="relative aspect-square bg-[var(--color-surface-2)]">
              {c.thumbnailUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={c.thumbnailUrl} alt={c.ad_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-[var(--color-muted)]" />
                </div>
              )}
              {!c.active && (
                <span className="absolute top-2 right-2 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-black/60 text-white">
                  pausado
                </span>
              )}
              <span className="absolute bottom-2 left-2 text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-black/60 text-white">
                {c.campaign_code}
              </span>
            </div>
            <div className="p-3 space-y-1.5">
              <p className="text-xs font-medium line-clamp-2 min-h-[2rem]">{c.ad_name}</p>
              <div className="flex justify-between text-[11px]">
                <span className="text-[var(--color-muted-foreground)]">Leads</span>
                <span className="font-bold">{fmtNum(c.leads)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[var(--color-muted-foreground)]">CPL</span>
                <span className="font-bold" style={c.cpl != null ? { color: colorForMetric('cpl', c.cpl, config) } : undefined}>
                  {c.cpl != null ? fmtCurrency2(c.cpl) : '—'}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[var(--color-muted-foreground)]">Gasto</span>
                <span className="font-medium">{fmtCurrency(c.spend)}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
