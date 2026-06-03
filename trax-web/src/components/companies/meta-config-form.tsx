'use client'

import { useState } from 'react'
import { Plus, Save, Sparkles, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useApiClient } from '@/lib/api-client-browser'
import type { MetaConfigShape } from '@/lib/meta-heuristics'

interface Props {
  companyId: string
  initialConfig: MetaConfigShape
}

type Tab = 'products' | 'states' | 'distribution' | 'thresholds'

export function MetaConfigForm({ companyId, initialConfig }: Props) {
  const api = useApiClient()
  const [tab, setTab] = useState<Tab>('products')
  const [config, setConfig] = useState<MetaConfigShape>(initialConfig)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await api.put(`/companies/${companyId}/meta-config`, config)
      toast.success('Configuração salva!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    if (!confirm('Restaurar template Tron padrão? Isso sobrescreve sua configuração atual.')) return
    setSaving(true)
    try {
      const fresh = await api.post<MetaConfigShape>(`/companies/${companyId}/meta-config/reset`, {})
      setConfig(fresh)
      toast.success('Template restaurado.')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao restaurar')
    } finally {
      setSaving(false)
    }
  }

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'products', label: 'Produtos' },
    { id: 'states', label: 'Estados' },
    { id: 'distribution', label: 'Distribuição UF' },
    { id: 'thresholds', label: 'Thresholds' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1 p-1 bg-[var(--color-surface-2)] rounded-xl border border-[var(--color-border)] overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap ${
                tab === t.id ? 'bg-[var(--color-surface)] shadow' : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] inline-flex items-center gap-1 disabled:opacity-50"
          >
            <Sparkles className="w-3 h-3" /> Template Tron
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="text-xs px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] inline-flex items-center gap-1 disabled:opacity-50"
          >
            <Save className="w-3 h-3" /> Salvar
          </button>
        </div>
      </div>

      {tab === 'products' && <ProductsTab config={config} setConfig={setConfig} />}
      {tab === 'states' && <StatesTab config={config} setConfig={setConfig} />}
      {tab === 'distribution' && <DistributionTab config={config} setConfig={setConfig} />}
      {tab === 'thresholds' && <ThresholdsTab config={config} setConfig={setConfig} />}
    </div>
  )
}

