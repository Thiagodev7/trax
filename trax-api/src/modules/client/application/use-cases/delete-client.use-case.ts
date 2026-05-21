import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class DeleteClientUseCase {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Soft-delete: marca isActive = false em vez de deletar fisicamente.
   * Preserva histórico de relatórios e integrações.
   */
  async execute(agencyId: string, clientId: string): Promise<void> {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, agencyId },
      select: { id: true, isActive: true },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    await this.prisma.client.update({
      where: { id: clientId },
      data: { isActive: false },
    });
  }
}
