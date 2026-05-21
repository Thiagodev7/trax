import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

interface CalendarQuery {
  agencyId: string;
  reportId: string;
  startDate?: string;
  endDate?: string;
}

const POST_METRIC_TYPES = ['organic_ig_post', 'organic_fb_post'];

@Injectable()
export class GetCalendarMetricsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: CalendarQuery) {
    const report = await this.prisma.report.findFirst({
      where: { id: query.reportId, agencyId: query.agencyId },
      include: { integrations: { include: { integration: true } } },
    });
    if (!report) throw new NotFoundException('Relatório não encontrado.');

    const integrations = report.integrations.map((ri) => ri.integration);
    const organicIntegrations = integrations.filter(
      (i) => (i.provider === 'INSTAGRAM' || i.provider === 'FACEBOOK_PAGE') && i.status === 'ACTIVE',
    );

    if (organicIntegrations.length === 0) {
      return { posts: [] };
    }

    const ids = organicIntegrations.map((i) => i.id);
    const dateFilter: Record<string, unknown> = {};
    if (query.startDate) dateFilter.gte = new Date(query.startDate);
    if (query.endDate) dateFilter.lte = new Date(query.endDate);

    const rows = await this.prisma.dailyMetric.findMany({
      where: {
        integrationId: { in: ids },
        metricType: { in: POST_METRIC_TYPES },
        ...(Object.keys(dateFilter).length && { date: dateFilter }),
      },
      orderBy: { date: 'asc' },
      include: { integration: { select: { provider: true } } },
    });

    const posts = rows.map((r) => {
      const d = r.data as Record<string, unknown>;
      return {
        id: r.entityId,
        date: r.date.toISOString().split('T')[0],
        platform: r.integration.provider === 'INSTAGRAM' ? 'instagram' : 'facebook',
        caption: d.caption ?? d.message ?? '',
        thumbnailUrl: d.thumbnailUrl,
        permalink: d.permalink,
        likeCount: d.likeCount ?? 0,
        commentsCount: d.commentsCount ?? 0,
        mediaType: d.mediaType ?? 'IMAGE',
      };
    });

    return { posts };
  }
}
