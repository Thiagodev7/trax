import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { MetaConfigService } from '@/modules/company/meta-config/meta-config.service';
import { campaignCodeFromName, detectProduct, detectStates } from '@common/utils/meta-heuristics';
import { MetaConfigShape, defaultMetaConfig } from '@/modules/company/meta-config/meta-config.template';

interface Query {
  agencyId: string;
  reportId: string;
  adsetId: string;
  startDate?: string;
  endDate?: string;
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

@Injectable()
export class GetMetaAdsAdsetDetailUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly metaConfig: MetaConfigService,
  ) {}

  async execute(q: Query) {
    const report = await this.prisma.report.findFirst({
      where: { id: q.reportId, agencyId: q.agencyId },
      include: { integrations: { include: { integration: true } } },
    });
    if (!report) throw new NotFoundException('Relatório não encontrado.');

    const ids = report.integrations
      .map((ri) => ri.integration)
      .filter((i) => i.provider === 'META_ADS' && i.status === 'ACTIVE')
      .map((i) => i.id);

    if (ids.length === 0) throw new NotFoundException('Sem integrações Meta Ads ativas.');

    let config: MetaConfigShape = defaultMetaConfig();
    try {
      const cfg = await this.metaConfig.getOrCreate(q.agencyId, report.companyId);
      config = cfg as MetaConfigShape;
    } catch {
      /* ignore */
    }

    const dateFilter: Record<string, unknown> = {};
    if (q.startDate) dateFilter.gte = new Date(q.startDate);
    if (q.endDate) dateFilter.lte = new Date(q.endDate);

    const [infoRow, dailyRows, creativeRows] = await Promise.all([
      this.prisma.dailyMetric.findFirst({
        where: { integrationId: { in: ids }, metricType: 'adset_info', entityId: q.adsetId },
      }),
      this.prisma.dailyMetric.findMany({
        where: {
          integrationId: { in: ids },
          metricType: 'adset',
          entityId: q.adsetId,
          ...(Object.keys(dateFilter).length && { date: dateFilter }),
        },
        orderBy: { date: 'asc' },
      }),
      this.prisma.dailyMetric.findMany({
        where: { integrationId: { in: ids }, metricType: 'creative' },
      }),
    ]);

    const info = (infoRow?.data as Record<string, unknown> | undefined) ?? {};
    const name = String(info.name ?? q.adsetId);
    const product = detectProduct(name, config);
    const states = detectStates(name, config);
    const campaign = campaignCodeFromName(name);

    const dailySeries = dailyRows.map((r) => {
      const d = r.data as Record<string, number>;
      const spend = Number(d.spend ?? 0);
      const leads = Number(d.leads ?? 0);
      const clicks = Number(d.clicks ?? 0);
      const impressions = Number(d.impressions ?? 0);
      return {
        date: toDateStr(r.date),
        spend,
        leads,
        clicks,
        impressions,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        cpc: clicks > 0 ? spend / clicks : 0,
        cpl: leads > 0 ? spend / leads : 0,
      };
    });

    const totals = dailySeries.reduce(
      (acc, p) => {
        acc.spend += p.spend;
        acc.leads += p.leads;
        acc.clicks += p.clicks;
        acc.impressions += p.impressions;
        return acc;
      },
      { spend: 0, leads: 0, clicks: 0, impressions: 0 },
    );

    const ads = creativeRows
      .map((r) => {
        const d = r.data as Record<string, unknown>;
        const adsetIdOnCreative = String(d.adset_id ?? '');
        const spend = Number(d.spend ?? 0);
        const leads = Number(d.leads ?? 0);
        return {
          ad_id: String(d.ad_id ?? ''),
          ad_name: String(d.ad_name ?? ''),
          adset_id: adsetIdOnCreative,
          spend,
          leads,
          thumbnailUrl: d.thumbnailUrl as string | undefined,
          permalink: d.permalink as string | undefined,
          cpl: leads > 0 ? spend / leads : null,
          status: String(d.status ?? 'ACTIVE'),
        };
      })
      .filter((c) => c.adset_id === q.adsetId)
      .sort((a, b) => b.leads - a.leads);

    return {
      id: q.adsetId,
      name,
      campaign,
      product,
      states,
      status: String(info.status ?? 'UNKNOWN'),
      dailyBudget: Number(info.dailyBudget ?? 0),
      info,
      totals: {
        spend: totals.spend,
        leads: totals.leads,
        impressions: totals.impressions,
        clicks: totals.clicks,
        ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
        cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
        cpl: totals.leads > 0 ? totals.spend / totals.leads : 0,
        cpm: totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0,
      },
      dailySeries,
      ads,
    };
  }
}
