import { Injectable } from '@nestjs/common';
import { AgencyPlan } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

export interface AgencyListItem {
  id: string;
  name: string;
  slug: string;
  plan: string;
  isActive: boolean;
  maxClients: number;
  maxUsers: number;
  trialEndsAt: Date | null;
  createdAt: Date;
  _count: {
    clients: number;
    users: number;
    reports: number;
  };
}

@Injectable()
export class ListAgenciesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(params: {
    page?: number;
    limit?: number;
    search?: string;
    plan?: AgencyPlan;
    isActive?: boolean;
    sortBy?: 'createdAt' | 'name';
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ data: AgencyListItem[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, params.limit ?? 20);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { slug: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.plan) {
      where.plan = params.plan;
    }

    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    const sortBy = params.sortBy ?? 'createdAt';
    const sortOrder = params.sortOrder ?? 'desc';

    const [agencies, total] = await Promise.all([
      this.prisma.agency.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
          isActive: true,
          maxClients: true,
          maxUsers: true,
          trialEndsAt: true,
          createdAt: true,
          _count: {
            select: { clients: true, users: true, reports: true },
          },
        },
      }),
      this.prisma.agency.count({ where }),
    ]);

    return { data: agencies as AgencyListItem[], total, page, limit };
  }
}
