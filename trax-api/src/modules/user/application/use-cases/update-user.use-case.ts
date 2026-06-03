import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AuditAction, AuditEntityType, UserRole } from '@prisma/client';
import { UpdateUserDto } from '../../presentation/dto/update-user.dto';
import { AuditLogService } from '@modules/audit-log/application/services/audit-log.service';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(agencyId: string, userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, agencyId } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    if (dto.role === UserRole.COMPANY_VIEWER && dto.companyIds !== undefined) {
      if (dto.companyIds.length === 0) {
        throw new BadRequestException('COMPANY_VIEWER precisa ter ao menos uma empresa.');
      }
      await this.prisma.userCompany.deleteMany({ where: { userId } });
      await this.prisma.userCompany.createMany({
        data: dto.companyIds.map((companyId) => ({ userId, companyId, agencyId })),
        skipDuplicates: true,
      });
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.role !== undefined && { role: dto.role }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    await this.auditLog.record({
      agencyId,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.USER,
      entityId: updated.id,
      entityName: updated.name,
      description: `Usuário "${updated.name}" atualizado`,
      metadata: { fields: Object.keys(dto) },
    });

    return updated;
  }
}
