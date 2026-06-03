import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/prisma/prisma.service';
import { decryptCredentials, encryptCredentials } from '../crypto.helper';
import { RdStationService } from './rd-station.service';
import { RdStationOAuthService } from './rd-station-oauth.service';

/**
 * Renova tokens RD Station diariamente antes da sync (3h05).
 * O access_token expira em 24h; o refresh_token não expira.
 */
@Injectable()
export class RdTokenRefreshService {
  private readonly logger = new Logger(RdTokenRefreshService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rdStation: RdStationService,
    private readonly rdOAuth: RdStationOAuthService,
  ) {}

  @Cron('5 3 * * *') // 3h05 AM — antes da sync das 3h10
  async handleTokenRefresh() {
    this.logger.log('Iniciando refresh de tokens RD Station...');

    const integrations = await this.prisma.integration.findMany({
      where: { provider: 'RD_STATION', status: { in: ['ACTIVE', 'ERROR'] } },
    });

    this.logger.log(`Encontradas ${integrations.length} integrações RD Station.`);

    let renewed = 0;
    let failed = 0;

    for (const integration of integrations) {
      try {
        const creds = decryptCredentials(integration.credentialsEnc) as {
          accessToken: string;
          refreshToken: string;
        };

        // Testa o token atual
        const test = await this.rdStation.testConnection(creds);
        if (test.valid) continue; // Token ainda válido

        // Token inválido — renova
        this.logger.log(`Renovando token para integração ${integration.id}...`);
        const refreshed = await this.rdOAuth.refreshAccessToken(creds.refreshToken);

        const newCreds = {
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token ?? creds.refreshToken,
        };

        await this.prisma.integration.update({
          where: { id: integration.id },
          data: {
            credentialsEnc: encryptCredentials(newCreds),
            status: 'ACTIVE',
            lastErrorMsg: null,
          },
        });

        renewed++;
        this.logger.log(`Token renovado para integração ${integration.id}.`);
      } catch (err: any) {
        failed++;
        this.logger.error(`Falha ao renovar token para integração ${integration.id}: ${err.message}`);
        await this.prisma.integration.update({
          where: { id: integration.id },
          data: {
            status: 'ERROR',
            lastErrorMsg: `Token expirado e renovação falhou: ${err.message}`,
          },
        });
      }
    }

    this.logger.log(`Refresh de tokens RD Station concluído — renovados: ${renewed}, falhas: ${failed}.`);
  }
}
