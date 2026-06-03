import type { MetaConfigShape } from '@/lib/meta-heuristics'

export type StatusFilter = 'all' | 'active' | 'paused'

export interface MetaSummary {
  totalSpend: number
  totalLeads: number
  totalImpressions: number
  totalClicks: number
  totalReach: number
  estimatedReach: number
  cpl: number
  ctr: number
  cpc: number
  cpm: number
  cvr: number
  todaySpend: number
  monthSpend: number
  totalDailyBudget: number
  activeAdsCount: number
  campaignCount: number
  adsetCount: number
}

export interface PreviousSummary {
  periodStart: string
  periodEnd: string
  totalSpend: number
  totalLeads: number
  totalImpressions: number
  totalClicks: number
  cpl: number
  ctr: number
  cpc: number
  cpm: number
  cvr: number
  estimatedReach: number
}

export interface AdsetRow {
  id: string
  name: string
  campaign: string
  product: string | null
  states: string[]
  spend: number
  budget: number
  impressions: number
  clicks: number
  leads: number
  ctr: number
  cpc: number
  cpm: number
  cpl: number | null
  status: string
  active: boolean
}

export interface CreativeRow {
  ad_id: string
  ad_name: string
  campaign_id: string
  campaign_code: string
  spend: number
  leads: number
  clicks: number
  impressions: number
  ctr: number
  cpc: number
  cpl: number | null
  thumbnailUrl?: string
  permalink?: string
  status: string
  active: boolean
}

export interface DailyPoint {
  date: string
  spend: number
  leads: number
  impressions: number
  clicks: number
  reach: number
}

export interface BudgetPacingItem {
  campaignId: string
  campaignName: string
  campaignCode: string
  spend: number
  budget: number
  monthSpend: number
  expectedSpend: number
  pctMonth: number
  ratio: number
  pacingStatus: 'on-track' | 'below' | 'above'
  leads: number
  cpl: number
  ctr: number
}

export interface CampaignRow {
  id: string
  name: string
  code: string
  spend: number
  leads: number
  impressions: number
  clicks: number
  cpl: number
  ctr: number
}

export interface TrendDaily {
  dates: string[]
  spend: number[]
  leads: number[]
  impressions: number[]
  clicks: number[]
  reach: number[]
  cpl: number[]
  ctr: number[]
  cpc: number[]
  cpm: number[]
}

export interface VerbaProdutoStateBreakdown {
  state: string
  stateLabel: string
  spent: number
  leads: number
  cpl: number
  pct: number
  target: number
  pctOfTarget: number
}

export interface VerbaProdutoProduct {
  key: string
  label: string
  color: string
  target: number
  spent: number
  pct: number
  leads: number
  cpl: number
  dailyBudget: number
  expectedMonthSpend: number
  byState: VerbaProdutoStateBreakdown[]
}

export interface VerbaProduto {
  totalTarget: number
  totalSpent: number
  pctOfTarget: number
  products: VerbaProdutoProduct[]
}

export interface Hierarchy {
  campaigns: { total: number; active: number }
  adsets: { total: number; active: number }
  ads: { total: number; active: number }
}

export interface RioVerdeData {
  label: string
  color: string
  summary: MetaSummary | null
  campaigns: CampaignRow[]
  adsetTable: AdsetRow[]
  dailyData: DailyPoint[]
  trendDaily: TrendDaily | null
  hierarchy: Hierarchy
  budgetPacing: BudgetPacingItem[]
}

export interface MetaMetricsResponse {
  campaigns: CampaignRow[]
  adsets: unknown[]
  adsetMetrics: unknown[]
  adsetTable: AdsetRow[]
  creatives: CreativeRow[]
  dailyData: DailyPoint[]
  summary: MetaSummary | null
  previousPeriodSummary: PreviousSummary | null
  trendDaily: TrendDaily | null
  verbaProduto: VerbaProduto
  hierarchy: Hierarchy
  annualSummary: { year: number; spend: number; leads: number; cpl: number } | null
  monthlySummaries: Record<string, { spend: number; leads: number; cpl: number }>
  budgetPacing: BudgetPacingItem[]
  pacing: { pctMonth: number; expectedSpend: number; actualMonthSpend: number; daysInMonth: number; dayOfMonth: number } | null
  rioVerde: RioVerdeData | null
  accounts: Array<{ id: string; name: string; adAccountId: string | null; isSecondary: boolean }>
  primaryAccounts: Array<{ id: string; name: string; isSecondary: boolean }>
  secondaryAccounts: Array<{ id: string; name: string; isSecondary: boolean }>
  config: MetaConfigShape
}

export interface CrmEmbed {
  pipeline: {
    contatos?: number
    qualificacao?: number
    agendamento?: number
    qualificada?: number
    vendida?: number
    perdidas?: number
  } | null
  vendas: number
  receita: number
  ticketMedio?: number
  mrr?: number
  previousPeriod?: { vendas: number; receita: number } | null
  source?: string
  primarySource?: 'NECTAR_CRM' | 'RD_STATION' | 'MERGED'
}

export interface AdsetDetail {
  id: string
  name: string
  campaign: string
  product: string | null
  states: string[]
  status: string
  dailyBudget: number
  totals: {
    spend: number
    leads: number
    impressions: number
    clicks: number
    ctr: number
    cpc: number
    cpl: number
    cpm: number
  }
  dailySeries: Array<{
    date: string
    spend: number
    leads: number
    clicks: number
    impressions: number
    ctr: number
    cpc: number
    cpl: number
  }>
  ads: Array<{
    ad_id: string
    ad_name: string
    adset_id: string
    spend: number
    leads: number
    thumbnailUrl?: string
    permalink?: string
    cpl: number | null
    status: string
  }>
}

export function fmtCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}
export function fmtCurrency2(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}
export function fmtNum(v: number) {
  return new Intl.NumberFormat('pt-BR').format(Math.round(v))
}
export function fmtPct(v: number) {
  return `${v.toFixed(2)}%`
}
