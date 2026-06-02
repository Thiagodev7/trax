import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RESERVED_SLUGS } from './create-agency.use-case';

@Injectable()
export class CheckSlugUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(slug: string): Promise<{ available: boolean; message?: string }> {
    const normalized = slug.toLowerCase();

    if (RESERVED_SLUGS.includes(normalized as (typeof RESERVED_SLUGS)[number])) {
      return { available: false, message: 'Slug reservado' };
    }

    const existing = await this.prisma.agency.findUnique({
      where: { slug: normalized },
      select: { id: true },
    });

    return { available: !existing };
  }
}
