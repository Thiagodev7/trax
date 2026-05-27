import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './presentation/auth.controller';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { GetMeUseCase } from './application/use-cases/get-me.use-case';
import { UpdatePasswordUseCase } from './application/use-cases/update-password.use-case';
import { UpdateNotificationPreferencesUseCase } from './application/use-cases/update-notification-preferences.use-case';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { TenantAuthGuard } from '@common/guards/tenant-auth.guard';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    GetMeUseCase,
    UpdatePasswordUseCase,
    UpdateNotificationPreferencesUseCase,
    JwtStrategy,
    // TenantAuthGuard aplicado globalmente a partir do AuthModule
    {
      provide: APP_GUARD,
      useClass: TenantAuthGuard,
    },
  ],
  exports: [JwtModule],
})
export class AuthModule {}
