'use client'

import { useState } from 'react'
import { ChevronDown, Plus, Save, Sparkles, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useApiClient } from '@/lib/api-client-browser'
import type { MetaConfigShape } from '@/lib/meta-heuristics'

interface Props {
  companyId: string
  initialConfig: MetaConfigShape
}

type Tab = 'products' | 'states' | 'distribution' | 'thresholds' | 'secondary'

const SEGMENT_OPTIONS = [
  { value: 'general', label: 'Geral', description: 'Produtos e thresholds genéricos para qualquer segmento' },
  { value: 'ecommerce', label: 'E-commerce', description: 'Funil de awareness → conversão → remarketing → retenção' },
  { value: 'education', label: 'Educação', description: 'Graduação, pós, cursos livres e EAD' },
  { value: 'real-estate', label: 'Imobiliário', description: 'Lançamentos, pronto para morar, MCMV e comercial' },
] as const

export function MetaConfigForm({ companyId, initialConfig }: Props) {
  const api = useApiClient()
  const [tab, setTab] = useState<Tab>('products')
  const [config, setConfig] = useState<MetaConfigShape>(initialConfig)
  const [saving, setSaving] = useState(false)
  const [showTemplateMenu, setShowTemplateMenu] = useState(false)

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

  async function handleApplyTemplate(segment: string) {
    setShowTemplateMenu(false)
    const segmentLabel = SEGMENT_OPTIONS.find((s) => s.value === segment)?.label ?? segment
    if (
      !confirm(
        `Aplicar template "${segmentLabel}"?\n\nIsso substituirá os produtos, estados e thresholds atuais por valores pré-configurados para o segmento selecionado.`,
      )
    )
      return

    setSaving(true)
    try {
      const fresh = await api.post<MetaConfigShape>(
        `/companies/${companyId}/meta-config/reset?segment=${segment}`,
        {},
      )
      setConfig(fresh)
      toast.success(`Template "${segmentLabel}" aplicado com sucesso.`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao aplicar template')
    } finally {
      setSaving(false)
    }
  }

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'products', label: 'Produtos' },
    { id: 'states', label: 'Estados/Regiões' },
    { id: 'distribution', label: 'Distribuição' },
    { id: 'thresholds', label: 'Thresholds' },
    { id: 'secondary', label: 'Conta Secundária' },
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
          {/* Template por segmento */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTemplateMenu((v) => !v)}
              disabled={saving}
              className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] inline-flex items-center gap-1 disabled:opacity-50"
            >
              <Sparkles className="w-3 h-3" /> Aplicar template
              <ChevronDown className="w-3 h-3" />
            </button>
            {showTemplateMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 w-72 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl overflow-hidden">
                <p className="text-[10px] uppercase text-[var(--color-muted-foreground)] px-3 pt-2.5 pb-1 font-medium">
                  Selecione o segmento
                </p>
                {SEGMENT_OPTIONS.map((seg) => (
                  <button
                    key={seg.value}
                    type="button"
                    onClick={() => handleApplyTemplate(seg.value)}
                    className="w-full text-left px-3 py-2.5 hover:bg-[var(--color-surface-2)] transition-colors"
                  >
                    <p className="text-xs font-medium">{seg.label}</p>
                    <p className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5">{seg.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

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
      {tab === 'secondary' && <SecondaryAccountTab config={config} setConfig={setConfig} />}
    </div>
  )
}

function ProductsTab({ config, setConfig }: { config: MetaConfigShape; setConfig: (c: MetaConfigShape) => void }) {
  return (
    <div className="space-y-3">
      {config.products.length === 0 && (
        <div className="card p-6 border-dashed border-[var(--color-border)] text-center">
          <Sparkles className="w-6 h-6 text-[var(--color-muted)] mx-auto mb-2" />
          <p className="text-sm font-medium">Nenhum produto configurado</p>
          <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
            Adicione produtos manualmente ou aplique um template por segmento para começar rápido.
          </p>
        </div>
      )}
      {config.products.map((p, idx) => (
        <div key={idx} className="card p-4 border-[var(--color-border)] grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
          <input
            value={p.key}
            onChange={(e) => {
              const next = [...config.products]
              next[idx] = { ...p, key: e.target.value }
              setConfig({ ...config, products: next })
            }}
            placeholder="key (ex: conversao)"
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
            placeholder="Padrões no nome do adset (ex: CONV, [CVR])"
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
      <p className="text-xs text-[var(--color-muted-foreground)]">
        Configure os estados ou regiões relevantes para este cliente. Serão usados para segmentação de verba por UF.
      </p>
      {config.states.map((s, idx) => (
        <div key={idx} className="card p-4 border-[var(--color-border)] grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
          <input
            value={s.code}
            onChange={(e) => {
              const next = [...config.states]
              next[idx] = { ...s, code: e.target.value.toUpperCase() }
              setConfig({ ...config, states: next })
            }}
            placeholder="Código (ex: SP)"
            className="md:col-span-2 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2"
          />
          <input
            value={s.label}
            onChange={(e) => {
              const next = [...config.states]
              next[idx] = { ...s, label: e.target.value }
              setConfig({ ...config, states: next })
            }}
            placeholder="Nome (ex: São Paulo)"
            className="md:col-span-4 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2"
          />
          <input
            value={s.aliases.join(', ')}
            onChange={(e) => {
              const next = [...config.states]
              next[idx] = { ...s, aliases: e.target.value.split(',').map((a) => a.trim()).filter(Boolean) }
              setConfig({ ...config, states: next })
            }}
            placeholder="Aliases no nome do adset (ex: SP, SAO PAULO)"
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
        <Plus className="w-3 h-3" /> Adicionar estado/região
      </button>
    </div>
  )
}

function DistributionTab({ config, setConfig }: { config: MetaConfigShape; setConfig: (c: MetaConfigShape) => void }) {
  if (config.products.length === 0 || config.states.length === 0) {
    return (
      <div className="card p-6 border-dashed border-[var(--color-border)] text-center">
        <p className="text-sm font-medium">Configure produtos e estados primeiro</p>
        <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
          A distribuição por UF fica disponível após adicionar ao menos um produto e um estado.
        </p>
      </div>
    )
  }

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
    { metric: 'ctr', label: 'CTR (%)', help: 'Maior é melhor — define "bom" e "atenção"' },
    { metric: 'cpc', label: 'CPC (R$)', help: 'Menor é melhor — define "atenção" e "ruim"' },
    { metric: 'cpm', label: 'CPM (R$)', help: 'Menor é melhor — define "atenção" e "ruim"' },
    { metric: 'cpl', label: 'CPL (R$)', help: 'Menor é melhor — define "atenção" e "ruim"' },
  ]
  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--color-muted-foreground)]">
        Defina os limites de performance para este cliente. Afeta a coloração dos KPIs e os insights automáticos.
      </p>
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
                  {isCtr ? 'Bom (≥)' : 'Atenção (≤)'}
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
                  {isCtr ? 'Atenção (≥)' : 'Ruim (>)'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <label className="text-xs">
              Fator de alcance estimado
              <p className="text-[10px] text-[var(--color-muted-foreground)] mb-1">
                Multiplicador de impressões para estimar alcance único (padrão: 0.72)
              </p>
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
              <p className="text-[10px] text-[var(--color-muted-foreground)] mb-1">
                Janela de dias para os gráficos de tendência (padrão: 14)
              </p>
              <input
                type="number"
                value={config.sparklineDays}
                onChange={(e) => setConfig({ ...config, sparklineDays: Number(e.target.value) })}
                className="w-full mt-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] p-1.5"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

function SecondaryAccountTab({
  config,
  setConfig,
}: {
  config: MetaConfigShape
  setConfig: (c: MetaConfigShape) => void
}) {
  return (
    <div className="space-y-4">
      <div className="card p-4 border-[var(--color-border)]">
        <h4 className="text-sm font-semibold mb-1">Conta Secundária Meta Ads</h4>
        <p className="text-xs text-[var(--color-muted-foreground)] mb-4">
          Quando o relatório tem mais de uma conta Meta, a segunda é exibida em uma seção separada. Configure o nome e a cor desta seção.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-xs">
            Nome da seção
            <p className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5 mb-1">
              Ex: &quot;Filial SP&quot;, &quot;Conta Institucional&quot;, &quot;Marca 2&quot;
            </p>
            <input
              type="text"
              value={config.secondaryAccountLabel ?? 'Conta Secundária'}
              onChange={(e) => setConfig({ ...config, secondaryAccountLabel: e.target.value })}
              placeholder="Conta Secundária"
              maxLength={60}
              className="w-full mt-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2"
            />
          </label>
          <label className="text-xs">
            Cor da seção
            <p className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5 mb-1">
              Cor usada na barra lateral e nos cards desta conta
            </p>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="color"
                value={config.secondaryAccountColor}
                onChange={(e) => setConfig({ ...config, secondaryAccountColor: e.target.value })}
                className="h-9 w-16 rounded border border-[var(--color-border)] bg-transparent"
              />
              <span className="text-xs text-[var(--color-muted-foreground)] font-mono">
                {config.secondaryAccountColor}
              </span>
            </div>
          </label>
        </div>
        {/* Preview */}
        <div className="mt-4 p-3 rounded-lg border border-[var(--color-border)] overflow-hidden">
          <p className="text-[10px] uppercase text-[var(--color-muted-foreground)] mb-2">Preview</p>
          <div
            className="p-3 rounded-lg border"
            style={{ borderLeftWidth: 4, borderLeftColor: config.secondaryAccountColor, borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: config.secondaryAccountColor }} />
              <p className="text-sm font-semibold">{config.secondaryAccountLabel || 'Conta Secundária'}</p>
            </div>
            <p className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5">
              Esta conta aparecerá nesta seção no relatório
            </p>
          </div>
        </div>
      </div>
      <div className="card p-4 border-[var(--color-border)]">
        <h4 className="text-sm font-semibold mb-1">Como marcar uma conta como secundária?</h4>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Na tela de integrações da empresa, edite a integração Meta Ads e ative a opção &quot;É conta secundária&quot;. 
          Isso faz com que os dados desta conta apareçam na seção configurada acima.
        </p>
      </div>
    </div>
  )
}
