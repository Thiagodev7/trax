import { Injectable, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthenticatedUser } from '@common/decorators/current-user.decorator';

interface GetClientInput {
  agencyId: string;
  clientId: string;
  user: AuthenticatedUser;
}

@Injectable()
export class GetClientUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute({ agencyId, clientId, user }: GetClientInput) {
    // CLIENT_VIEWER: valida que tem acesso a este cliente específico
    if (user.role === UserRole.CLIENT_VIEWER) {
      const link = await this.prisma.userClient.findUnique({
        where: { userId_clientId: { userId: user.sub, clientId } },
      });
      if (!link) {
        throw new ForbiddenException('Acesso negado a este cliente');
      }
    }

    return this.prisma.client.findFirstOrThrow({
      where: { id: clientId, agencyId },
      select: {
        id: true,
        name: true,
        email: true,
        website: true,
        logoUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        integrations: {
          select: {
            id: true,
            provider: true,
            status: true,
            displayName: true,
            externalAccount: true,
            lastSyncAt: true,
          },
        },
        _count: { select: { reports: true } },
      },
    });
  }
}
