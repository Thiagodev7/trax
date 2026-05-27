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
    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, agencyId },
      select: { id: true },
    });
    if (!client) {
      throw new BadRequestException('Cliente não encontrado nesta agência');
    }

    if (dto.integrationIds?.length) {
      const integrations = await this.prisma.integration.findMany({
        where: {
          id: { in: dto.integrationIds },
          agencyId,
          clientId: dto.clientId,
        },
        select: { id: true },
      });
      if (integrations.length !== dto.integrationIds.length) {
        throw new BadRequestException(
          'Uma ou mais integrações inválidas ou não pertencem a este cliente',
        );
      }
    }

    const report = await this.prisma.report.create({
      data: {
        agencyId,
        clientId: dto.clientId,
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
        clientId: true,
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
