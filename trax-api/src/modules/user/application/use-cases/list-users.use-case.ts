import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class ListUsersUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(agencyId: string) {
    return this.prisma.user.findMany({
      where: { agencyId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        userClients: {
          select: {
            client: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
