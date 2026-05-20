import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthenticatedUser } from '@common/decorators/current-user.decorator';

interface ListClientsInput {
  agencyId: string;
  user: AuthenticatedUser;
  page: number;
  limit: number;
  search?: string;
}

@Injectable()
export class ListClientsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute({ agencyId, user, page, limit, search }: ListClientsInput) {
    const take = Math.min(limit, 100); // máximo 100 por página
    const skip = (page - 1) * take;

    // CLIENT_VIEWER só enxerga os clientes explicitamente vinculados a ele
    const clientIdFilter =
      user.role === UserRole.CLIENT_VIEWER
        ? {
            userClients: {
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
      this.prisma.client.findMany({
        where: { agencyId, isActive: true, ...clientIdFilter, ...searchFilter },
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
      this.prisma.client.count({
        where: { agencyId, isActive: true, ...clientIdFilter, ...searchFilter },
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
