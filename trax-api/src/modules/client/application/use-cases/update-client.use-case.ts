import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateClientDto } from '../../presentation/dto/update-client.dto';

@Injectable()
export class UpdateClientUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(agencyId: string, clientId: string, dto: UpdateClientDto) {
    // findFirstOrThrow garante que o cliente pertence a esta agência (multi-tenant safe)
    await this.prisma.client.findFirstOrThrow({
      where: { id: clientId, agencyId },
      select: { id: true },
    });

    return this.prisma.client.update({
      where: { id: clientId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.website !== undefined && { website: dto.website }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
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
  }
}
