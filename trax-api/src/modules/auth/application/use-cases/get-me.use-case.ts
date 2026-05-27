import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class GetMeUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        agencyId: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        lastLoginAt: true,
        notifyReportPublished: true,
        notifyIntegrationErrors: true,
        notifyNewClient: true,
        notifyWeeklySummary: true,
        createdAt: true,
        agency: {
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
            logoUrl: true,
            primaryColor: true,
            secondaryColor: true,
            accentColor: true,
          },
        },
        // Para CLIENT_VIEWER: quais clientes ele pode ver
        userClients: {
          select: {
            client: {
              select: { id: true, name: true, logoUrl: true },
            },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    return {
      id: user.id,
      agencyId: user.agencyId,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      notifications: {
        notifyReportPublished: user.notifyReportPublished,
        notifyIntegrationErrors: user.notifyIntegrationErrors,
        notifyNewClient: user.notifyNewClient,
        notifyWeeklySummary: user.notifyWeeklySummary,
      },
      agency: user.agency,
      clients: user.userClients.map((uc) => uc.client),
    };
  }
}
