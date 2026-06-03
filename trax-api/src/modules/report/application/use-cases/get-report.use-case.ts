import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  GoneException,
} from '@nestjs/common';
import { UserRole, ReportStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthenticatedUser } from '@common/decorators/current-user.decorator';

interface GetReportInput {
  agencyId: string;
  reportId: string;
  user: AuthenticatedUser;
}

const REPORT_SELECT = {
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
  shareExpiresAt: true,
  company: {
    select: {
      id: true,
      name: true,
      logoUrl: true,
      website: true,
    },
  },
  integrations: {
    select: {
      integration: {
        select: {
          id: true,
          provider: true,
          displayName: true,
          externalAccount: true,
          status: true,
        },
      },
    },
  },
};

@Injectable()
export class GetReportUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute({ agencyId, reportId, user }: GetReportInput) {
    const report = await this.prisma.report.findFirst({
      where: { id: reportId, agencyId },
      select: REPORT_SELECT,
    });

    if (!report) throw new NotFoundException('Relatório não encontrado');

    // COMPANY_VIEWER: apenas relatórios publicados das suas empresas
    if (user.role === UserRole.COMPANY_VIEWER) {
      if (report.status !== ReportStatus.PUBLISHED) {
        throw new ForbiddenException('Relatório não disponível');
      }
      const link = await this.prisma.userCompany.findUnique({
        where: {
          userId_companyId: { userId: user.sub, companyId: report.company.id },
        },
      });
      if (!link) throw new ForbiddenException('Acesso negado a este relatório');
    }

    return report;
  }

  /** Acesso público via share token — sem autenticação */
  async executeByShareToken(token: string) {
    const report = await this.prisma.report.findUnique({
      where: { shareToken: token },
      select: { ...REPORT_SELECT, shareExpiresAt: true, status: true, agencyId: true },
    });

    if (!report || report.status !== ReportStatus.PUBLISHED) {
      throw new NotFoundException('Relatório não encontrado ou não publicado');
    }

    if (report.shareExpiresAt && report.shareExpiresAt < new Date()) {
      throw new GoneException('O link deste relatório expirou');
    }

    return report;
  }
}
