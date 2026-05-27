import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuditAction, AuditEntityType } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '@/prisma/prisma.service';
import { getAgencyId } from '@common/context/tenant.context';
import { AuditLogService } from '@modules/audit-log/application/services/audit-log.service';
import { LoginDto } from '../../presentation/dto/login.dto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface LoginMeta {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class LoginUseCase {
  private readonly logger = new Logger(LoginUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(dto: LoginDto, meta?: LoginMeta): Promise<TokenPair> {
    const agencyId = getAgencyId();

    // 1. Busca usuário — sempre filtrado pelo tenant atual
    const user = await this.prisma.user.findUnique({
      where: { agencyId_email: { agencyId, email: dto.email } },
      select: {
        id: true,
        agencyId: true,
        email: true,
        name: true,
        role: true,
        passwordHash: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      // Mesmo erro para usuário não encontrado e senha errada (evita user enumeration)
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // 2. Verifica senha com bcrypt (tempo constante, resistente a timing attacks)
    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // 3. Gera tokens
    const { accessToken, refreshToken } = await this.generateTokenPair(user, meta);

    // 4. Atualiza lastLoginAt
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    this.logger.log(`Login: ${user.email} (agência ${agencyId})`);

    await this.auditLog.record({
      agencyId,
      userId: user.id,
      action: AuditAction.LOGIN,
      entityType: AuditEntityType.AUTH,
      entityId: user.id,
      entityName: user.name,
      description: `${user.name} fez login`,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    const expiresIn = 15 * 60; // 15 minutos em segundos
    return { accessToken, refreshToken, expiresIn };
  }

  private async generateTokenPair(
    user: { id: string; agencyId: string; email: string; role: string },
    meta?: LoginMeta,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: user.id,
      agencyId: user.agencyId,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    // Refresh token: opaque random token + hash para armazenar no banco
    const rawRefreshToken = randomBytes(48).toString('hex');
    const tokenHash = createHash('sha256').update(rawRefreshToken).digest('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent?.substring(0, 512),
      },
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }
}
