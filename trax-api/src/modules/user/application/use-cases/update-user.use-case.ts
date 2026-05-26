import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { UpdateUserDto } from '../../presentation/dto/update-user.dto';

@Injectable()
export class UpdateUserUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(agencyId: string, userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, agencyId } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    if (dto.role === UserRole.CLIENT_VIEWER && dto.clientIds !== undefined) {
      if (dto.clientIds.length === 0) {
        throw new BadRequestException('CLIENT_VIEWER precisa ter ao menos um cliente.');
      }
      // Resetar vínculos
      await this.prisma.userClient.deleteMany({ where: { userId } });
      await this.prisma.userClient.createMany({
        data: dto.clientIds.map((clientId) => ({ userId, clientId, agencyId })),
        skipDuplicates: true,
      });
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.role !== undefined && { role: dto.role }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
  }
}
