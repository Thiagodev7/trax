import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AuditAction, AuditActorType, AuditEntityType, UserRole } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateUserDto } from '../../presentation/dto/update-user.dto';
import { AuditLogService } from '@modules/audit-log/application/services/audit-log.service';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { agency: { select: { id: true, name: true } } },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    if (user.role === UserRole.AGENCY_ADMIN && user.isActive) {
      const willRemoveAdmin =
        dto.isActive === false ||
        (dto.role !== undefined && dto.role !== UserRole.AGENCY_ADMIN);

      if (willRemoveAdmin) {
        const otherAdmins = await this.prisma.user.count({
          where: {
            agencyId: user.agencyId,
            role: UserRole.AGENCY_ADMIN,
            isActive: true,
            id: { not: userId },
          },
        });

        if (otherAdmins === 0) {
          throw new BadRequestException(
            'Não é possível desativar ou rebaixar o único administrador da agência',
          );
        }
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.role !== undefined && { role: dto.role }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        agency: { select: { id: true, name: true, slug: true } },
      },
    });

    await this.auditLog.record({
      agencyId: user.agencyId,
      actorType: AuditActorType.SUPER_ADMIN,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.USER,
      entityId: updated.id,
      entityName: updated.name,
      description: `Usuário "${updated.name}" atualizado pelo super-admin`,
      metadata: { fields: Object.keys(dto) },
    });

    return updated;
  }
}
