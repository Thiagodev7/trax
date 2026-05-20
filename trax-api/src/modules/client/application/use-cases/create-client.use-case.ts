import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateClientDto } from '../../presentation/dto/create-client.dto';

@Injectable()
export class CreateClientUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(agencyId: string, dto: CreateClientDto) {
    return this.prisma.client.create({
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
  }
}
