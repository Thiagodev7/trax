import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from '@common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = process.env.PORT || configService.get<number>('APP_PORT', 3000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // --- Security ---
  app.use(helmet());
  const allowedOrigins = configService
    .get<string>('CORS_ORIGINS', '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const tenantOriginPattern =
    /^https:\/\/([a-z0-9-]+\.)*traxsolucoes\.com(\.br)?$/;

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || tenantOriginPattern.test(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // --- Performance ---
  app.use(compression());

  // --- Cookie Parser (para refresh token httpOnly) ---
  app.use(cookieParser());

  // --- Versioning ---
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // --- Global Prefix ---
  app.setGlobalPrefix('api');

  // --- Validation ---
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // --- Global Exception Filter ---
  app.useGlobalFilters(new GlobalExceptionFilter());

  // --- Swagger (dev only) ---
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Trax API')
      .setDescription('White-Label Marketing Reports SaaS — Multi-Tenant API')
      .setVersion('1.0')
      .addBearerAuth()
      .addServer(`http://localhost:${port}`, 'Local Development')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });

    console.log(`📚 Swagger: http://localhost:${port}/api/docs`);
  }

  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Trax API rodando em http://localhost:${port}/api`);
  console.log(`   Ambiente: ${nodeEnv}`);
}

bootstrap();
