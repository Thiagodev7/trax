import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '@/prisma/prisma.service';
import { decryptCredentials, encryptCredentials } from '../crypto.helper';
import { MetaOAuthService } from './meta-oauth.service';

const META_PROVIDERS = ['META_ADS', 'INSTAGRAM', 'FACEBOOK_PAGE'] as const;

/**
 * Renova tokens Meta long-lived semanalmente (válidos ~60 dias).
 * Executa domingo 2h — antes do sync diário das 3h.
 */
@Injectable()
export class MetaTokenRefreshService {
  private readonly logger = new Logger(MetaTokenRefreshService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly metaOAuth: MetaOAuthService,
  ) {}

  @Cron('0 2 * * 0')
  async handleTokenRefresh() {
    this.logger.log('Iniciando refresh de tokens Meta (Ads / Instagram / Page)...');

    const integrations = await this.prisma.integration.findMany({
      where: {
        provider: { in: [...META_PROVIDERS] },
        status: { in: ['ACTIVE', 'ERROR'] },
      },
    });

    let renewed = 0;
    let skipped = 0;
    let failed = 0;

    for (const integration of integrations) {
      try {
        const creds = decryptCredentials(integration.credentialsEnc) as {
          accessToken: string;
          adAccountId?: string;
          igUserId?: string;
          pageId?: string;
        };

        if (!creds.accessToken) {
          skipped++;
          continue;
        }

        const test = await this.metaOAuth.testConnection(creds.accessToken);
        if (test.valid) {
          skipped++;
          continue;
        }

        this.logger.log(`Renovando token Meta para integração ${integration.id} (${integration.provider})...`);
        const newToken = await this.metaOAuth.exchangeLongLivedToken(creds.accessToken);

        await this.prisma.integration.update({
          where: { id: integration.id },
          data: {
            credentialsEnc: encryptCredentials({ ...creds, accessToken: newToken }),
            status: 'ACTIVE',
            lastErrorMsg: null,
          },
        });

        renewed++;
      } catch (err: unknown) {
        failed++;
        const message = (err as Error).message;
        this.logger.error(`Falha refresh Meta ${integration.id}: ${message}`);
        await this.prisma.integration.update({
          where: { id: integration.id },
          data: {
            status: 'ERROR',
            lastErrorMsg: `Token Meta expirado — reconecte via OAuth: ${message.slice(0, 200)}`,
          },
        });
      }
    }

    this.logger.log(
      `Refresh Meta concluído — renovados: ${renewed}, válidos: ${skipped}, falhas: ${failed}.`,
    );
  }
}
