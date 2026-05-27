import { Injectable } from '@nestjs/common';
import { AuditAction, AuditEntityType } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateClientDto } from '../../presentation/dto/update-client.dto';
import { AuditLogService } from '@modules/audit-log/application/services/audit-log.service';

@Injectable()
export class UpdateClientUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(agencyId: string, clientId: string, dto: UpdateClientDto) {
    await this.prisma.client.findFirstOrThrow({
      where: { id: clientId, agencyId },
      select: { id: true },
    });

    const client = await this.prisma.client.update({
      where: { id: clientId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...('website' in dto && { website: dto.website ?? null }),
        ...('logoUrl' in dto && { logoUrl: dto.logoUrl ?? null }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        website: true,
        logoUrl: true,
        isActive: true,
        updatedAt: true,
      },
    });

    await this.auditLog.record({
      agencyId,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.CLIENT,
      entityId: client.id,
      entityName: client.name,
      description: `Cliente "${client.name}" atualizado`,
      metadata: { fields: Object.keys(dto) },
    });

    return client;
  }
}
