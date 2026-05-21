import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class ListIntegrationsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(agencyId: string, clientId: string) {
    await this.prisma.client.findFirstOrThrow({
      where: { id: clientId, agencyId },
    });

    return this.prisma.integration.findMany({
      where: { agencyId, clientId },
      select: {
        id: true,
        provider: true,
        displayName: true,
        status: true,
        metadata: true,
        externalAccount: true,
        lastSyncAt: true,
        lastErrorMsg: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
