/**
 * Heurísticas Meta Ads (web) — baseadas em MetaConfig vindo do backend.
 * Funções aceitam config opcional; fallback usa template Tron.
 */

export interface MetaConfigProduct {
  key: string;
  label: string;
  color: string;
  monthlyBudgetTarget: number;
  namePatterns: string[];
}

export interface MetaConfigState {
  code: string;
  label: string;
  aliases: string[];
}

export interface MetaConfigThresholds {
  ctr: { good: number; warn: number };
  cpc: { warn: number; bad: number };
  cpm: { warn: number; bad: number };
  cpl: { warn: number; bad: number };
}

export interface MetaConfigShape {
  products: MetaConfigProduct[];
  states: MetaConfigState[];
  stateBudgetByProduct: Record<string, Record<string, number>>;
  thresholds: MetaConfigThresholds;
  reachFactor: number;
  secondaryAccountColor: string;
  sparklineDays: number;
}

export const TRON_TEMPLATE: MetaConfigShape = {
  products: [
    { key: 'inst', label: 'Institucional', color: '#64748B', monthlyBudgetTarget: 2540, namePatterns: ['INSTITUCIONAL', '[INST]'] },
    { key: 'ebook', label: 'E-books e Materiais Ricos', color: '#EC4899', monthlyBudgetTarget: 4060, namePatterns: ['EBOOK', 'MATERIAL', 'RICO', '[MR]'] },
    { key: 'ordix', label: 'Ordix', color: '#F59E0B', monthlyBudgetTarget: 9215, namePatterns: ['ORDIX'] },
    { key: 'box', label: 'Box', color: '#10B981', monthlyBudgetTarget: 9215, namePatterns: ['BOX'] },
    { key: 'tgc', label: 'TGC', color: '#6366F1', monthlyBudgetTarget: 4610, namePatterns: ['TGC'] },
    { key: 'dp', label: 'Tron DP', color: '#8B5CF6', monthlyBudgetTarget: 14395, namePatterns: ['TRON DP', '\\bDP\\b'] },
  ],
  states: [
    { code: 'GO', label: 'Goiás', aliases: ['GO'] },
    { code: 'MT', label: 'Mato Grosso', aliases: ['MT'] },
    { code: 'PA', label: 'Pará', aliases: ['PA'] },
    { code: 'BSB', label: 'Brasília/DF', aliases: ['BSB', 'DF'] },
    { code: 'TO', label: 'Tocantins', aliases: ['TO'] },
    { code: 'MA', label: 'Maranhão', aliases: ['MA'] },
  ],
  stateBudgetByProduct: {
    inst: { GO: 14.91, MT: 5.15, PA: 35.67, BSB: 9.77, TO: 18.42, MA: 16.08 },
    ebook: { GO: 14.91, MT: 5.15, PA: 35.67, BSB: 9.77, TO: 18.42, MA: 16.08 },
    ordix: { GO: 14.91, MT: 5.15, PA: 35.67, BSB: 9.77, TO: 18.42, MA: 16.08 },
    box: { GO: 14.91, MT: 5.15, PA: 35.67, BSB: 9.77, TO: 18.42, MA: 16.08 },
    tgc: { GO: 14.91, MT: 5.15, PA: 35.67, BSB: 9.77, TO: 18.42, MA: 16.08 },
    dp: { GO: 17.05, MT: 8.53, PA: 23.74, BSB: 15.21, TO: 13.57, MA: 21.90 },
  },
  thresholds: {
    ctr: { good: 1.0, warn: 0.7 },
    cpc: { warn: 6.0, bad: 8.0 },
    cpm: { warn: 45, bad: 60 },
    cpl: { warn: 80, bad: 150 },
  },
  reachFactor: 0.72,
  secondaryAccountColor: '#06B6D4',
  sparklineDays: 14,
}

