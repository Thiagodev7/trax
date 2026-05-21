import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

export interface DailyPoint { date: string; impressions: number; clicks: number; spend: number; leads: number; reach: number }

interface MetaAdsQuery {
  agencyId: string;
  reportId: string;
  startDate?: string;
  endDate?: string;
  campaign?: string; // filter by campaign name keyword
}

@Injectable()
export class GetMetaAdsMetricsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: MetaAdsQuery) {
    const report = await this.prisma.report.findFirst({
      where: { id: query.reportId, agencyId: query.agencyId },
      include: { integrations: { include: { integration: true } } },
    });
    if (!report) throw new NotFoundException('Relatório não encontrado.');

    const metaIntegrations = report.integrations
      .map((ri) => ri.integration)
      .filter((i) => i.provider === 'META_ADS' && i.status === 'ACTIVE');

    if (metaIntegrations.length === 0) {
      return { campaigns: [], adsets: [], adsetMetrics: [], creatives: [], dailyData: [], summary: null };
    }

    const integrationIds = metaIntegrations.map((i) => i.id);

    const dateFilter: Record<string, unknown> = {};
    if (query.startDate) dateFilter.gte = new Date(query.startDate);
    if (query.endDate) dateFilter.lte = new Date(query.endDate);

    // Fetch all metric types
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

    // Filter by campaign keyword
    const filteredCampaigns = query.campaign && query.campaign !== 'all'
      ? campaignRows.filter((r) => {
          const d = r.data as Record<string, unknown>;
          return String(d.campaign_name ?? '').toUpperCase().includes(query.campaign!.toUpperCase());
        })
      : campaignRows;

    // Aggregate daily data
    const dailyMap: Record<string, Record<string, number>> = {};
    for (const row of filteredCampaigns) {
      const date = row.date.toISOString().split('T')[0];
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

    // Campaign summary
    const campaignMap: Record<string, Record<string, number>> = {};
    for (const row of filteredCampaigns) {
      const d = row.data as Record<string, unknown>;
      const id = String(d.campaign_id);
      const name = String(d.campaign_name);
      if (!campaignMap[id]) campaignMap[id] = { spend: 0, leads: 0, impressions: 0, clicks: 0 };
      campaignMap[id].spend += Number((d as any).spend ?? 0);
      campaignMap[id].leads += Number((d as any).leads ?? 0);
      campaignMap[id].impressions += Number((d as any).impressions ?? 0);
      campaignMap[id].clicks += Number((d as any).clicks ?? 0);
      (campaignMap[id] as any).name = name;
    }

    const campaigns = Object.entries(campaignMap).map(([id, data]) => ({
      id,
      name: (data as any).name,
      spend: data.spend,
      leads: data.leads,
      impressions: data.impressions,
      clicks: data.clicks,
      cpl: data.leads > 0 ? data.spend / data.leads : 0,
      ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0,
    }));

    // Global summary
    const totalSpend = dailyData.reduce((s, d) => s + d.spend, 0);
    const totalLeads = dailyData.reduce((s, d) => s + d.leads, 0);
    const totalImpressions = dailyData.reduce((s, d) => s + d.impressions, 0);
    const totalClicks = dailyData.reduce((s, d) => s + d.clicks, 0);
    const summary = {
      totalSpend,
      totalLeads,
      totalImpressions,
      totalClicks,
      cpl: totalLeads > 0 ? totalSpend / totalLeads : 0,
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
      cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
    };

    return {
      campaigns,
      adsets: adsetInfoRows.map((r) => r.data),
      adsetMetrics: adsetRows.map((r) => ({ date: r.date, ...((r.data as object) ?? {}) })),
      creatives: creativeRows.map((r) => r.data),
      dailyData,
      summary,
    };
  }
}
