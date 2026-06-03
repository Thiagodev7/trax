import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, AuditEntityType } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AuditLogService } from '@modules/audit-log/application/services/audit-log.service';

@Injectable()
export class DeleteCompanyUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(agencyId: string, companyId: string): Promise<void> {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, agencyId },
      select: { id: true, name: true, isActive: true },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    await this.prisma.company.update({
      where: { id: companyId },
      data: { isActive: false },
    });

    await this.auditLog.record({
      agencyId,
      action: AuditAction.DELETE,
      entityType: AuditEntityType.COMPANY,
      entityId: company.id,
      entityName: company.name,
      description: `Empresa "${company.name}" desativada`,
    });
  }
}
