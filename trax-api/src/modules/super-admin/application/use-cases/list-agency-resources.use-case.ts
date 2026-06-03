import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class ListAgencyCompaniesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(agencyId: string) {
    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
      select: { id: true },
    });
    if (!agency) throw new NotFoundException('Agência não encontrada');

    return this.prisma.company.findMany({
      where: { agencyId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        website: true,
        isActive: true,
        createdAt: true,
        _count: { select: { integrations: true, reports: true } },
      },
    });
  }
}

@Injectable()
export class ListAgencyIntegrationsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(agencyId: string) {
    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
      select: { id: true },
    });
    if (!agency) throw new NotFoundException('Agência não encontrada');

    return this.prisma.integration.findMany({
      where: { agencyId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        provider: true,
        status: true,
        displayName: true,
        externalAccount: true,
        lastSyncAt: true,
        lastErrorMsg: true,
        updatedAt: true,
        company: { select: { id: true, name: true } },
      },
    });
  }
}
