import { Injectable } from '@nestjs/common';
import { AuditAction, AuditEntityType } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateClientDto } from '../../presentation/dto/create-client.dto';
import { AuditLogService } from '@modules/audit-log/application/services/audit-log.service';

@Injectable()
export class CreateClientUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(agencyId: string, dto: CreateClientDto) {
    const client = await this.prisma.client.create({
      data: {
        agencyId,
        name: dto.name,
        email: dto.email,
        website: dto.website,
        logoUrl: dto.logoUrl,
      },
      select: {
        id: true,
        agencyId: true,
        name: true,
        email: true,
        website: true,
        logoUrl: true,
        isActive: true,
        createdAt: true,
      },
    });

    await this.auditLog.record({
      agencyId,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.CLIENT,
      entityId: client.id,
      entityName: client.name,
      description: `Cliente "${client.name}" criado`,
    });

    return client;
  }
}
