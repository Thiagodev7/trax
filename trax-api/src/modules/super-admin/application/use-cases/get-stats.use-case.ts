import { Injectable } from '@nestjs/common';
import { AgencyPlan } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

export interface PlatformStats {
  totalAgencies: number;
  activeAgencies: number;
  inactiveAgencies: number;
  totalUsers: number;
  activeUsers: number;
  totalClients: number;
  totalReports: number;
  trialsExpiringSoon: number;
  expiredTrials: number;
  agenciesWithIntegrations: number;
  agenciesWithStripeCustomer: number;
  failedSyncsLast24h: number;
  agenciesByPlan: Record<string, number>;
  agenciesByStatus: { active: number; inactive: number };
  recentAgencies: Array<{
    id: string;
    name: string;
    slug: string;
    plan: string;
    createdAt: Date;
  }>;
  topAgenciesByClients: Array<{
    id: string;
    name: string;
    slug: string;
    clientCount: number;
  }>;
}

@Injectable()
export class GetStatsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<PlatformStats> {
    const now = new Date();
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);
    const last24h = new Date();
    last24h.setHours(last24h.getHours() - 24);

    const [
      totalAgencies,
      activeAgencies,
      inactiveAgencies,
      totalUsers,
      activeUsers,
      totalClients,
      totalReports,
      trialsExpiringSoon,
      expiredTrials,
      agenciesWithIntegrations,
      agenciesWithStripeCustomer,
      failedSyncsLast24h,
      agenciesByPlanRaw,
      recentAgencies,
      allAgenciesWithClientCounts,
    ] = await Promise.all([
      this.prisma.agency.count(),
      this.prisma.agency.count({ where: { isActive: true } }),
      this.prisma.agency.count({ where: { isActive: false } }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.client.count(),
      this.prisma.report.count(),
      this.prisma.agency.count({
        where: {
          trialEndsAt: { gte: now, lte: in7Days },
        },
      }),
      this.prisma.agency.count({
        where: {
          plan: AgencyPlan.TRIAL,
          trialEndsAt: { lt: now },
        },
      }),
      this.prisma.agency.count({
        where: {
          clients: {
            some: {
              integrations: { some: {} },
            },
          },
        },
      }),
      this.prisma.agency.count({
        where: { stripeCustomerId: { not: null } },
      }),
      this.prisma.integration.count({
        where: {
          status: 'ERROR',
          updatedAt: { gte: last24h },
        },
      }),
      this.prisma.agency.groupBy({
        by: ['plan'],
        _count: { plan: true },
      }),
      this.prisma.agency.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, slug: true, plan: true, createdAt: true },
      }),
      this.prisma.agency.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          _count: { select: { clients: true } },
        },
        orderBy: { clients: { _count: 'desc' } },
        take: 5,
      }),
    ]);

    const agenciesByPlan: Record<string, number> = {};
    for (const row of agenciesByPlanRaw) {
      agenciesByPlan[row.plan] = row._count.plan;
    }

    const topAgenciesByClients = allAgenciesWithClientCounts.map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      clientCount: a._count.clients,
    }));

    return {
      totalAgencies,
      activeAgencies,
      inactiveAgencies,
      totalUsers,
      activeUsers,
      totalClients,
      totalReports,
      trialsExpiringSoon,
      expiredTrials,
      agenciesWithIntegrations,
      agenciesWithStripeCustomer,
      failedSyncsLast24h,
      agenciesByPlan,
      agenciesByStatus: { active: activeAgencies, inactive: inactiveAgencies },
      recentAgencies,
      topAgenciesByClients,
    };
  }
}
