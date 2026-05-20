import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class GetAgencyBrandingUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(agencyId: string) {
    return this.prisma.agency.findUniqueOrThrow({
      where: { id: agencyId },
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
        isActive: true,
        createdAt: true,
      },
    });
  }
}
