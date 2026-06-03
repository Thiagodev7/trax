import { Injectable } from '@nestjs/common';
import { UserRole, ReportStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthenticatedUser } from '@common/decorators/current-user.decorator';

interface ListReportsInput {
  agencyId: string;
  user: AuthenticatedUser;
  companyId?: string;
  page: number;
  limit: number;
}

@Injectable()
export class ListReportsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute({ agencyId, user, companyId, page, limit }: ListReportsInput) {
    const take = Math.min(limit, 50);
    const skip = (page - 1) * take;

    // COMPANY_VIEWER: apenas relatórios publicados das suas empresas
    const companyFilter =
      user.role === UserRole.COMPANY_VIEWER
        ? {
            company: { userCompanies: { some: { userId: user.sub } } },
            status: ReportStatus.PUBLISHED,
          }
        : {};

    const where = {
      agencyId,
      ...(companyId ? { companyId } : {}),
      ...companyFilter,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.report.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          periodStart: true,
          periodEnd: true,
          publishedAt: true,
          createdAt: true,
          shareToken: true,
          company: { select: { id: true, name: true, logoUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      data: items,
      meta: { total, page, limit: take, totalPages: Math.ceil(total / take) },
    };
  }
}
