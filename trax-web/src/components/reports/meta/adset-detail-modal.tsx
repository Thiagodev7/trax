'use client'

import { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, BarChart, Legend } from 'recharts'
import { ImageIcon, Loader2, X } from 'lucide-react'
import { useApiClient } from '@/lib/api-client-browser'
import { useSharedApiClient } from '@/lib/shared-api-client'
import { reportMetricsPath } from '@/lib/report-metrics-path'
import { colorForMetric, MetaConfigShape, productColor, productLabel } from '@/lib/meta-heuristics'
import { fmtCurrency, fmtCurrency2, fmtNum, fmtPct, type AdsetDetail } from './types'

interface Props {
  reportId: string
  adsetId: string
  startDate?: string
  endDate?: string
  config: MetaConfigShape
  shareToken?: string
  onClose: () => void
}

export function AdsetDetailModal({ reportId, adsetId, startDate, endDate, config, shareToken, onClose }: Props) {
  const authApi = useApiClient()
  const sharedApi = useSharedApiClient()
  const api = shareToken ? sharedApi : authApi
  const [data, setData] = useState<AdsetDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    const params = new URLSearchParams()
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    api.get<AdsetDetail>(`${reportMetricsPath(reportId, `meta-ads/adsets/${adsetId}`, shareToken)}?${params.toString()}`)
      .then((d) => { if (mounted) setData(d) })
      .catch((e) => { if (mounted) setError(e instanceof Error ? e.message : 'Erro') })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [api, reportId, adsetId, shareToken, startDate, endDate])

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-[var(--color-surface)] flex items-start justify-between gap-3 p-5 border-b border-[var(--color-border)]">
          <div className="min-w-0">
            <p className="text-[10px] uppercase text-[var(--color-muted-foreground)]">Detalhe do conjunto</p>
            <h3 className="text-lg font-bold truncate">{data?.name ?? 'Carregando…'}</h3>
            {data && (
              <div className="flex items-center gap-2 mt-1.5">
                <span className="px-1.5 py-0.5 text-[10px] rounded bg-[var(--color-surface-2)] font-medium">{data.campaign}</span>
                {data.product && (
                  <span className="px-1.5 py-0.5 text-[10px] rounded font-medium" style={{ background: `${productColor(data.product, config)}22`, color: productColor(data.product, config) }}>
                    {productLabel(data.product, config)}
                  </span>
                )}
                {data.states.length > 0 && (
                  <span className="text-[10px] text-[var(--color-muted-foreground)]">UF: {data.states.join(', ')}</span>
                )}
                <span className="text-[10px] text-[var(--color-muted-foreground)] uppercase">{data.status}</span>
              </div>
            )}
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {loading && (
            <div className="flex items-center justify-center py-10 text-sm text-[var(--color-muted-foreground)] gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400">Erro: {error}</p>
          )}

          {data && !loading && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-[var(--color-surface-2)]">
                  <p className="text-[10px] uppercase text-[var(--color-muted-foreground)]">Gasto</p>
                  <p className="text-lg font-bold">{fmtCurrency(data.totals.spend)}</p>
                </div>
                <div className="p-3 rounded-lg bg-[var(--color-surface-2)]">
                  <p className="text-[10px] uppercase text-[var(--color-muted-foreground)]">Leads</p>
                  <p className="text-lg font-bold">{fmtNum(data.totals.leads)}</p>
                </div>
                <div className="p-3 rounded-lg bg-[var(--color-surface-2)]">
                  <p className="text-[10px] uppercase text-[var(--color-muted-foreground)]">CPL</p>
                  <p className="text-lg font-bold" style={data.totals.cpl > 0 ? { color: colorForMetric('cpl', data.totals.cpl, config) } : undefined}>
                    {data.totals.cpl > 0 ? fmtCurrency2(data.totals.cpl) : '—'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[var(--color-surface-2)]">
                  <p className="text-[10px] uppercase text-[var(--color-muted-foreground)]">CTR</p>
                  <p className="text-lg font-bold" style={{ color: colorForMetric('ctr', data.totals.ctr, config) }}>{fmtPct(data.totals.ctr)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-2 rounded bg-[var(--color-surface-2)]/50">
                  <p className="text-[10px] uppercase text-[var(--color-muted-foreground)]">Verba/dia</p>
                  <p className="font-semibold">{data.dailyBudget > 0 ? fmtCurrency2(data.dailyBudget) : '—'}</p>
                </div>
                <div className="p-2 rounded bg-[var(--color-surface-2)]/50">
                  <p className="text-[10px] uppercase text-[var(--color-muted-foreground)]">Cliques</p>
                  <p className="font-semibold">{fmtNum(data.totals.clicks)}</p>
                </div>
                <div className="p-2 rounded bg-[var(--color-surface-2)]/50">
                  <p className="text-[10px] uppercase text-[var(--color-muted-foreground)]">Impressões</p>
                  <p className="font-semibold">{fmtNum(data.totals.impressions)}</p>
                </div>
                <div className="p-2 rounded bg-[var(--color-surface-2)]/50">
                  <p className="text-[10px] uppercase text-[var(--color-muted-foreground)]">CPM</p>
                  <p className="font-semibold" style={{ color: colorForMetric('cpm', data.totals.cpm, config) }}>{fmtCurrency2(data.totals.cpm)}</p>
                </div>
              </div>

              {data.dailySeries.length > 0 && (
                <div className="card p-4 border-[var(--color-border)]">
                  <h4 className="text-xs font-semibold mb-3">Evolução diária</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={data.dailySeries.map((p) => ({ ...p, date: p.date.slice(5) }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '11px' }} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Area yAxisId="left" type="monotone" dataKey="leads" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.2} strokeWidth={2} name="Leads" />
                      <Area yAxisId="right" type="monotone" dataKey="spend" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.15} strokeWidth={2} name="Gasto" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {data.ads.length > 0 && (
                <div className="card p-4 border-[var(--color-border)]">
                  <h4 className="text-xs font-semibold mb-3">Anúncios deste conjunto ({data.ads.length})</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {data.ads.map((ad) => (
                      <a
                        key={ad.ad_id}
                        href={ad.permalink ?? '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg overflow-hidden border border-[var(--color-border)] block hover:border-[var(--color-primary)]/50"
                      >
                        <div className="aspect-square bg-[var(--color-surface-2)] relative">
                          {ad.thumbnailUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={ad.thumbnailUrl} alt={ad.ad_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-[var(--color-muted)]" />
                            </div>
                          )}
                        </div>
                        <div className="p-2">
                          <p className="text-[10px] font-medium line-clamp-2 min-h-[2rem]">{ad.ad_name}</p>
                          <div className="text-[10px] text-[var(--color-muted-foreground)] mt-1 flex justify-between">
                            <span>{fmtNum(ad.leads)} leads</span>
                            <span>{ad.cpl != null ? fmtCurrency2(ad.cpl) : '—'}</span>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
