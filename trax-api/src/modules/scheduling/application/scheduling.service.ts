import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ScheduledPostPlatform, ScheduledPostStatus } from '@prisma/client';

interface CreateScheduledPostDto {
  companyId: string;
  platform: 'instagram' | 'facebook';
  caption?: string;
  mediaUrl: string;
  scheduledAt: string;
}

@Injectable()
export class SchedulingService {
  constructor(private readonly prisma: PrismaService) {}

  async list(agencyId: string, companyId: string) {
    return this.prisma.scheduledPost.findMany({
      where: { agencyId, companyId },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async create(agencyId: string, dto: CreateScheduledPostDto) {
    const company = await this.prisma.company.findFirst({
      where: { id: dto.companyId, agencyId },
    });
    if (!company) throw new NotFoundException('Empresa não encontrada.');

    const scheduledAt = new Date(dto.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('Data de agendamento inválida.');
    }

    return this.prisma.scheduledPost.create({
      data: {
        agencyId,
        companyId: dto.companyId,
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
