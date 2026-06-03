import { Injectable, BadRequestException } from '@nestjs/common';
import { AuditAction, AuditEntityType } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateReportDto } from '../../presentation/dto/create-report.dto';
import { AuditLogService } from '@modules/audit-log/application/services/audit-log.service';

@Injectable()
export class CreateReportUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(agencyId: string, dto: CreateReportDto) {
    const company = await this.prisma.company.findFirst({
      where: { id: dto.companyId, agencyId },
      select: { id: true },
    });
    if (!company) {
      throw new BadRequestException('Empresa não encontrada nesta agência');
    }

    if (dto.integrationIds?.length) {
      const integrations = await this.prisma.integration.findMany({
        where: {
          id: { in: dto.integrationIds },
          agencyId,
          companyId: dto.companyId,
        },
        select: { id: true },
      });
      if (integrations.length !== dto.integrationIds.length) {
        throw new BadRequestException(
          'Uma ou mais integrações inválidas ou não pertencem a esta empresa',
        );
      }
    }

    const report = await this.prisma.report.create({
      data: {
        agencyId,
        companyId: dto.companyId,
        title: dto.title,
        description: dto.description,
        periodStart: dto.periodStart ? new Date(dto.periodStart) : undefined,
        periodEnd: dto.periodEnd ? new Date(dto.periodEnd) : undefined,
        integrations: dto.integrationIds?.length
          ? {
              create: dto.integrationIds.map((integrationId) => ({
                integrationId,
              })),
            }
          : undefined,
      },
      select: {
        id: true,
        title: true,
        status: true,
        companyId: true,
        agencyId: true,
        createdAt: true,
      },
    });

    await this.auditLog.record({
      agencyId,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.REPORT,
      entityId: report.id,
      entityName: report.title,
      description: `Relatório "${report.title}" criado`,
    });

    return report;
  }
}
