import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  Version,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '@common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '@common/decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../application/use-cases/logout.use-case';
import { GetMeUseCase } from '../application/use-cases/get-me.use-case';
import { UpdatePasswordUseCase } from '../application/use-cases/update-password.use-case';
import { UpdateNotificationPreferencesUseCase } from '../application/use-cases/update-notification-preferences.use-case';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { VerifyTotpDto, MfaLoginDto } from './dto/totp.dto';
import {
  SetupTotpUseCase,
  EnableTotpUseCase,
  DisableTotpUseCase,
  VerifyTotpLoginUseCase,
} from '../application/use-cases/totp.use-case';

const REFRESH_COOKIE_NAME = 'trax_refresh';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
  path: '/api/v1/auth',
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly getMeUseCase: GetMeUseCase,
    private readonly updatePasswordUseCase: UpdatePasswordUseCase,
    private readonly updateNotificationPreferencesUseCase: UpdateNotificationPreferencesUseCase,
    private readonly setupTotpUseCase: SetupTotpUseCase,
    private readonly enableTotpUseCase: EnableTotpUseCase,
    private readonly disableTotpUseCase: DisableTotpUseCase,
    private readonly verifyTotpLoginUseCase: VerifyTotpLoginUseCase,
  ) {}

  @Public()
  @Post('login')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Login com email e senha' })
  @ApiResponse({ status: 200, description: 'Tokens JWT retornados' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.loginUseCase.execute(dto, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // 2FA — retorna challenge token sem criar sessão
    if ('requiresMfa' in result) {
      return result;
    }

    // Seta refresh token em cookie httpOnly seguro
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, COOKIE_OPTIONS);
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
    };
  }

  @Public()
  @Post('refresh')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @ApiOperation({ summary: 'Renova access token usando refresh token do cookie ou body' })
  async refresh(
    @Req() req: Request,
    @Body() body: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Prefere o cookie httpOnly; fallback para body (compatibilidade mobile)
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME] ?? body.refreshToken;
    const result = await this.refreshTokenUseCase.execute(rawToken);
    return result;
  }

  @Post('logout')
  @Version('1')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout — revoga refresh token' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: RefreshTokenDto,
  ) {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME] ?? body.refreshToken;
    if (rawToken) await this.logoutUseCase.execute(rawToken);
    res.clearCookie(REFRESH_COOKIE_NAME, { path: COOKIE_OPTIONS.path });
  }

  @Get('me')
  @Version('1')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna dados do usuário autenticado' })
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.getMeUseCase.execute(user.sub);
  }

  @Patch('me/password')
  @Version('1')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Altera a senha do usuário autenticado' })
  async updatePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePasswordDto,
  ) {
    return this.updatePasswordUseCase.execute(user.sub, dto);
  }

  @Patch('me/notifications')
  @Version('1')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualiza preferências de notificação por e-mail' })
  async updateNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.updateNotificationPreferencesUseCase.execute(user.sub, dto);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 2FA / TOTP
  // ────────────────────────────────────────────────────────────────────────────

  @Public()
  @Post('totp/verify-login')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Verifica código TOTP após login com email/senha (segundo fator)' })
  async verifyTotpLogin(
    @Body() dto: MfaLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.verifyTotpLoginUseCase.execute(dto.mfaChallengeToken, dto.code);
    res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, COOKIE_OPTIONS);
    return tokens;
  }

  @Post('totp/setup')
  @Version('1')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Inicia configuração do 2FA — retorna URI otpauth para QR code' })
  async setupTotp(@CurrentUser() user: AuthenticatedUser) {
    return this.setupTotpUseCase.execute(user.sub);
  }

  @Post('totp/enable')
  @Version('1')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirma e ativa o 2FA com o primeiro código válido' })
  async enableTotp(@CurrentUser() user: AuthenticatedUser, @Body() dto: VerifyTotpDto) {
    return this.enableTotpUseCase.execute(user.sub, dto.code);
  }

  @Post('totp/disable')
  @Version('1')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desativa o 2FA (requer código TOTP atual para confirmar)' })
  async disableTotp(@CurrentUser() user: AuthenticatedUser, @Body() dto: VerifyTotpDto) {
    return this.disableTotpUseCase.execute(user.sub, dto.code);
  }
}
