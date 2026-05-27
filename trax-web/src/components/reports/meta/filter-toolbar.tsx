'use client'

import { Search } from 'lucide-react'
import type { MetaConfigShape } from '@/lib/meta-heuristics'
import type { StatusFilter } from './types'

interface Props {
  search: string
  onSearchChange: (v: string) => void
  status: StatusFilter
  onStatusChange: (v: StatusFilter) => void
  product: string
  onProductChange: (v: string) => void
  state: string
  onStateChange: (v: string) => void
  campaign: string
  onCampaignChange: (v: string) => void
  campaignCodes: string[]
  config: MetaConfigShape | null
}

export function FilterToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  product,
  onProductChange,
  state,
  onStateChange,
  campaign,
  onCampaignChange,
  campaignCodes,
  config,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-[var(--color-muted-foreground)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar conjunto, criativo…"
          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] focus:outline-none focus:border-[var(--color-primary)]"
        />
      </div>

      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
        className="text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] py-1.5 px-2"
      >
        <option value="all">Todos</option>
        <option value="active">Ativos</option>
        <option value="paused">Pausados</option>
      </select>

      {config && config.products.length > 0 && (
        <select
          value={product}
          onChange={(e) => onProductChange(e.target.value)}
          className="text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] py-1.5 px-2"
        >
          <option value="">Produto</option>
          {config.products.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>
      )}

      {config && config.states.length > 0 && (
        <select
          value={state}
          onChange={(e) => onStateChange(e.target.value)}
          className="text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] py-1.5 px-2"
        >
          <option value="">UF</option>
          {config.states.map((s) => (
            <option key={s.code} value={s.code}>
              {s.code}
            </option>
          ))}
        </select>
      )}

      {campaignCodes.length > 0 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onCampaignChange('all')}
            className={`px-2 py-1 text-[11px] rounded border ${
              campaign === 'all'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-[var(--color-border)] text-[var(--color-muted-foreground)]'
            }`}
          >
            Todas
          </button>
          {campaignCodes.slice(0, 5).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onCampaignChange(c)}
              className={`px-2 py-1 text-[11px] rounded border ${
                campaign === c
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-[var(--color-border)] text-[var(--color-muted-foreground)]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
