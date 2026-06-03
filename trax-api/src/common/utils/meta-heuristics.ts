/**
 * Heurísticas Meta Ads dinâmicas baseadas em ClientMetaConfig.
 * Fallback: template Tron embutido se config ausente.
 */

import {
  defaultMetaConfig,
  MetaConfigShape,
  MetaConfigProduct,
  MetaConfigState,
  MetaConfigThresholds,
} from '@/modules/company/meta-config/meta-config.template';

export type ProductTag = string | null;

export function detectProduct(name: string, config?: MetaConfigShape | null): ProductTag {
  const cfg = config ?? defaultMetaConfig();
  const u = (name ?? '').toUpperCase();
  for (const p of cfg.products) {
    for (const pat of p.namePatterns ?? []) {
      try {
        const re = new RegExp(pat, 'i');
        if (re.test(u)) return p.key;
      } catch {
        if (u.includes(pat.toUpperCase())) return p.key;
      }
    }
  }
  return null;
}

export function detectStates(name: string, config?: MetaConfigShape | null): string[] {
  const cfg = config ?? defaultMetaConfig();
  const u = (name ?? '').toUpperCase();
  const found: string[] = [];
  for (const st of cfg.states) {
    for (const alias of st.aliases ?? [st.code]) {
      const re = new RegExp(`(?:^|[\\[\\]/\\s,|\\-])${alias}(?:[\\[\\]/\\s,|\\-]|$)`);
      if (re.test(u) && !found.includes(st.code)) {
        found.push(st.code);
        break;
      }
    }
  }
  return found;
}

export function campaignCodeFromName(name: string): string {
  const u = (name ?? '').toUpperCase();
  if (u.startsWith('MR') || u.includes('[MR]')) return 'MR';
  if (u.startsWith('EMP') || u.includes('[EMP]')) return 'EMP';
  if (u.startsWith('C01') || u.includes('[C01]')) return 'C01';
  if (u.startsWith('C00') || u.includes('[C00]')) return 'C00';
  if (u.startsWith('INST') || u.includes('[INST]')) return 'INST';
  if (u.includes('CONT_RV') || u.includes('CONTABIL RV')) return 'CONT_RV';
  if (u.includes('EMP_RV') || u.includes('EMPRESARIAL RV')) return 'EMP_RV';
  return name.slice(0, 4).toUpperCase();
}

export function colorForMetric(
  metric: 'ctr' | 'cpc' | 'cpm' | 'cpl',
  value: number,
  config?: MetaConfigShape | null,
): string {
  const t = (config ?? defaultMetaConfig()).thresholds[metric] as { good?: number; warn: number; bad?: number };
  if (metric === 'ctr') {
    const good = t.good ?? 1.0;
    return value >= good ? '#10B981' : value >= t.warn ? '#F59E0B' : '#EF4444';
  }
  const bad = t.bad ?? Infinity;
  return value <= t.warn ? '#10B981' : value <= bad ? '#F59E0B' : '#EF4444';
}

export function computePerformanceScore(
  summary: { ctr: number; cpc: number; cpl: number; totalLeads: number },
  config?: MetaConfigShape | null,
): number {
  const t = (config ?? defaultMetaConfig()).thresholds;
  let score = 50;
  score += summary.ctr >= t.ctr.good ? 25 : summary.ctr >= t.ctr.warn ? 12 : summary.ctr >= t.ctr.warn * 0.7 ? 6 : 0;
  score += summary.cpc <= t.cpc.warn * 0.85 ? 20 : summary.cpc <= t.cpc.warn ? 10 : summary.cpc <= t.cpc.bad * 1.5 ? 5 : 0;
  score += summary.cpl <= t.cpl.warn * 0.75 ? 30 : summary.cpl <= t.cpl.warn * 1.5 ? 15 : summary.cpl <= t.cpl.bad * 1.35 ? 8 : 0;
  score += (Math.min(summary.totalLeads, 200) / 200) * 25;
  return Math.round(Math.min(100, Math.max(0, (score - 50) * 2)));
}

export {
  defaultMetaConfig,
  MetaConfigShape,
  MetaConfigProduct,
  MetaConfigState,
  MetaConfigThresholds,
};
