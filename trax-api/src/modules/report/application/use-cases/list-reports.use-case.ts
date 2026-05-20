import { Injectable } from '@nestjs/common';
import { UserRole, ReportStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthenticatedUser } from '@common/decorators/current-user.decorator';

interface ListReportsInput {
  agencyId: string;
  user: AuthenticatedUser;
  clientId?: string;
  page: number;
  limit: number;
}

@Injectable()
export class ListReportsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute({ agencyId, user, clientId, page, limit }: ListReportsInput) {
    const take = Math.min(limit, 50);
    const skip = (page - 1) * take;

    // CLIENT_VIEWER: apenas relatórios publicados dos seus clientes
    const clientFilter =
      user.role === UserRole.CLIENT_VIEWER
        ? {
            client: { userClients: { some: { userId: user.sub } } },
            status: ReportStatus.PUBLISHED,
          }
        : {};

    const where = {
      agencyId,
      ...(clientId ? { clientId } : {}),
      ...clientFilter,
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
          client: { select: { id: true, name: true, logoUrl: true } },
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
