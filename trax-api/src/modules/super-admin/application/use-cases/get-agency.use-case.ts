import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class GetAgencyUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(agencyId: string) {
    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
      include: {
        _count: {
          select: {
            clients: true,
            users: true,
            reports: true,
          },
        },
      },
    });

    if (!agency) throw new NotFoundException('Agência não encontrada');

    const [integrationsCount, recentIntegrationErrors] = await Promise.all([
      this.prisma.integration.count({ where: { agencyId } }),
      this.prisma.integration.findMany({
        where: { agencyId, status: 'ERROR' },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          provider: true,
          displayName: true,
          lastErrorMsg: true,
          updatedAt: true,
          client: { select: { id: true, name: true } },
        },
      }),
    ]);

    return {
      ...agency,
      _count: {
        ...agency._count,
        integrations: integrationsCount,
      },
      recentIntegrationErrors,
    };
  }
}
