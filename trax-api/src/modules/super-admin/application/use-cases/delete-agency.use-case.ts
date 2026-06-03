import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, AuditActorType, AuditEntityType } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AuditLogService } from '@modules/audit-log/application/services/audit-log.service';

export interface AgencyDeletePreview {
  agency: { id: string; name: string; slug: string };
  counts: {
    users: number;
    companies: number;
    reports: number;
    integrations: number;
  };
}

@Injectable()
export class DeleteAgencyUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async getPreview(agencyId: string): Promise<AgencyDeletePreview> {
    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
      select: { id: true, name: true, slug: true },
    });

    if (!agency) throw new NotFoundException('Agência não encontrada');

    const [users, companies, reports, integrations] = await Promise.all([
      this.prisma.user.count({ where: { agencyId } }),
      this.prisma.company.count({ where: { agencyId } }),
      this.prisma.report.count({ where: { agencyId } }),
      this.prisma.integration.count({ where: { agencyId } }),
    ]);

    return {
      agency,
      counts: { users, companies, reports, integrations },
    };
  }

  async execute(agencyId: string) {
    const preview = await this.getPreview(agencyId);

    await this.auditLog.record({
      agencyId,
      actorType: AuditActorType.SUPER_ADMIN,
      action: AuditAction.DELETE,
      entityType: AuditEntityType.AGENCY,
      entityId: preview.agency.id,
      entityName: preview.agency.name,
      description: `Agência "${preview.agency.name}" excluída pelo super-admin`,
      metadata: { slug: preview.agency.slug, counts: preview.counts },
    });

    await this.prisma.agency.delete({ where: { id: agencyId } });

    return {
      success: true,
      deleted: preview,
    };
  }
}