function ProductsTab({ config, setConfig }: { config: MetaConfigShape; setConfig: (c: MetaConfigShape) => void }) {
  return (
    <div className="space-y-3">
      {config.products.map((p, idx) => (
        <div key={idx} className="card p-4 border-[var(--color-border)] grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
          <input
            value={p.key}
            onChange={(e) => {
              const next = [...config.products]
              next[idx] = { ...p, key: e.target.value }
              setConfig({ ...config, products: next })
            }}
            placeholder="key (ex: tgc)"
            className="md:col-span-2 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2"
          />
          <input
            value={p.label}
            onChange={(e) => {
              const next = [...config.products]
              next[idx] = { ...p, label: e.target.value }
              setConfig({ ...config, products: next })
            }}
            placeholder="Nome do produto"
            className="md:col-span-3 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2"
          />
          <input
            type="color"
            value={p.color}
            onChange={(e) => {
              const next = [...config.products]
              next[idx] = { ...p, color: e.target.value }
              setConfig({ ...config, products: next })
            }}
            className="md:col-span-1 h-9 rounded border border-[var(--color-border)] bg-transparent w-full"
          />
          <input
            type="number"
            value={p.monthlyBudgetTarget}
            onChange={(e) => {
              const next = [...config.products]
              next[idx] = { ...p, monthlyBudgetTarget: Number(e.target.value) }
              setConfig({ ...config, products: next })
            }}
            placeholder="Meta R$/mês"
            className="md:col-span-2 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2"
          />
          <input
            value={p.namePatterns.join(', ')}
            onChange={(e) => {
              const next = [...config.products]
              next[idx] = { ...p, namePatterns: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }
              setConfig({ ...config, products: next })
            }}
            placeholder="Padrões separados por vírgula (ex: TGC, [MR])"
            className="md:col-span-3 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2"
          />
          <button
            type="button"
            onClick={() => {
              const next = config.products.filter((_, i) => i !== idx)
              setConfig({ ...config, products: next })
            }}
            className="md:col-span-1 p-2 rounded text-red-400 hover:bg-red-500/10 inline-flex items-center justify-center"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          setConfig({
            ...config,
            products: [
              ...config.products,
              { key: '', label: '', color: '#6366F1', monthlyBudgetTarget: 0, namePatterns: [] },
            ],
          })
        }
        className="text-xs px-3 py-2 rounded-lg border border-dashed border-[var(--color-border)] hover:bg-[var(--color-surface-2)] inline-flex items-center gap-1"
      >
        <Plus className="w-3 h-3" /> Adicionar produto
      </button>
    </div>
  )
}

function StatesTab({ config, setConfig }: { config: MetaConfigShape; setConfig: (c: MetaConfigShape) => void }) {
  return (
    <div className="space-y-3">
      {config.states.map((s, idx) => (
        <div key={idx} className="card p-4 border-[var(--color-border)] grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
          <input
            value={s.code}
            onChange={(e) => {
              const next = [...config.states]
              next[idx] = { ...s, code: e.target.value.toUpperCase() }
              setConfig({ ...config, states: next })
            }}
            placeholder="Código UF"
            className="md:col-span-2 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2"
          />
          <input
            value={s.label}
            onChange={(e) => {
              const next = [...config.states]
              next[idx] = { ...s, label: e.target.value }
              setConfig({ ...config, states: next })
            }}
            placeholder="Nome"
            className="md:col-span-4 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2"
          />
          <input
            value={s.aliases.join(', ')}
            onChange={(e) => {
              const next = [...config.states]
              next[idx] = { ...s, aliases: e.target.value.split(',').map((a) => a.trim()).filter(Boolean) }
              setConfig({ ...config, states: next })
            }}
            placeholder="Aliases (ex: DF, BSB)"
            className="md:col-span-5 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2"
          />
          <button
            type="button"
            onClick={() => {
              const next = config.states.filter((_, i) => i !== idx)
              setConfig({ ...config, states: next })
            }}
            className="md:col-span-1 p-2 rounded text-red-400 hover:bg-red-500/10 inline-flex items-center justify-center"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          setConfig({
            ...config,
            states: [...config.states, { code: '', label: '', aliases: [] }],
          })
        }
        className="text-xs px-3 py-2 rounded-lg border border-dashed border-[var(--color-border)] hover:bg-[var(--color-surface-2)] inline-flex items-center gap-1"
      >
        <Plus className="w-3 h-3" /> Adicionar estado
      </button>
    </div>
  )
}

function DistributionTab({ config, setConfig }: { config: MetaConfigShape; setConfig: (c: MetaConfigShape) => void }) {
  return (
    <div className="card p-4 border-[var(--color-border)] overflow-x-auto">
      <p className="text-xs text-[var(--color-muted-foreground)] mb-3">
        Distribuição % por estado para cada produto (usada quando o adset não tem UF explícita no nome). Cada linha deve somar 100%.
      </p>
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left py-2">Produto</th>
            {config.states.map((s) => (
              <th key={s.code} className="text-right px-2 py-2">{s.code}</th>
            ))}
            <th className="text-right px-2 py-2">Soma</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {config.products.map((p) => {
            const dist = config.stateBudgetByProduct[p.key] ?? {}
            const sum = config.states.reduce((s, st) => s + Number(dist[st.code] ?? 0), 0)
            return (
              <tr key={p.key}>
                <td className="py-2 font-medium">{p.label}</td>
                {config.states.map((s) => (
                  <td key={s.code} className="px-1 py-1">
                    <input
                      type="number"
                      step="0.01"
                      value={dist[s.code] ?? 0}
                      onChange={(e) => {
                        const value = Number(e.target.value)
                        const nextDist = { ...(config.stateBudgetByProduct[p.key] ?? {}), [s.code]: value }
                        setConfig({
                          ...config,
                          stateBudgetByProduct: { ...config.stateBudgetByProduct, [p.key]: nextDist },
                        })
                      }}
                      className="w-16 text-right text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] p-1"
                    />
                  </td>
                ))}
                <td className={`px-2 py-2 text-right font-semibold tabular-nums ${Math.abs(sum - 100) > 1 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {sum.toFixed(2)}%
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ThresholdsTab({ config, setConfig }: { config: MetaConfigShape; setConfig: (c: MetaConfigShape) => void }) {
  const groups: Array<{ metric: 'ctr' | 'cpc' | 'cpm' | 'cpl'; label: string; help: string }> = [
    { metric: 'ctr', label: 'CTR (%)', help: 'Maior é melhor — define "good" e "warn"' },
    { metric: 'cpc', label: 'CPC (R$)', help: 'Menor é melhor — define "warn" e "bad"' },
    { metric: 'cpm', label: 'CPM (R$)', help: 'Menor é melhor — define "warn" e "bad"' },
    { metric: 'cpl', label: 'CPL (R$)', help: 'Menor é melhor — define "warn" e "bad"' },
  ]
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {groups.map((g) => {
        const t = config.thresholds[g.metric] as Record<string, number>
        const isCtr = g.metric === 'ctr'
        return (
          <div key={g.metric} className="card p-4 border-[var(--color-border)]">
            <h4 className="text-sm font-semibold">{g.label}</h4>
            <p className="text-[10px] text-[var(--color-muted-foreground)] mb-3">{g.help}</p>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs">
                {isCtr ? 'Good (≥)' : 'Warn (≤)'}
                <input
                  type="number"
                  step="0.01"
                  value={isCtr ? t.good : t.warn}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      thresholds: {
                        ...config.thresholds,
                        [g.metric]: { ...t, [isCtr ? 'good' : 'warn']: Number(e.target.value) },
                      } as MetaConfigShape['thresholds'],
                    })
                  }
                  className="w-full mt-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] p-1.5"
                />
              </label>
              <label className="text-xs">
                {isCtr ? 'Warn (≥)' : 'Bad (>)'}
                <input
                  type="number"
                  step="0.01"
                  value={isCtr ? t.warn : t.bad}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      thresholds: {
                        ...config.thresholds,
                        [g.metric]: { ...t, [isCtr ? 'warn' : 'bad']: Number(e.target.value) },
                      } as MetaConfigShape['thresholds'],
                    })
                  }
                  className="w-full mt-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] p-1.5"
                />
              </label>
            </div>
          </div>
        )
      })}
      <div className="card p-4 border-[var(--color-border)] md:col-span-2">
        <h4 className="text-sm font-semibold">Outros parâmetros</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          <label className="text-xs">
            Fator alcance estimado
            <input
              type="number"
              step="0.01"
              value={config.reachFactor}
              onChange={(e) => setConfig({ ...config, reachFactor: Number(e.target.value) })}
              className="w-full mt-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] p-1.5"
            />
          </label>
          <label className="text-xs">
            Dias do sparkline
            <input
              type="number"
              value={config.sparklineDays}
              onChange={(e) => setConfig({ ...config, sparklineDays: Number(e.target.value) })}
              className="w-full mt-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] p-1.5"
            />
          </label>
          <label className="text-xs">
            Cor da conta secundária
            <input
              type="color"
              value={config.secondaryAccountColor}
              onChange={(e) => setConfig({ ...config, secondaryAccountColor: e.target.value })}
              className="w-full mt-1 h-9 rounded border border-[var(--color-border)] bg-transparent"
            />
          </label>
        </div>
      </div>
    </div>
  )
}
