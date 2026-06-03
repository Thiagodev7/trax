import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import {
  RdStationService,
  buildRdPeriodKey,
  type RdOfficialFunnelResult,
  type RdsCredentials,
} from '@/modules/integration/application/services/rd-station.service';
import { RdStationOAuthService } from '@/modules/integration/application/services/rd-station-oauth.service';
import { decryptCredentials, encryptCredentials } from '@/modules/integration/application/crypto.helper';

const FUNNEL_CACHE_TTL_SEC = 1800;

@Injectable()
export class RdOfficialFunnelService {
  private readonly logger = new Logger(RdOfficialFunnelService.name);
  private readonly inflight = new Map<string, Promise<RdOfficialFunnelResult>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly rdStation: RdStationService,
    private readonly rdOAuth: RdStationOAuthService,
    private readonly redis: RedisService,
  ) {}

  async fetchForIntegration(
    integration: { id: string; credentialsEnc: string },
    startDate: string,
    endDate: string,
  ): Promise<RdOfficialFunnelResult> {
    const periodKey = buildRdPeriodKey(startDate, endDate);
    const cacheKey = `rd:funnel:${integration.id}:${periodKey}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached) as RdOfficialFunnelResult;
      } catch {
        /* ignore corrupt cache */
      }
    }

    const existing = this.inflight.get(cacheKey);
    if (existing) return existing;

    const promise = this.fetchAndCache(integration, startDate, endDate, cacheKey).finally(() => {
      this.inflight.delete(cacheKey);
    });
    this.inflight.set(cacheKey, promise);
    return promise;
  }

  private async fetchAndCache(
    integration: { id: string; credentialsEnc: string },
    startDate: string,
    endDate: string,
    cacheKey: string,
  ): Promise<RdOfficialFunnelResult> {
    let creds = decryptCredentials(integration.credentialsEnc) as {
      accessToken: string;
      refreshToken?: string;
    };

    let result = await this.rdStation.fetchAnalyticsFunnel(
      creds as RdsCredentials,
      startDate,
      endDate,
    );

    if (result.unauthorized && creds.refreshToken) {
      try {
        const refreshed = await this.rdOAuth.refreshAccessToken(creds.refreshToken);
        creds = {
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token ?? creds.refreshToken,
        };
        await this.prisma.integration.update({
          where: { id: integration.id },
          data: { credentialsEnc: encryptCredentials(creds) },
        });
        result = await this.rdStation.fetchAnalyticsFunnel(
          creds as RdsCredentials,
          startDate,
          endDate,
        );
      } catch (err: unknown) {
        this.logger.warn(`RD funnel token refresh failed: ${(err as Error).message}`);
      }
    }

    if (result.available || result.advancedRequired) {
      await this.redis.set(cacheKey, JSON.stringify(result), FUNNEL_CACHE_TTL_SEC);
    }

    return result;
  }
}
