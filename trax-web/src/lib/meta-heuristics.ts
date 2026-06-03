/**
 * Heurísticas Meta Ads (web) — baseadas em MetaConfig vindo do backend.
 * Config sempre vem do tenant; sem fallbacks com dados de empresas específicas.
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
  /** Label da seção de conta secundária — configurável por empresa */
  secondaryAccountLabel?: string;
  sparklineDays: number;
}

// ---------------------------------------------------------------------------
// Thresholds neutros — usados apenas quando config do tenant não está disponível
// ---------------------------------------------------------------------------
export const NEUTRAL_THRESHOLDS: MetaConfigThresholds = {
  ctr: { good: 1.0, warn: 0.7 },
  cpc: { warn: 6.0, bad: 10.0 },
  cpm: { warn: 45, bad: 70 },
  cpl: { warn: 80, bad: 150 },
};

// ---------------------------------------------------------------------------
// Config padrão genérica — sem produtos de nenhuma empresa específica.
// Usada apenas como fallback de último recurso (config do tenant deve sempre vir do backend).
// ---------------------------------------------------------------------------
export const DEFAULT_META_CONFIG: MetaConfigShape = {
  products: [],
  states: [],
  stateBudgetByProduct: {},
  thresholds: NEUTRAL_THRESHOLDS,
  reachFactor: 0.72,
  secondaryAccountColor: '#06B6D4',
  secondaryAccountLabel: 'Conta Secundária',
  sparklineDays: 14,
};

/** @deprecated Use DEFAULT_META_CONFIG. Mantido para compatibilidade durante migração. */
export const TRON_TEMPLATE: MetaConfigShape = DEFAULT_META_CONFIG;
/** @deprecated Use NEUTRAL_THRESHOLDS. */
export const META_THRESHOLDS = NEUTRAL_THRESHOLDS;
/** @deprecated Derive cores dos produtos via `config.products`. */
export const PRODUCT_COLORS: Record<string, string> = {};
/** @deprecated Derive labels dos produtos via `config.products`. */
export const PRODUCT_LABELS: Record<string, string> = {};

// ---------------------------------------------------------------------------
// Funções utilitárias — sempre usam o config do tenant como fonte da verdade
// ---------------------------------------------------------------------------

export function getProduct(
  key: string | null | undefined,
  config?: MetaConfigShape | null,
): MetaConfigProduct | null {
  if (!key) return null
  const cfg = config ?? DEFAULT_META_CONFIG
  return cfg.products.find((p) => p.key === key) ?? null
}

export function productColor(key: string | null | undefined, config?: MetaConfigShape | null): string {
  return getProduct(key, config)?.color ?? '#94A3B8'
}

export function productLabel(key: string | null | undefined, config?: MetaConfigShape | null): string {
  return getProduct(key, config)?.label ?? (key ?? 'Outros')
}

export function colorForMetric(
  metric: 'ctr' | 'cpc' | 'cpm' | 'cpl',
  value: number,
  config?: MetaConfigShape | null,
): string {
  const t = (config ?? DEFAULT_META_CONFIG).thresholds[metric] as {
    good?: number
    warn: number
    bad?: number
  }
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
  const t = (config ?? DEFAULT_META_CONFIG).thresholds
  let score = 50
  score += summary.ctr >= t.ctr.good ? 25 : summary.ctr >= t.ctr.warn ? 12 : summary.ctr >= t.ctr.warn * 0.7 ? 6 : 0
  score += summary.cpc <= t.cpc.warn * 0.85 ? 20 : summary.cpc <= t.cpc.warn ? 10 : summary.cpc <= t.cpc.bad * 1.5 ? 5 : 0
  score += summary.cpl <= t.cpl.warn * 0.75 ? 30 : summary.cpl <= t.cpl.warn * 1.5 ? 15 : summary.cpl <= t.cpl.bad * 1.35 ? 8 : 0
  score += (Math.min(summary.totalLeads, 200) / 200) * 25
  return Math.round(Math.min(100, Math.max(0, (score - 50) * 2)))
}

export function detectProduct(
  name: string,
  _campaignCode?: string,
  config?: MetaConfigShape | null,
): string | null {
  const cfg = config ?? DEFAULT_META_CONFIG
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

export function detectProductFromCaption(
  caption: string,
  config?: MetaConfigShape | null,
): string | null {
  return detectProduct(caption, undefined, config)
}

export function detectStates(name: string, config?: MetaConfigShape | null): string[] {
  const cfg = config ?? DEFAULT_META_CONFIG
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
