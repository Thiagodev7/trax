import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, AuditEntityType } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AuditLogService } from '@modules/audit-log/application/services/audit-log.service';

@Injectable()
export class DeleteIntegrationUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(agencyId: string, integrationId: string) {
    const existing = await this.prisma.integration.findFirst({
      where: { id: integrationId, agencyId },
    });
    if (!existing) throw new NotFoundException('Integração não encontrada.');

    await this.prisma.integration.delete({ where: { id: integrationId } });

    await this.auditLog.record({
      agencyId,
      action: AuditAction.DELETE,
      entityType: AuditEntityType.INTEGRATION,
      entityId: existing.id,
      entityName: existing.displayName ?? existing.provider,
      description: `Integração ${existing.provider} removida`,
    });
  }
}
