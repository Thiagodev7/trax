import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

export interface GoogleDailyPoint {
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
}

interface GoogleAdsQuery {
  agencyId: string;
  reportId: string;
  startDate?: string;
  endDate?: string;
}

const CHANNEL_ORDER = ['Search', 'Display', 'Performance Max', 'Discovery', 'YouTube', 'Shopping'];

@Injectable()
export class GetGoogleAdsMetricsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GoogleAdsQuery) {
    const report = await this.prisma.report.findFirst({
      where: { id: query.reportId, agencyId: query.agencyId },
      include: { integrations: { include: { integration: true } } },
    });
    if (!report) throw new NotFoundException('Relatório não encontrado.');

    const googleIntegrations = report.integrations
      .map((ri) => ri.integration)
      .filter((i) => i.provider === 'GOOGLE_ADS' && i.status === 'ACTIVE');

    if (googleIntegrations.length === 0) {
      return {
        campaigns: [],
        dailyData: [],
        byChannelType: [],
        summary: null,
      };
    }

    const integrationIds = googleIntegrations.map((i) => i.id);
    const dateFilter: Record<string, unknown> = {};
    if (query.startDate) dateFilter.gte = new Date(query.startDate);
    if (query.endDate) dateFilter.lte = new Date(query.endDate);

    const campaignRows = await this.prisma.dailyMetric.findMany({
      where: {
        integrationId: { in: integrationIds },
        metricType: 'campaign',
        ...(Object.keys(dateFilter).length && { date: dateFilter }),
      },
      orderBy: { date: 'asc' },
    });

    const dailyMap: Record<string, GoogleDailyPoint> = {};
    const campaignMap: Record<string, Record<string, unknown>> = {};
    const channelMap: Record<string, number> = {};

    for (const row of campaignRows) {
      const d = row.data as Record<string, unknown>;
      const date = row.date.toISOString().split('T')[0];
      const spend = Number(d.spend ?? 0);
      const clicks = Number(d.clicks ?? 0);
      const impressions = Number(d.impressions ?? 0);
      const conversions = Number(d.conversions ?? 0);

      if (!dailyMap[date]) {
        dailyMap[date] = { date, impressions: 0, clicks: 0, spend: 0, conversions: 0 };
      }
      dailyMap[date].spend += spend;
      dailyMap[date].clicks += clicks;
      dailyMap[date].impressions += impressions;
      dailyMap[date].conversions += conversions;

      const id = String(d.campaign_id ?? row.entityId ?? '');
      if (!campaignMap[id]) {
        campaignMap[id] = {
          id,
          name: String(d.campaign_name ?? row.entityName ?? id),
          spend: 0,
          clicks: 0,
          impressions: 0,
          conversions: 0,
          ctr: 0,
          cpc: 0,
        };
      }
      campaignMap[id].spend = Number(campaignMap[id].spend) + spend;
      campaignMap[id].clicks = Number(campaignMap[id].clicks) + clicks;
      campaignMap[id].impressions = Number(campaignMap[id].impressions) + impressions;
      campaignMap[id].conversions = Number(campaignMap[id].conversions) + conversions;

      const channelLabel = String(d.channel_label ?? d.advertising_channel_type ?? 'Outros');
      channelMap[channelLabel] = (channelMap[channelLabel] ?? 0) + conversions;
    }

    const campaigns = Object.values(campaignMap).map((c) => {
      const impressions = Number(c.impressions);
      const clicks = Number(c.clicks);
      const spend = Number(c.spend);
      const conversions = Number(c.conversions);
      return {
        id: String(c.id),
        name: String(c.name),
        spend,
        clicks,
        impressions,
        conversions,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        cpc: clicks > 0 ? spend / clicks : 0,
        cpa: conversions > 0 ? spend / conversions : 0,
      };
    });

    const dailyData = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    const totalSpend = dailyData.reduce((s, d) => s + d.spend, 0);
    const totalClicks = dailyData.reduce((s, d) => s + d.clicks, 0);
    const totalImpressions = dailyData.reduce((s, d) => s + d.impressions, 0);
    const totalConversions = dailyData.reduce((s, d) => s + d.conversions, 0);

    let impressionShareSum = 0;
    let impressionShareCount = 0;
    let qualitySum = 0;
    let qualityCount = 0;
    for (const row of campaignRows) {
      const d = row.data as Record<string, unknown>;
      const is = Number(d.search_impression_share ?? 0);
      if (is > 0) {
        impressionShareSum += is;
        impressionShareCount++;
      }
      const qs = d.quality_score;
      if (qs != null && Number(qs) > 0) {
        qualitySum += Number(qs);
        qualityCount++;
      }
    }

    const summary = {
      totalSpend,
      totalClicks,
      totalImpressions,
      totalConversions,
      conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
      cpa: totalConversions > 0 ? totalSpend / totalConversions : 0,
      avgCpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
      impressionShare: impressionShareCount > 0 ? impressionShareSum / impressionShareCount : 0,
      avgQualityScore: qualityCount > 0 ? qualitySum / qualityCount : null,
    };

    const byChannelType = CHANNEL_ORDER.filter((l) => channelMap[l] != null).map((label) => ({
      label,
      conversions: channelMap[label] ?? 0,
    }));
    for (const [label, conversions] of Object.entries(channelMap)) {
      if (!CHANNEL_ORDER.includes(label)) {
        byChannelType.push({ label, conversions });
      }
    }

    return { campaigns, dailyData, byChannelType, summary };
  }
}
