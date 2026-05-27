import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateSuperAdminPasswordDto } from '../../presentation/dto/update-super-admin-password.dto';

@Injectable()
export class GetSuperAdminMeUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(adminId: string) {
    const admin = await this.prisma.superAdmin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!admin) throw new NotFoundException('Super-admin não encontrado');
    return admin;
  }
}

@Injectable()
export class UpdateSuperAdminPasswordUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(adminId: string, dto: UpdateSuperAdminPasswordDto) {
    const admin = await this.prisma.superAdmin.findUnique({
      where: { id: adminId },
    });

    if (!admin) throw new NotFoundException('Super-admin não encontrado');

    const valid = await bcrypt.compare(dto.currentPassword, admin.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Senha atual incorreta');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.superAdmin.update({
      where: { id: adminId },
      data: { passwordHash },
    });

    return { success: true, message: 'Senha atualizada com sucesso' };
  }
}
