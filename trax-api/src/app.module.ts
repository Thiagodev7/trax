import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
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
import { UserModule } from './modules/user/user.module';
import { SuperAdminModule } from './modules/super-admin/super-admin.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { SchedulingModule } from './modules/scheduling/scheduling.module';
import { MetaConfigModule } from './modules/client/meta-config/meta-config.module';
import { HealthModule } from './modules/health/health.module';
import { AuditContextInterceptor } from '@common/interceptors/audit-context.interceptor';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    // --- Config global ---
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        APP_PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        // Aceita CREDENTIALS_ENCRYPTION_KEY ou ENCRYPTION_KEY (um dos dois é obrigatório)
        CREDENTIALS_ENCRYPTION_KEY: Joi.string().optional(),
        ENCRYPTION_KEY: Joi.string().optional(),
        GEMINI_API_KEY: Joi.string().optional(),
        REDIS_URL: Joi.string().uri().optional(),
      }),
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
    RedisModule,
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
    UserModule,
    SuperAdminModule,
    AuditLogModule,
    SchedulingModule,
    MetaConfigModule,
    HealthModule,

    // --- Servir arquivos estáticos (Uploads) ---
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      serveRoot: '/public',
      serveStaticOptions: {
        index: false,
        fallthrough: false,
      },
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditContextInterceptor,
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
