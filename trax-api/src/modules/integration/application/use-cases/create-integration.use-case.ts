import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateIntegrationDto } from '../../presentation/dto/create-integration.dto';
import { encryptCredentials } from '../crypto.helper';

@Injectable()
export class CreateIntegrationUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(agencyId: string, clientId: string, dto: CreateIntegrationDto) {
    // Verify client belongs to agency
    await this.prisma.client.findFirstOrThrow({
      where: { id: clientId, agencyId },
    });

    const credentialsEnc = encryptCredentials(dto.credentials);

    try {
      return await this.prisma.integration.create({
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
