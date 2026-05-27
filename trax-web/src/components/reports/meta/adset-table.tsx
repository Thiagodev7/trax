'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Award, AlertTriangle } from 'lucide-react'
import { colorForMetric, MetaConfigShape, productColor, productLabel } from '@/lib/meta-heuristics'
import { fmtCurrency, fmtCurrency2, fmtNum, fmtPct, type AdsetRow } from './types'

type Col = 'name' | 'campaign' | 'product' | 'budget' | 'spend' | 'leads' | 'cpl' | 'ctr' | 'cpc' | 'cpm' | 'status'

interface Props {
  rows: AdsetRow[]
  config: MetaConfigShape
  onSelect?: (row: AdsetRow) => void
}

const PAGE_SIZES = [25, 50, 100]

export function AdsetTable({ rows, config, onSelect }: Props) {
  const [sortCol, setSortCol] = useState<Col>('spend')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [pageSize, setPageSize] = useState(50)
  const [page, setPage] = useState(0)

  const sorted = useMemo(() => {
    const arr = [...rows]
    arr.sort((a, b) => {
      const av = (a as unknown as Record<string, unknown>)[sortCol]
      const bv = (b as unknown as Record<string, unknown>)[sortCol]
      const an = typeof av === 'number' ? av : av == null ? -Infinity : String(av)
      const bn = typeof bv === 'number' ? bv : bv == null ? -Infinity : String(bv)
      if (typeof an === 'number' && typeof bn === 'number') {
        return sortDir === 'asc' ? an - bn : bn - an
      }
      const cmp = String(an).localeCompare(String(bn))
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [rows, sortCol, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const view = sorted.slice(page * pageSize, (page + 1) * pageSize)

  const top = sorted[0]
  const topId = top?.id
  const worstCplRow = [...sorted].filter((r) => r.cpl != null).sort((a, b) => (b.cpl as number) - (a.cpl as number))[0]
  const worstCplId = worstCplRow && worstCplRow.id !== topId ? worstCplRow.id : null

  function handleSort(col: Col) {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortCol(col)
      setSortDir('desc')
    }
  }

  function SortIcon({ col }: { col: Col }) {
    if (sortCol !== col) return null
    return sortDir === 'asc' ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />
  }

  return (
    <div className="card overflow-hidden border-[var(--color-border)]">
      <div className="p-4 border-b border-[var(--color-border)] flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">Conjuntos de Anúncios</h3>
          <p className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5">{sorted.length} resultado(s) · clique em uma linha para detalhes</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0) }}
            className="text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] py-1 px-2"
          >
            {PAGE_SIZES.map((s) => <option key={s} value={s}>{s} por página</option>)}
          </select>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="px-2 py-1 rounded border border-[var(--color-border)] disabled:opacity-30"
              >‹</button>
              <span className="text-[var(--color-muted-foreground)]">{page + 1}/{totalPages}</span>
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="px-2 py-1 rounded border border-[var(--color-border)] disabled:opacity-30"
              >›</button>
            </div>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-[var(--color-surface-2)] uppercase text-[10px] text-[var(--color-muted-foreground)] sticky top-0">
            <tr>
              <th className="w-6 px-2 py-2"></th>
              <th onClick={() => handleSort('name')} className="px-3 py-2 text-left cursor-pointer hover:text-[var(--color-foreground)]">Conjunto <SortIcon col="name" /></th>
              <th onClick={() => handleSort('campaign')} className="px-2 py-2 text-left cursor-pointer hover:text-[var(--color-foreground)]">Campanha <SortIcon col="campaign" /></th>
              <th onClick={() => handleSort('product')} className="px-2 py-2 text-left cursor-pointer hover:text-[var(--color-foreground)]">Produto <SortIcon col="product" /></th>
              <th onClick={() => handleSort('budget')} className="px-2 py-2 text-right cursor-pointer hover:text-[var(--color-foreground)]">Verba/dia <SortIcon col="budget" /></th>
              <th onClick={() => handleSort('spend')} className="px-2 py-2 text-right cursor-pointer hover:text-[var(--color-foreground)]">Gasto <SortIcon col="spend" /></th>
              <th onClick={() => handleSort('leads')} className="px-2 py-2 text-right cursor-pointer hover:text-[var(--color-foreground)]">Leads <SortIcon col="leads" /></th>
              <th onClick={() => handleSort('cpl')} className="px-2 py-2 text-right cursor-pointer hover:text-[var(--color-foreground)]">CPL <SortIcon col="cpl" /></th>
              <th onClick={() => handleSort('ctr')} className="px-2 py-2 text-right cursor-pointer hover:text-[var(--color-foreground)]">CTR <SortIcon col="ctr" /></th>
              <th onClick={() => handleSort('cpc')} className="px-2 py-2 text-right cursor-pointer hover:text-[var(--color-foreground)]">CPC <SortIcon col="cpc" /></th>
              <th onClick={() => handleSort('cpm')} className="px-2 py-2 text-right cursor-pointer hover:text-[var(--color-foreground)]">CPM <SortIcon col="cpm" /></th>
              <th className="px-2 py-2 text-right">Tags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {view.length === 0 && (
              <tr>
                <td colSpan={12} className="px-3 py-6 text-center text-[var(--color-muted-foreground)]">
                  Nenhum conjunto encontrado com os filtros aplicados.
                </td>
              </tr>
            )}
            {view.map((a) => {
              const isTop = a.id === topId
              const isWorst = a.id === worstCplId
              const maxLeads = sorted[0]?.leads ?? 1
              const leadsPct = maxLeads > 0 ? (a.leads / maxLeads) * 100 : 0
              return (
                <tr
                  key={a.id}
                  className="hover:bg-[var(--color-surface-2)] cursor-pointer transition-colors"
                  onClick={() => onSelect?.(a)}
                >
                  <td className="px-2 py-2 text-center">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${a.active ? 'bg-emerald-400' : 'bg-[var(--color-muted)]'}`} />
                  </td>
                  <td className="px-3 py-2 max-w-[260px] truncate font-medium" title={a.name}>{a.name}</td>
                  <td className="px-2 py-2">
                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-[var(--color-surface-2)] font-medium">{a.campaign}</span>
                  </td>
                  <td className="px-2 py-2">
                    {a.product ? (
                      <span
                        className="px-1.5 py-0.5 text-[10px] rounded font-medium"
                        style={{
                          background: `${productColor(a.product, config)}22`,
                          color: productColor(a.product, config),
                        }}
                      >
                        {productLabel(a.product, config)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-[var(--color-muted-foreground)]">—</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">{a.budget > 0 ? fmtCurrency2(a.budget) : '—'}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{fmtCurrency2(a.spend)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-semibold">{fmtNum(a.leads)}</span>
                      {a.leads > 0 && (
                        <div className="w-8 h-1 bg-[var(--color-surface-2)] rounded overflow-hidden">
                          <div className="h-full bg-[var(--color-primary)]" style={{ width: `${leadsPct}%` }} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums" style={a.cpl != null ? { color: colorForMetric('cpl', a.cpl, config) } : undefined}>
                    {a.cpl != null ? fmtCurrency2(a.cpl) : '—'}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums" style={{ color: colorForMetric('ctr', a.ctr, config) }}>{fmtPct(a.ctr)}</td>
                  <td className="px-2 py-2 text-right tabular-nums" style={{ color: colorForMetric('cpc', a.cpc, config) }}>{fmtCurrency2(a.cpc)}</td>
                  <td className="px-2 py-2 text-right tabular-nums" style={{ color: colorForMetric('cpm', a.cpm, config) }}>{fmtCurrency2(a.cpm)}</td>
                  <td className="px-2 py-2 text-right whitespace-nowrap">
                    {isTop && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-emerald-500/15 text-emerald-400">
                        <Award className="w-2.5 h-2.5" /> TOP
                      </span>
                    )}
                    {isWorst && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-red-500/15 text-red-400 ml-1">
                        <AlertTriangle className="w-2.5 h-2.5" /> CPL
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
