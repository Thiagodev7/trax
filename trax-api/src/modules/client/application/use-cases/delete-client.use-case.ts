import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, AuditEntityType } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AuditLogService } from '@modules/audit-log/application/services/audit-log.service';

@Injectable()
export class DeleteClientUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(agencyId: string, clientId: string): Promise<void> {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, agencyId },
      select: { id: true, name: true, isActive: true },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    await this.prisma.client.update({
      where: { id: clientId },
      data: { isActive: false },
    });

    await this.auditLog.record({
      agencyId,
      action: AuditAction.DELETE,
      entityType: AuditEntityType.CLIENT,
      entityId: client.id,
      entityName: client.name,
      description: `Cliente "${client.name}" desativado`,
    });
  }
}
