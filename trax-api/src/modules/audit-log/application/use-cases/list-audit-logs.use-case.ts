import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ListAuditLogsQueryDto } from '@modules/super-admin/presentation/dto/list-audit-logs-query.dto';

@Injectable()
export class ListAuditLogsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(params: ListAuditLogsQueryDto & { agencyIdFilter?: string }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, params.limit ?? 30);
    const skip = (page - 1) * limit;

    const agencyId = params.agencyIdFilter ?? params.agencyId;

    const where: Record<string, unknown> = {};

    if (agencyId) {
      where.agencyId = agencyId;
    }

    if (params.action) {
      where.action = params.action;
    }

    if (params.entityType) {
      where.entityType = params.entityType;
    }

    if (params.search) {
      where.OR = [
        { description: { contains: params.search, mode: 'insensitive' } },
        { entityName: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.from || params.to) {
      where.createdAt = {
        ...(params.from ? { gte: new Date(params.from) } : {}),
        ...(params.to ? { lte: new Date(params.to) } : {}),
      };
    }

    const [logs, total] = await Promise.all([
      this.prisma.agencyAuditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          agencyId: true,
          actorType: true,
          userId: true,
          superAdminId: true,
          action: true,
          entityType: true,
          entityId: true,
          entityName: true,
          description: true,
          metadata: true,
          ipAddress: true,
          createdAt: true,
          agency: { select: { id: true, name: true, slug: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.agencyAuditLog.count({ where }),
    ]);

    return { data: logs, total, page, limit };
  }
}
