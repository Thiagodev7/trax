import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateAgencyBrandingDto } from '../../presentation/dto/update-agency-branding.dto';
import { invalidateTenantCache } from '@common/middleware/tenant.middleware';

@Injectable()
export class UpdateAgencyBrandingUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(agencyId: string, dto: UpdateAgencyBrandingDto) {
    const updated = await this.prisma.agency.update({
      where: { id: agencyId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
        ...(dto.faviconUrl !== undefined && { faviconUrl: dto.faviconUrl }),
        ...(dto.primaryColor && { primaryColor: dto.primaryColor }),
        ...(dto.secondaryColor && { secondaryColor: dto.secondaryColor }),
        ...(dto.accentColor && { accentColor: dto.accentColor }),
        ...(dto.fontFamily && { fontFamily: dto.fontFamily }),
        ...(dto.customDomain !== undefined && { customDomain: dto.customDomain }),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        customDomain: true,
        logoUrl: true,
        faviconUrl: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        fontFamily: true,
      },
    });

    // Invalida cache de tenant para o domínio antigo e o novo
    if (dto.customDomain) {
      invalidateTenantCache(dto.customDomain);
    }

    return updated;
  }
}
