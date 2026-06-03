import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/prisma/prisma.service';
import { ScheduledPostPlatform, ScheduledPostStatus } from '@prisma/client';
import { decryptCredentials } from '@/modules/integration/application/crypto.helper';

const GRAPH_URL = 'https://graph.facebook.com/v21.0';

@Injectable()
export class PublishScheduledPostsScheduler {
  private readonly logger = new Logger(PublishScheduledPostsScheduler.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handlePendingPosts() {
    const due = await this.prisma.scheduledPost.findMany({
      where: {
        status: ScheduledPostStatus.PENDING,
        scheduledAt: { lte: new Date() },
      },
      take: 10,
    });

    for (const post of due) {
      try {
        const externalId = await this.publish(post);
        await this.prisma.scheduledPost.update({
          where: { id: post.id },
          data: { status: ScheduledPostStatus.PUBLISHED, externalId, errorMsg: null },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        this.logger.warn(`Falha ao publicar post ${post.id}: ${message}`);
        await this.prisma.scheduledPost.update({
          where: { id: post.id },
          data: { status: ScheduledPostStatus.FAILED, errorMsg: message },
        });
      }
    }
  }

  private async publish(post: {
    platform: ScheduledPostPlatform;
    companyId: string;
    caption: string | null;
    mediaUrl: string;
  }): Promise<string> {
    const integration = await this.prisma.integration.findFirst({
      where: {
        companyId: post.companyId,
        status: 'ACTIVE',
        provider: post.platform === ScheduledPostPlatform.INSTAGRAM ? 'INSTAGRAM' : 'FACEBOOK_PAGE',
      },
    });

    if (!integration?.credentialsEnc) {
      throw new Error('Integração orgânica não configurada para esta empresa.');
    }

    const creds = decryptCredentials(integration.credentialsEnc);
    const accessToken = creds.accessToken;
    if (!accessToken) throw new Error('Access token ausente na integração.');

    if (post.platform === ScheduledPostPlatform.INSTAGRAM) {
      const igUserId = creds.igUserId;
      if (!igUserId) throw new Error('igUserId ausente.');
      const container = await this.graphPost(`${igUserId}/media`, {
        image_url: post.mediaUrl,
        caption: post.caption ?? '',
        access_token: accessToken,
      });
      const creationId = (container as { id: string }).id;
      const published = await this.graphPost(`${igUserId}/media_publish`, {
        creation_id: creationId,
        access_token: accessToken,
      });
      return (published as { id: string }).id;
    }

    const pageId = creds.pageId;
    if (!pageId) throw new Error('pageId ausente.');
    const result = await this.graphPost(`${pageId}/photos`, {
      url: post.mediaUrl,
      caption: post.caption ?? '',
      published: 'true',
      access_token: accessToken,
    });
    return (result as { id: string }).id;
  }

  private async graphPost(path: string, params: Record<string, string>) {
    const url = new URL(`${GRAPH_URL}/${path}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString(), { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any)?.error?.message ?? res.statusText);
    }
    return res.json();
  }
}
