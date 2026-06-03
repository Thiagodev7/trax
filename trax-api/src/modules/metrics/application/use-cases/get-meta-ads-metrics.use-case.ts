import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { MetaConfigService } from '@/modules/company/meta-config/meta-config.service';
import {
  campaignCodeFromName,
  detectProduct,
  detectStates,
} from '@common/utils/meta-heuristics';
import { MetaConfigShape, defaultMetaConfig } from '@/modules/company/meta-config/meta-config.template';

export interface DailyPoint {
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  leads: number;
  reach: number;
}

interface MetaAdsQuery {
  agencyId: string;
  reportId: string;
  startDate?: string;
  endDate?: string;
  campaign?: string;
  status?: 'active' | 'paused' | 'all';
  product?: string;
  state?: string;
  search?: string;
  compare?: boolean;
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function diffDays(start: string, end: string): number {
  return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000));
}

function shiftDate(d: string, days: number): string {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + days);
  return toDateStr(dt);
}

function isPositive(status?: string): boolean {
  if (!status) return false;
  const s = status.toUpperCase();
  return s === 'ACTIVE' || s === 'ENABLED';
}

@Injectable()
export class GetMetaAdsMetricsUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly metaConfig: MetaConfigService,
  ) {}

  async execute(query: MetaAdsQuery) {
    const report = await this.prisma.report.findFirst({
      where: { id: query.reportId, agencyId: query.agencyId },
      include: { integrations: { include: { integration: true } }, company: true },
    });
    if (!report) throw new NotFoundException('Relatório não encontrado.');

    const metaIntegrations = report.integrations
      .map((ri) => ri.integration)
      .filter((i) => i.provider === 'META_ADS' && i.status === 'ACTIVE');

    if (metaIntegrations.length === 0) {
      return this.emptyResponse();
    }

    let config: MetaConfigShape;
    try {
      const cfg = await this.metaConfig.getOrCreate(query.agencyId, report.companyId);
      config = cfg as MetaConfigShape;
    } catch {
      config = defaultMetaConfig();
    }

    const accounts = metaIntegrations.map((i) => {
      const displayName = i.displayName ?? i.externalAccount ?? 'Meta Ads';
      const meta = (i.metadata as Record<string, unknown> | null) ?? {};
      const isSecondary =
        meta.isSecondary === true ||
        displayName.toLowerCase().includes('rio verde') ||
        displayName.toLowerCase().includes(' rv') ||
        displayName.toLowerCase().endsWith('rv');
      return {
        id: i.id,
        name: displayName,
        adAccountId: i.externalAccount,
        isSecondary,
      };
    });

    const primaryIds = accounts.filter((a) => !a.isSecondary).map((a) => a.id);
    const secondaryIds = accounts.filter((a) => a.isSecondary).map((a) => a.id);

    const primaryData = await this.computeForIntegrations(primaryIds, query, config);
    const rioVerdeData =
      secondaryIds.length > 0
        ? await this.computeForIntegrations(secondaryIds, { ...query, campaign: undefined }, config, true)
        : null;

    return {
      ...primaryData,
      accounts,
      primaryAccounts: accounts.filter((a) => !a.isSecondary),
      secondaryAccounts: accounts.filter((a) => a.isSecondary),
      rioVerde: rioVerdeData
        ? {
            label: accounts.find((a) => a.isSecondary)?.name ?? 'Rio Verde',
            color: config.secondaryAccountColor,
            ...rioVerdeData,
          }
        : null,
      config,
    };
  }

  private async computeForIntegrations(
    integrationIds: string[],
    query: MetaAdsQuery,
    config: MetaConfigShape,
    isSecondary = false,
  ) {
    if (integrationIds.length === 0) return this.emptyResponse();

    const dateFilter: Record<string, unknown> = {};
    if (query.startDate) dateFilter.gte = new Date(query.startDate);
    if (query.endDate) dateFilter.lte = new Date(query.endDate);

    const [campaignRows, adsetInfoRows, adsetRows, creativeRows] = await Promise.all([
      this.prisma.dailyMetric.findMany({
        where: {
          integrationId: { in: integrationIds },
          metricType: 'campaign',
          ...(Object.keys(dateFilter).length && { date: dateFilter }),
        },
        orderBy: { date: 'asc' },
      }),
      this.prisma.dailyMetric.findMany({
        where: { integrationId: { in: integrationIds }, metricType: 'adset_info' },
      }),
      this.prisma.dailyMetric.findMany({
        where: {
          integrationId: { in: integrationIds },
          metricType: 'adset',
          ...(Object.keys(dateFilter).length && { date: dateFilter }),
        },
        orderBy: { date: 'asc' },
      }),
      this.prisma.dailyMetric.findMany({
        where: { integrationId: { in: integrationIds }, metricType: 'creative' },
      }),
    ]);

    const filteredCampaigns =
      query.campaign && query.campaign !== 'all'
        ? campaignRows.filter((r) => {
            const d = r.data as Record<string, unknown>;
            const name = String(d.campaign_name ?? '');
            return (
              name.toUpperCase().includes(query.campaign!.toUpperCase()) ||
              campaignCodeFromName(name) === query.campaign!.toUpperCase()
            );
          })
        : campaignRows;

    const dailyMap: Record<string, Record<string, number>> = {};
    for (const row of filteredCampaigns) {
      const date = toDateStr(row.date);
      const d = row.data as Record<string, number>;
      if (!dailyMap[date]) dailyMap[date] = { impressions: 0, clicks: 0, spend: 0, leads: 0, reach: 0 };
      dailyMap[date].impressions += Number(d.impressions ?? 0);
      dailyMap[date].clicks += Number(d.clicks ?? 0);
      dailyMap[date].spend += Number(d.spend ?? 0);
      dailyMap[date].leads += Number(d.leads ?? 0);
      dailyMap[date].reach += Number(d.reach ?? 0);
    }

    const dailyData: DailyPoint[] = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, metrics]) => ({ date, ...metrics } as DailyPoint));

    const campaignMap: Record<string, Record<string, unknown>> = {};
    for (const row of filteredCampaigns) {
      const d = row.data as Record<string, unknown>;
      const id = String(d.campaign_id);
      if (!campaignMap[id]) {
        campaignMap[id] = { spend: 0, leads: 0, impressions: 0, clicks: 0, name: String(d.campaign_name) };
      }
      campaignMap[id].spend = Number(campaignMap[id].spend) + Number(d.spend ?? 0);
      campaignMap[id].leads = Number(campaignMap[id].leads) + Number(d.leads ?? 0);
      campaignMap[id].impressions = Number(campaignMap[id].impressions) + Number(d.impressions ?? 0);
      campaignMap[id].clicks = Number(campaignMap[id].clicks) + Number(d.clicks ?? 0);
    }

    const campaigns = Object.entries(campaignMap).map(([id, data]) => {
      const spend = Number(data.spend);
      const leads = Number(data.leads);
      const impressions = Number(data.impressions);
      const clicks = Number(data.clicks);
      return {
        id,
        name: String(data.name),
        code: campaignCodeFromName(String(data.name)),
        spend,
        leads,
        impressions,
        clicks,
        cpl: leads > 0 ? spend / leads : 0,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      };
    });

    const adsetInfoMap = new Map<string, Record<string, unknown>>();
    for (const row of adsetInfoRows) {
      const d = row.data as Record<string, unknown>;
      adsetInfoMap.set(String(d.id ?? row.entityId), d);
    }

    const adsetMetricsAgg: Record<string, Record<string, number>> = {};
    const adsetNames: Record<string, string> = {};
    for (const row of adsetRows) {
      const d = row.data as Record<string, unknown>;
      const adsetId = String(d.adset_id ?? row.entityId);
      if (!adsetMetricsAgg[adsetId]) {
        adsetMetricsAgg[adsetId] = { spend: 0, leads: 0, impressions: 0, clicks: 0 };
      }
      adsetMetricsAgg[adsetId].spend += Number(d.spend ?? 0);
      adsetMetricsAgg[adsetId].leads += Number(d.leads ?? 0);
      adsetMetricsAgg[adsetId].impressions += Number(d.impressions ?? 0);
      adsetMetricsAgg[adsetId].clicks += Number(d.clicks ?? 0);
      if (!adsetNames[adsetId] && d.adset_name) {
        adsetNames[adsetId] = String(d.adset_name);
      }
    }

    let adsetTable = Object.entries(adsetMetricsAgg).map(([adsetId, agg]) => {
      const info = adsetInfoMap.get(adsetId) ?? {};
      const name = String(info.name ?? adsetNames[adsetId] ?? adsetId);
      const spend = agg.spend;
      const leads = agg.leads;
      const impressions = agg.impressions;
      const clicks = agg.clicks;
      const budget = Number(info.dailyBudget ?? 0);
      const status = String(info.status ?? 'UNKNOWN');
      return {
        id: adsetId,
        name,
        campaign: campaignCodeFromName(name),
        product: detectProduct(name, config),
        states: detectStates(name, config),
        spend,
        budget,
        impressions,
        clicks,
        leads,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        cpc: clicks > 0 ? spend / clicks : 0,
        cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
        cpl: leads > 0 ? spend / leads : null,
        status,
        active: isPositive(status),
      };
    });

    if (query.status && query.status !== 'all') {
      const wantActive = query.status === 'active';
      adsetTable = adsetTable.filter((a) => a.active === wantActive);
    }
    if (query.product) {
      adsetTable = adsetTable.filter((a) => a.product === query.product);
    }
    if (query.state) {
      adsetTable = adsetTable.filter((a) => a.states.includes(query.state!));
    }
    if (query.search) {
      const q = query.search.toLowerCase();
      adsetTable = adsetTable.filter((a) => a.name.toLowerCase().includes(q));
    }

    const totalDailyBudget = adsetInfoRows.reduce((sum, row) => {
      const d = row.data as Record<string, unknown>;
      if (!isPositive(String(d.status))) return sum;
      return sum + Number(d.dailyBudget ?? 0);
    }, 0);

    const activeAdsCount = creativeRows.filter((r) =>
      isPositive(String((r.data as Record<string, unknown>).status ?? 'ACTIVE')),
    ).length || creativeRows.length;

    const today = toDateStr(new Date());
    const currentMonth = monthKey(new Date());

    const todaySpend = dailyData.find((d) => d.date === today)?.spend ?? 0;
    const monthSpend = dailyData
      .filter((d) => d.date.startsWith(currentMonth))
      .reduce((s, d) => s + d.spend, 0);

    const totalSpend = dailyData.reduce((s, d) => s + d.spend, 0);
    const totalLeads = dailyData.reduce((s, d) => s + d.leads, 0);
    const totalImpressions = dailyData.reduce((s, d) => s + d.impressions, 0);
    const totalClicks = dailyData.reduce((s, d) => s + d.clicks, 0);
    const totalReach = dailyData.reduce((s, d) => s + d.reach, 0);

    const summary = {
      totalSpend,
      totalLeads,
      totalImpressions,
      totalClicks,
      totalReach,
      estimatedReach: totalImpressions * config.reachFactor,
      cpl: totalLeads > 0 ? totalSpend / totalLeads : 0,
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
      cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
      cvr: totalClicks > 0 ? (totalLeads / totalClicks) * 100 : 0,
      todaySpend,
      monthSpend,
      totalDailyBudget,
      activeAdsCount,
      campaignCount: campaigns.length,
      adsetCount: adsetTable.length,
    };

    const previousPeriodSummary = await this.computePreviousPeriod(integrationIds, query, config);

    const trendDaily = this.buildTrendDaily(dailyData, config.sparklineDays);

    const creatives = creativeRows
      .map((r) => {
        const d = r.data as Record<string, unknown>;
        const spend = Number(d.spend ?? 0);
        const leads = Number(d.leads ?? 0);
        const clicks = Number(d.clicks ?? 0);
        const impressions = Number(d.impressions ?? 0);
        const status = String(d.status ?? 'ACTIVE');
        return {
          ad_id: String(d.ad_id ?? ''),
          ad_name: String(d.ad_name ?? ''),
          campaign_id: String(d.campaign_id ?? ''),
          campaign_code: campaignCodeFromName(String(d.campaign_name ?? d.ad_name ?? '')),
          spend,
          leads,
          clicks,
          impressions,
          ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
          cpc: clicks > 0 ? spend / clicks : 0,
          thumbnailUrl: d.thumbnailUrl as string | undefined,
          permalink: d.permalink as string | undefined,
          cpl: leads > 0 ? spend / leads : null,
          status,
          active: isPositive(status),
        };
      })
      .sort((a, b) => b.leads - a.leads);

    const verbaProduto = this.buildVerbaProduto(adsetTable, config);

    const yearStart = `${new Date().getFullYear()}-01-01`;
    const yearRows = campaignRows.filter((r) => toDateStr(r.date) >= yearStart);
    let yearSpend = 0;
    let yearLeads = 0;
    for (const row of yearRows) {
      const d = row.data as Record<string, number>;
      yearSpend += Number(d.spend ?? 0);
      yearLeads += Number(d.leads ?? 0);
    }

    const monthlySummaries: Record<string, { spend: number; leads: number; cpl: number }> = {};
    for (const row of campaignRows) {
      const mk = monthKey(row.date);
      const d = row.data as Record<string, number>;
      if (!monthlySummaries[mk]) monthlySummaries[mk] = { spend: 0, leads: 0, cpl: 0 };
      monthlySummaries[mk].spend += Number(d.spend ?? 0);
      monthlySummaries[mk].leads += Number(d.leads ?? 0);
    }
    for (const mk of Object.keys(monthlySummaries)) {
      const m = monthlySummaries[mk];
      m.cpl = m.leads > 0 ? m.spend / m.leads : 0;
    }

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const expectedSpend = totalDailyBudget * dayOfMonth;

    const budgetPacing = campaigns.map((c) => {
      const campAdsets = adsetTable.filter((a) => a.campaign === c.code || a.name.includes(c.code));
      const budget = campAdsets.reduce((s, a) => s + a.budget, 0);
      const monthCampSpend = c.spend;
      const expectedCampSpend = budget * dayOfMonth;
      const pctMonth = budget > 0 ? (monthCampSpend / (budget * daysInMonth)) * 100 : 0;
      const ratio = expectedCampSpend > 0 ? monthCampSpend / expectedCampSpend : 0;
      let pacingStatus: 'on-track' | 'below' | 'above' = 'on-track';
      if (ratio < 0.88) pacingStatus = 'below';
      else if (ratio > 1.15) pacingStatus = 'above';
      return {
        campaignId: c.id,
        campaignName: c.name,
        campaignCode: c.code,
        spend: c.spend,
        budget,
        monthSpend: monthCampSpend,
        expectedSpend: expectedCampSpend,
        pctMonth,
        ratio,
        pacingStatus,
        leads: c.leads,
        cpl: c.cpl,
        ctr: c.ctr,
      };
    });

    const annualSummary = {
      year: new Date().getFullYear(),
      spend: yearSpend,
      leads: yearLeads,
      cpl: yearLeads > 0 ? yearSpend / yearLeads : 0,
    };

    const hierarchy = {
      campaigns: { total: campaigns.length, active: campaigns.filter((c) => c.spend > 0).length },
      adsets: {
        total: adsetTable.length,
        active: adsetTable.filter((a) => a.active).length,
      },
      ads: {
        total: creativeRows.length,
        active: activeAdsCount,
      },
    };

    return {
      campaigns,
      adsets: adsetInfoRows.map((r) => r.data),
      adsetMetrics: adsetRows.map((r) => ({ date: toDateStr(r.date), ...((r.data as object) ?? {}) })),
      adsetTable,
      creatives,
      dailyData,
      summary,
      previousPeriodSummary,
      trendDaily,
      verbaProduto,
      hierarchy,
      annualSummary,
      monthlySummaries,
      budgetPacing,
      pacing: {
        expectedSpend,
        actualMonthSpend: monthSpend,
        pctMonth: expectedSpend > 0 ? (monthSpend / expectedSpend) * 100 : 0,
        daysInMonth,
        dayOfMonth,
      },
      isSecondary,
    };
  }

  private async computePreviousPeriod(
    integrationIds: string[],
    query: MetaAdsQuery,
    config: MetaConfigShape,
  ) {
    if (!query.startDate || !query.endDate) return null;
    const days = diffDays(query.startDate, query.endDate);
    const prevEnd = shiftDate(query.startDate, -1);
    const prevStart = shiftDate(prevEnd, -days);

    const rows = await this.prisma.dailyMetric.findMany({
      where: {
        integrationId: { in: integrationIds },
        metricType: 'campaign',
        date: { gte: new Date(prevStart), lte: new Date(prevEnd) },
      },
    });

    let spend = 0;
    let leads = 0;
    let impressions = 0;
    let clicks = 0;
    for (const r of rows) {
      const d = r.data as Record<string, number>;
      spend += Number(d.spend ?? 0);
      leads += Number(d.leads ?? 0);
      impressions += Number(d.impressions ?? 0);
      clicks += Number(d.clicks ?? 0);
    }

    return {
      periodStart: prevStart,
      periodEnd: prevEnd,
      totalSpend: spend,
      totalLeads: leads,
      totalImpressions: impressions,
      totalClicks: clicks,
      cpl: leads > 0 ? spend / leads : 0,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      cpc: clicks > 0 ? spend / clicks : 0,
      cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
      cvr: clicks > 0 ? (leads / clicks) * 100 : 0,
      estimatedReach: impressions * config.reachFactor,
    };
  }

  private buildTrendDaily(dailyData: DailyPoint[], days: number) {
    const tail = dailyData.slice(-days);
    return {
      dates: tail.map((d) => d.date),
      spend: tail.map((d) => d.spend),
      leads: tail.map((d) => d.leads),
      impressions: tail.map((d) => d.impressions),
      clicks: tail.map((d) => d.clicks),
      reach: tail.map((d) => d.reach),
      cpl: tail.map((d) => (d.leads > 0 ? d.spend / d.leads : 0)),
      ctr: tail.map((d) => (d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0)),
      cpc: tail.map((d) => (d.clicks > 0 ? d.spend / d.clicks : 0)),
      cpm: tail.map((d) => (d.impressions > 0 ? (d.spend / d.impressions) * 1000 : 0)),
    };
  }

  private buildVerbaProduto(
    adsetTable: Array<{
      product: string | null;
      states: string[];
      spend: number;
      leads: number;
      budget: number;
      active: boolean;
    }>,
    config: MetaConfigShape,
  ) {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    const out = config.products.map((product) => {
      const productAdsets = adsetTable.filter((a) => a.product === product.key);
      const spent = productAdsets.reduce((s, a) => s + a.spend, 0);
      const leads = productAdsets.reduce((s, a) => s + a.leads, 0);
      const target = product.monthlyBudgetTarget;

      const distribution = config.stateBudgetByProduct[product.key] ?? {};
      const byState = config.states.map((st) => {
        const explicit = productAdsets.filter((a) => a.states.includes(st.code));
        const explicitSpend = explicit.reduce((s, a) => s + a.spend, 0);
        const explicitLeads = explicit.reduce((s, a) => s + a.leads, 0);
        const national = productAdsets.filter((a) => a.states.length === 0);
        const pct = Number(distribution[st.code] ?? 0);
        const nationalShare = pct / 100;
        const nationalSpend = national.reduce((s, a) => s + a.spend * nationalShare, 0);
        const nationalLeads = national.reduce((s, a) => s + a.leads * nationalShare, 0);
        const totalStateSpend = explicitSpend + nationalSpend;
        const totalStateLeads = explicitLeads + nationalLeads;
        const stateTarget = (target * pct) / 100;
        return {
          state: st.code,
          stateLabel: st.label,
          spent: totalStateSpend,
          leads: totalStateLeads,
          cpl: totalStateLeads > 0 ? totalStateSpend / totalStateLeads : 0,
          pct,
          target: stateTarget,
          pctOfTarget: stateTarget > 0 ? (totalStateSpend / stateTarget) * 100 : 0,
        };
      });

      const dailyAdsetBudget = productAdsets.filter((a) => a.active).reduce((s, a) => s + a.budget, 0);
      const expectedMonthSpend = dailyAdsetBudget * daysInMonth;

      return {
        key: product.key,
        label: product.label,
        color: product.color,
        target,
        spent,
        pct: target > 0 ? (spent / target) * 100 : 0,
        leads,
        cpl: leads > 0 ? spent / leads : 0,
        dailyBudget: dailyAdsetBudget,
        expectedMonthSpend,
        byState,
      };
    });

    const totalTarget = config.products.reduce((s, p) => s + p.monthlyBudgetTarget, 0);
    const totalSpent = out.reduce((s, p) => s + p.spent, 0);

    return {
      totalTarget,
      totalSpent,
      pctOfTarget: totalTarget > 0 ? (totalSpent / totalTarget) * 100 : 0,
      products: out,
    };
  }

  private emptyResponse() {
    return {
      campaigns: [],
      adsets: [],
      adsetMetrics: [],
      adsetTable: [],
      creatives: [],
      dailyData: [],
      summary: null,
      previousPeriodSummary: null,
      trendDaily: null,
      verbaProduto: { totalTarget: 0, totalSpent: 0, pctOfTarget: 0, products: [] },
      hierarchy: {
        campaigns: { total: 0, active: 0 },
        adsets: { total: 0, active: 0 },
        ads: { total: 0, active: 0 },
      },
      annualSummary: null,
      monthlySummaries: {},
      budgetPacing: [],
      pacing: null,
      isSecondary: false,
    };
  }
}