export function getProduct(key: string | null | undefined, config?: MetaConfigShape | null): MetaConfigProduct | null {
  if (!key) return null
  const cfg = config ?? TRON_TEMPLATE
  return cfg.products.find((p) => p.key === key) ?? null
}

export function productColor(key: string | null | undefined, config?: MetaConfigShape | null): string {
  return getProduct(key, config)?.color ?? '#94A3B8'
}

export function productLabel(key: string | null | undefined, config?: MetaConfigShape | null): string {
  return getProduct(key, config)?.label ?? (key ?? 'Outros')
}

// Compat alias mantém os componentes que importavam PRODUCT_COLORS / PRODUCT_LABELS
export const PRODUCT_COLORS: Record<string, string> = Object.fromEntries(
  TRON_TEMPLATE.products.map((p) => [p.key, p.color]),
)
export const PRODUCT_LABELS: Record<string, string> = Object.fromEntries(
  TRON_TEMPLATE.products.map((p) => [p.key, p.label]),
)
export const META_THRESHOLDS = TRON_TEMPLATE.thresholds

export function colorForMetric(
  metric: 'ctr' | 'cpc' | 'cpm' | 'cpl',
  value: number,
  config?: MetaConfigShape | null,
): string {
  const t = (config ?? TRON_TEMPLATE).thresholds[metric] as { good?: number; warn: number; bad?: number }
  if (metric === 'ctr') {
    const good = t.good ?? 1.0
    return value >= good ? '#10B981' : value >= t.warn ? '#F59E0B' : '#EF4444'
  }
  const bad = t.bad ?? Infinity
  return value <= t.warn ? '#10B981' : value <= bad ? '#F59E0B' : '#EF4444'
}

export function computePerformanceScore(
  summary: { ctr: number; cpc: number; cpl: number; totalLeads: number },
  config?: MetaConfigShape | null,
): number {
  const t = (config ?? TRON_TEMPLATE).thresholds
  let score = 50
  score += summary.ctr >= t.ctr.good ? 25 : summary.ctr >= t.ctr.warn ? 12 : summary.ctr >= t.ctr.warn * 0.7 ? 6 : 0
  score += summary.cpc <= t.cpc.warn * 0.85 ? 20 : summary.cpc <= t.cpc.warn ? 10 : summary.cpc <= t.cpc.bad * 1.5 ? 5 : 0
  score += summary.cpl <= t.cpl.warn * 0.75 ? 30 : summary.cpl <= t.cpl.warn * 1.5 ? 15 : summary.cpl <= t.cpl.bad * 1.35 ? 8 : 0
  score += (Math.min(summary.totalLeads, 200) / 200) * 25
  return Math.round(Math.min(100, Math.max(0, (score - 50) * 2)))
}

export function detectProduct(name: string, _campaignCode?: string, config?: MetaConfigShape | null): string | null {
  const cfg = config ?? TRON_TEMPLATE
  const u = (name ?? '').toUpperCase()
  for (const p of cfg.products) {
    for (const pat of p.namePatterns ?? []) {
      try {
        const re = new RegExp(pat, 'i')
        if (re.test(u)) return p.key
      } catch {
        if (u.includes(pat.toUpperCase())) return p.key
      }
    }
  }
  return null
}

export function detectProductFromCaption(caption: string, config?: MetaConfigShape | null): string | null {
  return detectProduct(caption, undefined, config)
}

export function detectStates(name: string, config?: MetaConfigShape | null): string[] {
  const cfg = config ?? TRON_TEMPLATE
  const u = (name ?? '').toUpperCase()
  const found: string[] = []
  for (const st of cfg.states) {
    for (const alias of st.aliases ?? [st.code]) {
      const re = new RegExp(`(?:^|[\\[\\]/\\s,|\\-])${alias}(?:[\\[\\]/\\s,|\\-]|$)`)
      if (re.test(u) && !found.includes(st.code)) {
        found.push(st.code)
        break
      }
    }
  }
  return found
}
