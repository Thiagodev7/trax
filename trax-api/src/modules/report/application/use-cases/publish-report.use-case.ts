import { Injectable, BadRequestException } from '@nestjs/common';
import { ReportStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class PublishReportUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(agencyId: string, reportId: string) {
    const report = await this.prisma.report.findFirst({
      where: { id: reportId, agencyId },
      select: { id: true, status: true },
    });

    if (!report) {
      throw new BadRequestException('Relatório não encontrado');
    }

    if (report.status === ReportStatus.ARCHIVED) {
      throw new BadRequestException('Relatórios arquivados não podem ser publicados');
    }

    // Gera share token único (URL-safe, 48 bytes = 64 chars base64url)
    const shareToken = randomBytes(48).toString('base64url');

    return this.prisma.report.update({
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
  }
}
