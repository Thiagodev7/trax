import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

interface OrganicQuery {
  agencyId: string;
  reportId: string;
  startDate?: string;
  endDate?: string;
  selectedDate?: string;
}

function inRange(dateStr: string, start?: string, end?: string): boolean {
  if (selectedDateOnly(start, end)) return dateStr === start;
  if (start && dateStr < start) return false;
  if (end && dateStr > end) return false;
  return true;
}

function selectedDateOnly(start?: string, end?: string): boolean {
  return !!start && !!end && start === end;
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

    const filterStart = query.selectedDate ?? query.startDate;
    const filterEnd = query.selectedDate ?? query.endDate;

    const igResult = await this.buildInstagram(igIntegrations, filterStart, filterEnd);
    const fbResult = await this.buildFacebook(fbIntegrations, filterStart, filterEnd);

    return { instagram: igResult, facebook: fbResult };
  }

  private async buildInstagram(
    igIntegrations: Array<{ id: string }>,
    startDate?: string,
    endDate?: string,
  ) {
    const empty = { profile: null, insights: [], posts: [], kpis: null, insightsAuto: [] as string[] };
    if (igIntegrations.length === 0) return empty;

    const igIds = igIntegrations.map((i) => i.id);
    const dateFilter: Record<string, unknown> = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
    const hasDateFilter = Object.keys(dateFilter).length > 0;

    const [profileRows, insightRows, postRows, followerRows] = await Promise.all([
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
      this.prisma.dailyMetric.findMany({
        where: { integrationId: { in: igIds }, metricType: 'organic_ig' },
        orderBy: { date: 'asc' },
      }),
    ]);

    const profile = profileRows[0]?.data ?? null;
    const insights = insightRows.map((r) => ({ date: r.date.toISOString().split('T')[0], ...((r.data as object) ?? {}) }));
    const posts = postRows.map((r) => r.data as Record<string, unknown>);

    const postsInPeriod = posts.filter((p) => {
      const d = String(p.date ?? '');
      return inRange(d, startDate, endDate);
    });

    const totalLikes = postsInPeriod.reduce((s, p) => s + Number(p.likeCount ?? 0), 0);
    const totalComments = postsInPeriod.reduce((s, p) => s + Number(p.commentsCount ?? 0), 0);

    const followerHistory = followerRows.map((r) => ({
      date: r.date.toISOString().split('T')[0],
      count: Number((r.data as Record<string, unknown>).follower_count ?? 0),
    }));

    let followerGain = 0;
    if (followerHistory.length >= 2) {
      const first = followerHistory[0]?.count ?? 0;
      const last = followerHistory[followerHistory.length - 1]?.count ?? 0;
      followerGain = last - first;
    }

    const reachMonth = insights.reduce((s, i) => s + Number((i as Record<string, unknown>).reach ?? 0), 0);
    const accountsEngaged = insights.reduce((s, i) => s + Number((i as Record<string, unknown>).accounts_engaged ?? 0), 0);
    const totalInteractions = insights.reduce((s, i) => s + Number((i as Record<string, unknown>).total_interactions ?? 0), 0);
    const websiteClicks = insights.reduce((s, i) => s + Number((i as Record<string, unknown>).website_clicks ?? 0), 0);

    const insightsAuto: string[] = [];
    if (postsInPeriod.length > 0) {
      const top = [...postsInPeriod].sort(
        (a, b) => Number(b.likeCount ?? 0) - Number(a.likeCount ?? 0),
      )[0];
      if (top) {
        insightsAuto.push(`Post com mais curtidas: ${String(top.caption ?? '').slice(0, 60)}...`);
      }
      const noComments = postsInPeriod.filter((p) => Number(p.commentsCount ?? 0) === 0);
      if (noComments.length > 0) {
        insightsAuto.push(`${noComments.length} post(s) sem comentários no período — incentive engajamento nos CTAs.`);
      }
    }
    if (followerGain > 0) {
      insightsAuto.push(`Ganho de ${followerGain} seguidores no histórico disponível.`);
    }

    return {
      profile,
      insights,
      posts: postsInPeriod,
      followerHistory,
      kpis: {
        followers: Number((profile as Record<string, unknown> | null)?.followersCount ?? 0),
        followerGain,
        postsCount: postsInPeriod.length,
        totalLikes,
        totalComments,
        reachMonth,
        accountsEngaged,
        totalInteractions,
        websiteClicks,
      },
      insightsAuto,
    };
  }

  private async buildFacebook(
    fbIntegrations: Array<{ id: string }>,
    startDate?: string,
    endDate?: string,
  ) {
    const empty = { profile: null, insights: [], posts: [], kpis: null, insightsAuto: [] as string[] };
    if (fbIntegrations.length === 0) return empty;

    const fbIds = fbIntegrations.map((i) => i.id);
    const dateFilter: Record<string, unknown> = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
    const hasDateFilter = Object.keys(dateFilter).length > 0;

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

    const profile = profileRows[0]?.data ?? null;
    const insights = insightRows.map((r) => ({ date: r.date.toISOString().split('T')[0], ...((r.data as object) ?? {}) }));
    const posts = postRows
      .map((r) => r.data as Record<string, unknown>)
      .filter((p) => inRange(String(p.date ?? ''), startDate, endDate));

    const fans = Number((profile as Record<string, unknown> | null)?.fanCount ?? 0);
    const talkingAbout = Number((profile as Record<string, unknown> | null)?.talkingAboutCount ?? 0);
    const totalLikes = posts.reduce((s, p) => s + Number(p.likeCount ?? 0), 0);
    const totalComments = posts.reduce((s, p) => s + Number(p.commentsCount ?? 0), 0);
    const totalShares = posts.reduce((s, p) => s + Number(p.sharesCount ?? 0), 0);
    const engagementRate = fans > 0 ? (talkingAbout / fans) * 100 : 0;

    return {
      profile,
      insights,
      posts,
      kpis: {
        fans,
        talkingAbout,
        postsCount: posts.length,
        totalLikes,
        totalComments,
        totalShares,
        engagementRate,
        pageReach: insights.reduce((s, i) => s + Number((i as Record<string, unknown>).page_reach ?? 0), 0),
        pageEngagedUsers: insights.reduce((s, i) => s + Number((i as Record<string, unknown>).page_engaged_users ?? 0), 0),
      },
      insightsAuto: engagementRate > 5
        ? ['Taxa de engajamento da página acima de 5% — comunidade ativa.']
        : ['Considere posts com perguntas ou enquetes para aumentar engajamento.'],
    };
  }
}
