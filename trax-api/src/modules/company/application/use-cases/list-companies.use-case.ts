import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthenticatedUser } from '@common/decorators/current-user.decorator';

interface ListCompaniesInput {
  agencyId: string;
  user: AuthenticatedUser;
  page: number;
  limit: number;
  search?: string;
}

@Injectable()
export class ListCompaniesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute({ agencyId, user, page, limit, search }: ListCompaniesInput) {
    const take = Math.min(limit, 100); // máximo 100 por página
    const skip = (page - 1) * take;

    // COMPANY_VIEWER só enxerga as empresas explicitamente vinculadas a ele
    const companyIdFilter =
      user.role === UserRole.COMPANY_VIEWER
        ? {
            userCompanies: {
              some: { userId: user.sub },
            },
          }
        : {};

    const searchFilter = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.company.findMany({
        where: { agencyId, isActive: true, ...companyIdFilter, ...searchFilter },
        select: {
          id: true,
          name: true,
          email: true,
          website: true,
          logoUrl: true,
          isActive: true,
          createdAt: true,
          _count: { select: { reports: true, integrations: true } },
        },
        orderBy: { name: 'asc' },
        take,
        skip,
      }),
      this.prisma.company.count({
        where: { agencyId, isActive: true, ...companyIdFilter, ...searchFilter },
      }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }
}
