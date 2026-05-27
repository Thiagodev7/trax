import { Injectable, Logger } from '@nestjs/common';
import {
  AuditAction,
  AuditActorType,
  AuditEntityType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { getAuditContext } from '@common/context/audit.context';

export interface AuditLogInput {
  agencyId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  description: string;
  entityId?: string;
  entityName?: string;
  metadata?: Record<string, unknown>;
  actorType?: AuditActorType;
  userId?: string;
  superAdminId?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(input: AuditLogInput): Promise<void> {
    const ctx = getAuditContext();

    try {
      await this.prisma.agencyAuditLog.create({
        data: {
          agencyId: input.agencyId,
          action: input.action,
          entityType: input.entityType,
          description: input.description,
          entityId: input.entityId,
          entityName: input.entityName,
          metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
          actorType: input.actorType ?? ctx?.actorType ?? AuditActorType.SYSTEM,
          userId: input.userId ?? ctx?.userId,
          superAdminId: input.superAdminId ?? ctx?.superAdminId,
          ipAddress: input.ipAddress ?? ctx?.ipAddress,
          userAgent: input.userAgent ?? ctx?.userAgent,
        },
      });
    } catch (error) {
      this.logger.error(`Falha ao registrar audit log: ${error}`);
    }
  }
}
