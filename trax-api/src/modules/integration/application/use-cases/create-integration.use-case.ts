import { Injectable, ConflictException } from '@nestjs/common';
import { AuditAction, AuditEntityType } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateIntegrationDto } from '../../presentation/dto/create-integration.dto';
import { encryptCredentials } from '../crypto.helper';
import { AuditLogService } from '@modules/audit-log/application/services/audit-log.service';

@Injectable()
export class CreateIntegrationUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(agencyId: string, clientId: string, dto: CreateIntegrationDto) {
    await this.prisma.client.findFirstOrThrow({
      where: { id: clientId, agencyId },
    });

    const credentialsEnc = encryptCredentials(dto.credentials);

    try {
      const integration = await this.prisma.integration.create({
        data: {
          agencyId,
          clientId,
          provider: dto.provider,
          displayName: dto.displayName,
          credentialsEnc,
          metadata: (dto.metadata as any) ?? undefined,
          externalAccount: dto.externalAccount,
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
        action: AuditAction.CREATE,
        entityType: AuditEntityType.INTEGRATION,
        entityId: integration.id,
        entityName: integration.displayName ?? integration.provider,
        description: `Integração ${integration.provider} criada`,
        metadata: { clientId, provider: integration.provider },
      });

      return integration;
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException(
          'Já existe uma integração com este provider e conta para este cliente.',
        );
      }
      throw err;
    }
  }
}
