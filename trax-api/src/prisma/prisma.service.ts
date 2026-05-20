import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
      ],
      errorFormat: 'colorless',
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('✅ Conectado ao PostgreSQL via Prisma');

    // Log de queries lentas apenas em desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
      // @ts-expect-error: Prisma event typing
      this.$on('query', (event: { query: string; duration: number }) => {
        if (event.duration > 200) {
          this.logger.warn(
            `🐢 Query lenta (${event.duration}ms): ${event.query}`,
          );
        }
      });
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('🔌 Desconectado do PostgreSQL');
  }

  /**
   * Utilitário para transações tipadas.
   * Uso: await this.prisma.transaction(async (tx) => { ... })
   */
  async transaction<T>(
    fn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(fn);
  }
}
