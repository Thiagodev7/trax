import { Injectable, BadRequestException } from '@nestjs/common';
import { AuditAction, AuditEntityType, ReportStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '@/prisma/prisma.service';
import { AuditLogService } from '@modules/audit-log/application/services/audit-log.service';

@Injectable()
export class PublishReportUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(agencyId: string, reportId: string) {
    const report = await this.prisma.report.findFirst({
      where: { id: reportId, agencyId },
      select: { id: true, title: true, status: true },
    });

    if (!report) {
      throw new BadRequestException('Relatório não encontrado');
    }

    if (report.status === ReportStatus.ARCHIVED) {
      throw new BadRequestException('Relatórios arquivados não podem ser publicados');
    }

    const shareToken = randomBytes(48).toString('base64url');

    const published = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.PUBLISHED,
        shareToken,
        publishedAt: new Date(),
      },
      select: {
        id: true,
        title: true,
        status: true,
        shareToken: true,
        publishedAt: true,
      },
    });

    await this.auditLog.record({
      agencyId,
      action: AuditAction.PUBLISH,
      entityType: AuditEntityType.REPORT,
      entityId: published.id,
      entityName: published.title,
      description: `Relatório "${published.title}" publicado`,
    });

    return published;
  }
}
