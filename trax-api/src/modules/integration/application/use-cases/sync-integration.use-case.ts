import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { decryptCredentials } from '../crypto.helper';
import { MetaAdsService } from '../services/meta-ads.service';
import { InstagramService } from '../services/instagram.service';
import { FacebookPageService } from '../services/facebook-page.service';
import { NectarCrmService } from '../services/nectar-crm.service';

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function subDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - days);
  return r;
}

interface SyncOptions {
  agencyId: string;
  integrationId: string;
  /** Override date range; defaults to last 90 days */
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class SyncIntegrationUseCase {
  private readonly logger = new Logger(SyncIntegrationUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly metaAds: MetaAdsService,
    private readonly instagram: InstagramService,
    private readonly fbPage: FacebookPageService,
    private readonly nectar: NectarCrmService,
  ) {}

  async execute(opts: SyncOptions): Promise<{ synced: number }> {
    const integration = await this.prisma.integration.findFirst({
      where: { id: opts.integrationId, agencyId: opts.agencyId },
    });
    if (!integration) throw new NotFoundException('Integração não encontrada.');

    const endDate = opts.endDate ?? toDateStr(new Date());
    const startDate = opts.startDate ?? toDateStr(subDays(new Date(), 90));

    let synced = 0;

    try {
      const creds = decryptCredentials(integration.credentialsEnc);

      switch (integration.provider) {
        case 'META_ADS':
          synced = await this.syncMetaAds(integration.id, creds as any, startDate, endDate);
          break;
        case 'INSTAGRAM':
          synced = await this.syncInstagram(integration.id, creds as any);
          break;
        case 'FACEBOOK_PAGE':
          synced = await this.syncFacebookPage(integration.id, creds as any, startDate, endDate);
          break;
        case 'NECTAR_CRM':
          synced = await this.syncNectar(integration.id, creds as any, startDate, endDate);
          break;
        default:
          this.logger.warn(`Sync not implemented for provider: ${integration.provider}`);
      }

      await this.prisma.integration.update({
        where: { id: integration.id },
        data: { status: 'ACTIVE', lastSyncAt: new Date(), lastErrorMsg: null },
      });
    } catch (err: any) {
      this.logger.error(`Sync failed for integration ${integration.id}: ${err.message}`);
      await this.prisma.integration.update({
        where: { id: integration.id },
        data: { status: 'ERROR', lastErrorMsg: err.message },
      });
      throw err;
    }

    return { synced };
  }

  private async upsertMetric(
    integrationId: string,
    date: string,
    metricType: string,
    entityId: string | null,
    entityName: string | null,
    data: Record<string, unknown>,
  ) {
    const dateObj = new Date(date);
    await this.prisma.dailyMetric.upsert({
      where: {
        integrationId_date_metricType_entityId: {
          integrationId,
          date: dateObj,
          metricType,
          entityId: entityId ?? '',
        },
      },
      create: {
        integrationId,
        date: dateObj,
        metricType,
        entityId: entityId ?? '',
        entityName,
        data: data as any,
      },
      update: { data: data as any, entityName, updatedAt: new Date() },
    });
  }

  private async syncMetaAds(
    integrationId: string,
    creds: { accessToken: string; adAccountId: string },
    startDate: string,
    endDate: string,
  ): Promise<number> {
    let count = 0;

    const daily = await this.metaAds.fetchDailyInsights(creds, startDate, endDate);
    for (const row of daily) {
      await this.upsertMetric(
        integrationId,
        row.date as string,
        'campaign',
        row.campaign_id as string,
        row.campaign_name as string,
        row,
      );
      count++;
    }

    const adsets = await this.metaAds.fetchAdsets(creds);
    for (const adset of adsets) {
      await this.upsertMetric(
        integrationId,
        endDate,
        'adset_info',
        adset.id as string,
        adset.name as string,
        adset,
      );
      count++;
    }

    const adsetMetrics = await this.metaAds.fetchAdsetMetrics(creds, startDate, endDate);
    for (const row of adsetMetrics) {
      await this.upsertMetric(
        integrationId,
        row.date as string,
        'adset',
        row.adset_id as string,
        row.adset_name as string,
        row,
      );
      count++;
    }

    const creatives = await this.metaAds.fetchCreatives(creds, startDate, endDate);
    for (const row of creatives) {
      await this.upsertMetric(
        integrationId,
        endDate,
        'creative',
        row.ad_id as string,
        row.ad_name as string,
        row,
      );
      count++;
    }

    return count;
  }

  private async syncInstagram(
    integrationId: string,
    creds: { accessToken: string; igUserId: string },
  ): Promise<number> {
    let count = 0;
    const profile = await this.instagram.fetchProfile(creds);
    await this.upsertMetric(integrationId, toDateStr(new Date()), 'organic_ig_profile', null, null, profile);
    count++;

    const insights = await this.instagram.fetchInsights(creds, 'day');
    for (const row of insights) {
      await this.upsertMetric(integrationId, row.date as string, 'organic_ig', null, null, row);
      count++;
    }

    const media = await this.instagram.fetchMedia(creds, 50);
    for (const post of media) {
      await this.upsertMetric(integrationId, post.date as string, 'organic_ig_post', post.id as string, post.caption as string, post);
      count++;
    }

    return count;
  }

  private async syncFacebookPage(
    integrationId: string,
    creds: { accessToken: string; pageId: string },
    startDate: string,
    endDate: string,
  ): Promise<number> {
    let count = 0;
    const pageInfo = await this.fbPage.fetchPageInfo(creds);
    await this.upsertMetric(integrationId, toDateStr(new Date()), 'organic_fb_profile', null, null, pageInfo);
    count++;

    const insights = await this.fbPage.fetchInsights(creds, 'day', startDate, endDate);
    for (const row of insights) {
      await this.upsertMetric(integrationId, row.date as string, 'organic_fb', null, null, row);
      count++;
    }

    const posts = await this.fbPage.fetchPosts(creds, 50);
    for (const post of posts) {
      await this.upsertMetric(integrationId, post.date as string, 'organic_fb_post', post.id as string, post.caption as string, post);
      count++;
    }

    return count;
  }

  private async syncNectar(
    integrationId: string,
    creds: { apiToken: string; baseUrl?: string },
    startDate: string,
    endDate: string,
  ): Promise<number> {
    const summary = await this.nectar.fetchLeadboard(creds);
    await this.upsertMetric(integrationId, toDateStr(new Date()), 'crm', 'summary', 'CRM Summary', summary);
    return 1;
  }
}
