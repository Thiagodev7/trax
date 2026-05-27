import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ScheduledPostPlatform, ScheduledPostStatus } from '@prisma/client';

interface CreateScheduledPostDto {
  clientId: string;
  platform: 'instagram' | 'facebook';
  caption?: string;
  mediaUrl: string;
  scheduledAt: string;
}

@Injectable()
export class SchedulingService {
  constructor(private readonly prisma: PrismaService) {}

  async list(agencyId: string, clientId: string) {
    return this.prisma.scheduledPost.findMany({
      where: { agencyId, clientId },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async create(agencyId: string, dto: CreateScheduledPostDto) {
    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, agencyId },
    });
    if (!client) throw new NotFoundException('Cliente não encontrado.');

    const scheduledAt = new Date(dto.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('Data de agendamento inválida.');
    }

    return this.prisma.scheduledPost.create({
      data: {
        agencyId,
        clientId: dto.clientId,
        platform:
          dto.platform === 'instagram'
            ? ScheduledPostPlatform.INSTAGRAM
            : ScheduledPostPlatform.FACEBOOK,
        caption: dto.caption,
        mediaUrl: dto.mediaUrl,
        scheduledAt,
        status: ScheduledPostStatus.PENDING,
      },
    });
  }

  async cancel(agencyId: string, id: string) {
    const post = await this.prisma.scheduledPost.findFirst({
      where: { id, agencyId },
    });
    if (!post) throw new NotFoundException('Post agendado não encontrado.');
    if (post.status !== ScheduledPostStatus.PENDING) {
      throw new BadRequestException('Somente posts pendentes podem ser cancelados.');
    }
    return this.prisma.scheduledPost.update({
      where: { id },
      data: { status: ScheduledPostStatus.CANCELLED },
    });
  }
}
