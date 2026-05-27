import { GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { ReportStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { tenantStorage } from '@common/context/tenant.context';

@Injectable()
export class SharedReportAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async withSharedReport<T>(
    token: string,
    handler: (ctx: { reportId: string; agencyId: string }) => Promise<T>,
  ): Promise<T> {
    const report = await this.prisma.report.findUnique({
      where: { shareToken: token },
      select: {
        id: true,
        agencyId: true,
        status: true,
        shareExpiresAt: true,
        agency: { select: { slug: true } },
      },
    });

    if (!report || report.status !== ReportStatus.PUBLISHED) {
      throw new NotFoundException('Relatório não encontrado ou não publicado');
    }

    if (report.shareExpiresAt && report.shareExpiresAt < new Date()) {
      throw new GoneException('O link deste relatório expirou');
    }

    return tenantStorage.run(
      { agencyId: report.agencyId, agencySlug: report.agency.slug },
      () => handler({ reportId: report.id, agencyId: report.agencyId }),
    );
  }
}
