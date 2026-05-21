import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class DeleteIntegrationUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(agencyId: string, integrationId: string) {
    const existing = await this.prisma.integration.findFirst({
      where: { id: integrationId, agencyId },
    });
    if (!existing) throw new NotFoundException('Integração não encontrada.');

    await this.prisma.integration.delete({ where: { id: integrationId } });
  }
}
