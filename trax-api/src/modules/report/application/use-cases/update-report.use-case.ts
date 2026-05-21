import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateReportDto } from '../../presentation/dto/update-report.dto';

@Injectable()
export class UpdateReportUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(agencyId: string, reportId: string, dto: UpdateReportDto) {
    const existing = await this.prisma.report.findFirst({
      where: { id: reportId, agencyId },
    });
    if (!existing) throw new NotFoundException('Relatório não encontrado.');

    return this.prisma.$transaction(async (tx) => {
      // Update integrations if provided
      if (dto.integrationIds !== undefined) {
        await tx.reportIntegration.deleteMany({ where: { reportId } });
        if (dto.integrationIds.length > 0) {
          await tx.reportIntegration.createMany({
            data: dto.integrationIds.map((integrationId) => ({ reportId, integrationId })),
            skipDuplicates: true,
          });
        }
      }

      return tx.report.update({
        where: { id: reportId },
        data: {
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.periodStart !== undefined && { periodStart: dto.periodStart ? new Date(dto.periodStart) : null }),
          ...(dto.periodEnd !== undefined && { periodEnd: dto.periodEnd ? new Date(dto.periodEnd) : null }),
          ...(dto.moduleConfig !== undefined && { moduleConfig: dto.moduleConfig as any }),
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          periodStart: true,
          periodEnd: true,
          layoutJson: true,
          moduleConfig: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          shareToken: true,
          client: { select: { id: true, name: true, logoUrl: true } },
          integrations: {
            select: {
              integration: {
                select: { id: true, provider: true, displayName: true, status: true },
              },
            },
          },
        },
      });
    });
  }
}
