/**
 * Template default da Meta Ads config — espelha o tron-dashboard.
 * Aplicado em clientes novos e via endpoint POST /reset.
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
};

export function defaultMetaConfig(): MetaConfigShape {
  return JSON.parse(JSON.stringify(TRON_TEMPLATE));
}
