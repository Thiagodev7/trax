'use client'

import { useState } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { DailyPoint } from './types'

interface Props {
  dailyData: DailyPoint[]
}

type MetricKey = 'cpc' | 'cpm' | 'ctr'

const METRIC_LABEL: Record<MetricKey, string> = {
  cpc: 'CPC',
  cpm: 'CPM',
  ctr: 'CTR',
}

export function ChartsRow({ dailyData }: Props) {
  const [metric, setMetric] = useState<MetricKey>('cpc')

  const metricData = dailyData.map((d) => ({
    date: d.date.slice(5),
    cpc: d.clicks > 0 ? d.spend / d.clicks : 0,
    cpm: d.impressions > 0 ? (d.spend / d.impressions) * 1000 : 0,
    ctr: d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0,
  }))

  const leadsData = dailyData.map((d) => ({ date: d.date.slice(5), leads: d.leads, spend: d.spend }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <div className="card p-5 border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Evolução de Leads</h3>
          <p className="text-[10px] text-[var(--color-muted-foreground)]">Volume diário</p>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={leadsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '11px' }} />
            <Area type="monotone" dataKey="leads" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.2} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-5 border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Métricas de Custo</h3>
          <div className="flex gap-1">
            {(['cpc', 'cpm', 'ctr'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMetric(m)}
                className={`px-2 py-1 text-[10px] font-semibold rounded uppercase ${
                  metric === m
                    ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                    : 'bg-[var(--color-surface-2)] text-[var(--color-muted-foreground)]'
                }`}
              >
                {METRIC_LABEL[m]}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={metricData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '11px' }} />
            <Bar dataKey={metric} fill="#F59E0B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
