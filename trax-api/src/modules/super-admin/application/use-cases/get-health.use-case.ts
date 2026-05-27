import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';

export interface PlatformHealth {
  api: { status: 'ok' | 'error'; message?: string };
  database: { status: 'ok' | 'error'; message?: string };
  email: { configured: boolean; provider: string };
  checkedAt: string;
}

@Injectable()
export class GetHealthUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async execute(): Promise<PlatformHealth> {
    let databaseStatus: 'ok' | 'error' = 'ok';
    let databaseMessage: string | undefined;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      databaseStatus = 'error';
      databaseMessage = err instanceof Error ? err.message : 'Falha na conexão';
    }

    const resendKey = this.configService.get<string>('RESEND_API_KEY');

    return {
      api: { status: 'ok' },
      database: {
        status: databaseStatus,
        ...(databaseMessage && { message: databaseMessage }),
      },
      email: {
        configured: Boolean(resendKey),
        provider: 'Resend',
      },
      checkedAt: new Date().toISOString(),
    };
  }
}
