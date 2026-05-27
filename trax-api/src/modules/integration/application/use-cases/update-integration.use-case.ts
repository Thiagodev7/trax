import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, AuditEntityType } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateIntegrationDto } from '../../presentation/dto/update-integration.dto';
import { encryptCredentials } from '../crypto.helper';
import { AuditLogService } from '@modules/audit-log/application/services/audit-log.service';

@Injectable()
export class UpdateIntegrationUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(agencyId: string, integrationId: string, dto: UpdateIntegrationDto) {
    const existing = await this.prisma.integration.findFirst({
      where: { id: integrationId, agencyId },
    });
    if (!existing) throw new NotFoundException('Integração não encontrada.');

    const credentialsEnc = dto.credentials
      ? encryptCredentials(dto.credentials)
      : undefined;

    const integration = await this.prisma.integration.update({
      where: { id: integrationId },
      data: {
        ...(dto.displayName !== undefined && { displayName: dto.displayName }),
        ...(credentialsEnc && { credentialsEnc }),
        ...(dto.metadata !== undefined && { metadata: dto.metadata as any }),
        ...(dto.externalAccount !== undefined && { externalAccount: dto.externalAccount }),
        status: 'PENDING_AUTH',
      },
      select: {
        id: true,
        provider: true,
        displayName: true,
        status: true,
        metadata: true,
        externalAccount: true,
        lastSyncAt: true,
        lastErrorMsg: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await this.auditLog.record({
      agencyId,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.INTEGRATION,
      entityId: integration.id,
      entityName: integration.displayName ?? integration.provider,
      description: `Integração ${integration.provider} atualizada`,
    });

    return integration;
  }
}
