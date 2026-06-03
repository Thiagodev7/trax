import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

const PLAN_LABELS: Record<string, string> = {
  TRIAL: 'Trial',
  STARTER: 'Starter',
  PRO: 'Pro',
  AGENCY: 'Agency',
  ENTERPRISE: 'Enterprise',
};

@Injectable()
export class GetAgencyPlanUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(agencyId: string) {
    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
      select: {
        plan: true,
        maxCompanies: true,
        maxUsers: true,
        trialEndsAt: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    });

    if (!agency) throw new NotFoundException('Agência não encontrada');

    const [clientsCount, usersCount, integrationsCount] = await Promise.all([
      this.prisma.company.count({ where: { agencyId, isActive: true } }),
      this.prisma.user.count({ where: { agencyId, isActive: true } }),
      this.prisma.integration.count({ where: { agencyId } }),
    ]);

    return {
      plan: agency.plan,
      planLabel: PLAN_LABELS[agency.plan] ?? agency.plan,
      maxCompanies: agency.maxCompanies,
      maxUsers: agency.maxUsers,
      trialEndsAt: agency.trialEndsAt,
      billingConfigured: !!(agency.stripeCustomerId && agency.stripeSubscriptionId),
      usage: {
        companies: clientsCount,
        users: usersCount,
        integrations: integrationsCount,
      },
    };
  }
}
