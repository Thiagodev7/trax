import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateNotificationPreferencesDto } from '../../presentation/dto/update-notification-preferences.dto';

@Injectable()
export class UpdateNotificationPreferencesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, dto: UpdateNotificationPreferencesDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        notifyReportPublished: dto.notifyReportPublished,
        notifyIntegrationErrors: dto.notifyIntegrationErrors,
        notifyNewClient: dto.notifyNewClient,
        notifyWeeklySummary: dto.notifyWeeklySummary,
      },
      select: {
        notifyReportPublished: true,
        notifyIntegrationErrors: true,
        notifyNewClient: true,
        notifyWeeklySummary: true,
      },
    });

    return {
      notifyReportPublished: updated.notifyReportPublished,
      notifyIntegrationErrors: updated.notifyIntegrationErrors,
      notifyNewClient: updated.notifyNewClient,
      notifyWeeklySummary: updated.notifyWeeklySummary,
    };
  }
}
