import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/prisma/prisma.service';
import { SyncIntegrationUseCase } from '../use-cases/sync-integration.use-case';

@Injectable()
export class SyncScheduler {
  private readonly logger = new Logger(SyncScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly syncIntegration: SyncIntegrationUseCase,
  ) {}

  // Executa todo dia às 3:00 AM (horário do servidor)
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleDailySync() {
    this.logger.log('Iniciando sincronização diária de todas as integrações...');

    const activeIntegrations = await this.prisma.integration.findMany({
      where: {
        status: 'ACTIVE',
      },
    });

    this.logger.log(`Encontradas ${activeIntegrations.length} integrações ativas para sincronizar.`);

    for (const integration of activeIntegrations) {
      try {
        await this.syncIntegration.execute({
          agencyId: integration.agencyId,
          integrationId: integration.id,
        });
        this.logger.log(`Integração ${integration.id} sincronizada com sucesso.`);
      } catch (error: any) {
        this.logger.error(`Falha ao sincronizar integração ${integration.id}: ${error.message}`);
      }
    }

    this.logger.log('Sincronização diária concluída.');
  }
}
