import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as speakeasy from 'speakeasy';
import { PrismaService } from '@/prisma/prisma.service';
import { AuditLogService } from '@modules/audit-log/application/services/audit-log.service';
import { AuditAction, AuditEntityType } from '@prisma/client';
import { TokenPair } from './login.use-case';

export interface TotpSetupResult {
  secret: string;
  otpauthUri: string;
}

// Tempo de vida do token de desafio MFA (5 minutos)
const MFA_CHALLENGE_TTL_SECONDS = 5 * 60;

@Injectable()
export class SetupTotpUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async execute(userId: string): Promise<TotpSetupResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, agency: { select: { name: true } } },
    });

    if (!user) throw new BadRequestException('Usuário não encontrado');

    const secretObj = speakeasy.generateSecret({
      length: 20,
      name: user.email,
      issuer: user.agency?.name ?? 'Trax',
    });

    // Salva o secret pendente (ainda não habilitado)
    await this.prisma.user.update({
      where: { id: userId },
      data: { totpSecret: secretObj.base32 },
    });

    return {
      secret: secretObj.base32,
      otpauthUri: secretObj.otpauth_url ?? '',
    };
  }
}

@Injectable()
export class EnableTotpUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(userId: string, code: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { totpSecret: true, agencyId: true, email: true, name: true },
    });

    if (!user?.totpSecret) {
      throw new BadRequestException('Inicie a configuração do 2FA antes de ativar');
    }

    const isValid = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!isValid) {
      throw new BadRequestException('Código 2FA inválido');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: true, totpEnabledAt: new Date() },
    });

    await this.auditLog.record({
      agencyId: user.agencyId,
      userId,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.USER,
      entityId: userId,
      entityName: user.name,
      description: `Usuário "${user.email}" ativou autenticação de dois fatores`,
    });
  }
}

@Injectable()
export class DisableTotpUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(userId: string, code: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { totpSecret: true, totpEnabled: true, agencyId: true, email: true, name: true },
    });

    if (!user?.totpEnabled || !user.totpSecret) {
      throw new BadRequestException('2FA não está ativo nesta conta');
    }

    const isValid = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!isValid) {
      throw new BadRequestException('Código 2FA inválido');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: false, totpSecret: null, totpEnabledAt: null },
    });

    await this.auditLog.record({
      agencyId: user.agencyId,
      userId,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.USER,
      entityId: userId,
      entityName: user.name,
      description: `Usuário "${user.email}" desativou autenticação de dois fatores`,
    });
  }
}

@Injectable()
export class VerifyTotpLoginUseCase {
  private readonly logger = new Logger(VerifyTotpLoginUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Verifica o código TOTP usando o mfaChallengeToken (JWT temporário que contém userId).
   * Retorna os tokens JWT completos para estabelecer a sessão.
   */
  async execute(mfaChallengeToken: string, code: string): Promise<TokenPair> {
    // Valida o challenge token
    let payload: { sub: string; mfa: true } | null = null;
    try {
      payload = this.jwtService.verify<{ sub: string; mfa: true }>(mfaChallengeToken, {
        secret: this.config.get<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Token de desafio MFA inválido ou expirado');
    }

    if (!payload?.mfa) {
      throw new UnauthorizedException('Token de desafio MFA inválido');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        agencyId: true,
        role: true,
        totpSecret: true,
        totpEnabled: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive || !user.totpEnabled || !user.totpSecret) {
      throw new UnauthorizedException('Sessão de autenticação inválida');
    }

    const isValid = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!isValid) {
      throw new UnauthorizedException('Código 2FA inválido');
    }

    const expiresIn = 15 * 60; // 15 minutos

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, agencyId: user.agencyId, role: user.role },
      { secret: this.config.get<string>('JWT_SECRET'), expiresIn },
    );

    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      { secret: this.config.get<string>('JWT_SECRET'), expiresIn: '7d' },
    );

    // Atualiza último login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return { accessToken, refreshToken, expiresIn };
  }
}

/** Helper para criar o challenge JWT de MFA (chamado pelo LoginUseCase) */
export function createMfaChallengeToken(
  userId: string,
  jwtService: JwtService,
  jwtSecret: string,
): string {
  return jwtService.sign(
    { sub: userId, mfa: true },
    { secret: jwtSecret, expiresIn: MFA_CHALLENGE_TTL_SECONDS },
  );
}
