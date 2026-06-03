/**
 * Templates da Meta Ads config — genéricos e reutilizáveis.
 * Sem referências a empresas específicas.
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
  /** Label da seção de conta secundária — configurável por empresa */
  secondaryAccountLabel: string;
  sparklineDays: number;
}

export type MetaConfigSegment = 'general' | 'ecommerce' | 'education' | 'real-estate';

// ---------------------------------------------------------------------------
// Thresholds neutros — pontos de partida sensatos para qualquer segmento
// ---------------------------------------------------------------------------
const NEUTRAL_THRESHOLDS: MetaConfigThresholds = {
  ctr: { good: 1.0, warn: 0.7 },
  cpc: { warn: 6.0, bad: 10.0 },
  cpm: { warn: 45, bad: 70 },
  cpl: { warn: 80, bad: 150 },
};

// ---------------------------------------------------------------------------
// Template padrão genérico — sem produtos pré-configurados.
// Base limpa para qualquer agência nova sem viés de segmento.
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

// ---------------------------------------------------------------------------
// Templates por segmento — usados no onboarding e via botão "Aplicar template"
// ---------------------------------------------------------------------------
export const SEGMENT_TEMPLATES: Record<MetaConfigSegment, MetaConfigShape> = {
  general: {
    ...DEFAULT_META_CONFIG,
    products: [
      {
        key: 'produto_1',
        label: 'Produto Principal',
        color: '#6366F1',
        monthlyBudgetTarget: 5000,
        namePatterns: ['PRINCIPAL', '[P1]'],
      },
      {
        key: 'produto_2',
        label: 'Produto Secundário',
        color: '#10B981',
        monthlyBudgetTarget: 2000,
        namePatterns: ['SECUNDARIO', '[P2]'],
      },
    ],
    thresholds: NEUTRAL_THRESHOLDS,
  },

  ecommerce: {
    ...DEFAULT_META_CONFIG,
    products: [
      {
        key: 'awareness',
        label: 'Awareness',
        color: '#6366F1',
        monthlyBudgetTarget: 3000,
        namePatterns: ['AWARENESS', '[AWR]'],
      },
      {
        key: 'conversao',
        label: 'Conversão',
        color: '#10B981',
        monthlyBudgetTarget: 8000,
        namePatterns: ['CONVERSAO', 'CONV', '[CVR]'],
      },
      {
        key: 'remarketing',
        label: 'Remarketing',
        color: '#F59E0B',
        monthlyBudgetTarget: 2000,
        namePatterns: ['REMARKETING', 'RTG', '[RTG]'],
      },
      {
        key: 'retencao',
        label: 'Retenção',
        color: '#EC4899',
        monthlyBudgetTarget: 1500,
        namePatterns: ['RETENCAO', '[RET]'],
      },
    ],
    thresholds: {
      ctr: { good: 1.2, warn: 0.8 },
      cpc: { warn: 4.0, bad: 7.0 },
      cpm: { warn: 40, bad: 60 },
      cpl: { warn: 50, bad: 100 },
    },
  },

  education: {
    ...DEFAULT_META_CONFIG,
    products: [
      {
        key: 'graduacao',
        label: 'Graduação',
        color: '#6366F1',
        monthlyBudgetTarget: 6000,
        namePatterns: ['GRAD', 'GRADUACAO'],
      },
      {
        key: 'pos',
        label: 'Pós-Graduação',
        color: '#8B5CF6',
        monthlyBudgetTarget: 4000,
        namePatterns: ['POS', 'MBA', 'ESPECIALIZACAO'],
      },
      {
        key: 'cursos_livres',
        label: 'Cursos Livres',
        color: '#10B981',
        monthlyBudgetTarget: 2500,
        namePatterns: ['CURSO', 'LIVRE', '[CL]'],
      },
      {
        key: 'ead',
        label: 'EAD',
        color: '#F59E0B',
        monthlyBudgetTarget: 3000,
        namePatterns: ['EAD', 'ONLINE', 'DISTANCIA'],
      },
    ],
    thresholds: {
      ctr: { good: 0.9, warn: 0.6 },
      cpc: { warn: 8.0, bad: 14.0 },
      cpm: { warn: 50, bad: 80 },
      cpl: { warn: 120, bad: 250 },
    },
  },

  'real-estate': {
    ...DEFAULT_META_CONFIG,
    products: [
      {
        key: 'lancamento',
        label: 'Lançamento',
        color: '#6366F1',
        monthlyBudgetTarget: 15000,
        namePatterns: ['LANCAMENTO', '[LCT]'],
      },
      {
        key: 'pronto',
        label: 'Pronto para Morar',
        color: '#10B981',
        monthlyBudgetTarget: 8000,
        namePatterns: ['PRONTO', '[PTM]'],
      },
      {
        key: 'mcmv',
        label: 'Minha Casa Minha Vida',
        color: '#F59E0B',
        monthlyBudgetTarget: 5000,
        namePatterns: ['MCMV', 'MINHA CASA'],
      },
      {
        key: 'comercial',
        label: 'Comercial',
        color: '#EC4899',
        monthlyBudgetTarget: 4000,
        namePatterns: ['COMERCIAL', '[COM]'],
      },
    ],
    thresholds: {
      ctr: { good: 0.8, warn: 0.5 },
      cpc: { warn: 10.0, bad: 18.0 },
      cpm: { warn: 60, bad: 90 },
      cpl: { warn: 200, bad: 450 },
    },
  },
};

/** @deprecated Use DEFAULT_META_CONFIG ou SEGMENT_TEMPLATES */
export const TRON_TEMPLATE: MetaConfigShape = DEFAULT_META_CONFIG;

export function defaultMetaConfig(): MetaConfigShape {
  return JSON.parse(JSON.stringify(DEFAULT_META_CONFIG));
}

export function segmentTemplate(segment: MetaConfigSegment): MetaConfigShape {
  return JSON.parse(JSON.stringify(SEGMENT_TEMPLATES[segment] ?? DEFAULT_META_CONFIG));
}
