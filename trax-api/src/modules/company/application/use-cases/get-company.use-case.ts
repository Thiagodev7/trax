import { Injectable, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthenticatedUser } from '@common/decorators/current-user.decorator';

interface GetCompanyInput {
  agencyId: string;
  companyId: string;
  user: AuthenticatedUser;
}

@Injectable()
export class GetCompanyUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute({ agencyId, companyId, user }: GetCompanyInput) {
    // COMPANY_VIEWER: valida que tem acesso a esta empresa específica
    if (user.role === UserRole.COMPANY_VIEWER) {
      const link = await this.prisma.userCompany.findUnique({
        where: { userId_companyId: { userId: user.sub, companyId } },
      });
      if (!link) {
        throw new ForbiddenException('Acesso negado a esta empresa');
      }
    }

    return this.prisma.company.findFirstOrThrow({
      where: { id: companyId, agencyId },
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
