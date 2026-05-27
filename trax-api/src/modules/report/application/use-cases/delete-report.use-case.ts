import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AuditAction, AuditEntityType, UserRole } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthenticatedUser } from '@common/decorators/current-user.decorator';
import { AuditLogService } from '@modules/audit-log/application/services/audit-log.service';

interface DeleteReportInput {
  agencyId: string;
  reportId: string;
  user: AuthenticatedUser;
}

@Injectable()
export class DeleteReportUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute({ agencyId, reportId, user }: DeleteReportInput): Promise<void> {
    const report = await this.prisma.report.findFirst({
      where: { id: reportId, agencyId },
    });

    if (!report) throw new NotFoundException('Relatório não encontrado');

    if (user.role !== UserRole.AGENCY_ADMIN) {
      throw new ForbiddenException('Apenas administradores podem excluir relatórios');
    }

    await this.prisma.report.delete({
      where: { id: reportId },
    });

    await this.auditLog.record({
      agencyId,
      userId: user.sub,
      action: AuditAction.DELETE,
      entityType: AuditEntityType.REPORT,
      entityId: report.id,
      entityName: report.title,
      description: `Relatório "${report.title}" excluído`,
    });
  }
}
