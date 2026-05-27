import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AuditAction, AuditEntityType } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AuditLogService } from '@modules/audit-log/application/services/audit-log.service';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(agencyId: string, userId: string, requesterId: string) {
    if (userId === requesterId) {
      throw new ForbiddenException('Você não pode remover a si mesmo.');
    }

    const user = await this.prisma.user.findFirst({ where: { id: userId, agencyId } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    await this.auditLog.record({
      agencyId,
      action: AuditAction.DELETE,
      entityType: AuditEntityType.USER,
      entityId: user.id,
      entityName: user.name,
      description: `Usuário "${user.name}" desativado`,
    });
  }
}
