import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class DeleteUserUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(agencyId: string, userId: string, requesterId: string) {
    if (userId === requesterId) {
      throw new ForbiddenException('Você não pode remover a si mesmo.');
    }

    const user = await this.prisma.user.findFirst({ where: { id: userId, agencyId } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    // Soft delete: desativar em vez de deletar do banco
    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
  }
}
