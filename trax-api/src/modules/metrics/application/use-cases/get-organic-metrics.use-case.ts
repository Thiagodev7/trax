import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

interface OrganicQuery {
  agencyId: string;
  reportId: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class GetOrganicMetricsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: OrganicQuery) {
    const report = await this.prisma.report.findFirst({
      where: { id: query.reportId, agencyId: query.agencyId },
      include: { integrations: { include: { integration: true } } },
    });
    if (!report) throw new NotFoundException('Relatório não encontrado.');

    const integrations = report.integrations.map((ri) => ri.integration);
    const igIntegrations = integrations.filter((i) => i.provider === 'INSTAGRAM' && i.status === 'ACTIVE');
    const fbIntegrations = integrations.filter((i) => i.provider === 'FACEBOOK_PAGE' && i.status === 'ACTIVE');

    const dateFilter: Record<string, unknown> = {};
    if (query.startDate) dateFilter.gte = new Date(query.startDate);
    if (query.endDate) dateFilter.lte = new Date(query.endDate);
    const hasDateFilter = Object.keys(dateFilter).length > 0;

    // Instagram
    const igResult: Record<string, unknown> = { profile: null, insights: [], posts: [] };
    if (igIntegrations.length > 0) {
      const igIds = igIntegrations.map((i) => i.id);

      const [profileRows, insightRows, postRows] = await Promise.all([
        this.prisma.dailyMetric.findMany({
          where: { integrationId: { in: igIds }, metricType: 'organic_ig_profile' },
          orderBy: { date: 'desc' },
          take: 1,
        }),
        this.prisma.dailyMetric.findMany({
          where: {
            integrationId: { in: igIds },
            metricType: 'organic_ig',
            ...(hasDateFilter && { date: dateFilter }),
          },
          orderBy: { date: 'asc' },
        }),
        this.prisma.dailyMetric.findMany({
          where: {
            integrationId: { in: igIds },
            metricType: 'organic_ig_post',
            ...(hasDateFilter && { date: dateFilter }),
          },
          orderBy: { date: 'desc' },
        }),
      ]);

      igResult.profile = profileRows[0]?.data ?? null;
      igResult.insights = insightRows.map((r) => ({ date: r.date, ...((r.data as object) ?? {}) }));
      igResult.posts = postRows.map((r) => r.data);
    }

    // Facebook Page
    const fbResult: Record<string, unknown> = { profile: null, insights: [], posts: [] };
    if (fbIntegrations.length > 0) {
      const fbIds = fbIntegrations.map((i) => i.id);

      const [profileRows, insightRows, postRows] = await Promise.all([
        this.prisma.dailyMetric.findMany({
          where: { integrationId: { in: fbIds }, metricType: 'organic_fb_profile' },
          orderBy: { date: 'desc' },
          take: 1,
        }),
        this.prisma.dailyMetric.findMany({
          where: {
            integrationId: { in: fbIds },
            metricType: 'organic_fb',
            ...(hasDateFilter && { date: dateFilter }),
          },
          orderBy: { date: 'asc' },
        }),
        this.prisma.dailyMetric.findMany({
          where: {
            integrationId: { in: fbIds },
            metricType: 'organic_fb_post',
            ...(hasDateFilter && { date: dateFilter }),
          },
          orderBy: { date: 'desc' },
        }),
      ]);

      fbResult.profile = profileRows[0]?.data ?? null;
      fbResult.insights = insightRows.map((r) => ({ date: r.date, ...((r.data as object) ?? {}) }));
      fbResult.posts = postRows.map((r) => r.data);
    }

    return { instagram: igResult, facebook: fbResult };
  }
}
