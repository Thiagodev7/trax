import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { AuthModule } from './modules/auth/auth.module';
import { AgencyModule } from './modules/agency/agency.module';
import { ClientModule } from './modules/client/client.module';
import { ReportModule } from './modules/report/report.module';
import { IntegrationModule } from './modules/integration/integration.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { TenantMiddleware } from '@common/middleware/tenant.middleware';
import { UploadModule } from './modules/upload/upload.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { EmailModule } from './modules/email/email.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    // --- Config global ---
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // --- Rate Limiting global ---
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000, // 1 minuto
        limit: 100,
      },
    ]),

    // --- Infraestrutura ---
    PrismaModule,
    ScheduleModule.forRoot(),

    // --- Domínio ---
    TenantModule,
    AuthModule,
    AgencyModule,
    ClientModule,
    ReportModule,
    IntegrationModule,
    MetricsModule,
    UploadModule,
    OnboardingModule,
    EmailModule,

    // --- Servir arquivos estáticos (Uploads) ---
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      serveRoot: '/public',
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // TenantMiddleware roda em TODAS as rotas da API
    consumer
      .apply(TenantMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
