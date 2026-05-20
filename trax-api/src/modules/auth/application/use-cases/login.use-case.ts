import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { PrismaService } from '@/prisma/prisma.service';
import { getAgencyId } from '@common/context/tenant.context';
import { LoginDto } from '../../presentation/dto/login.dto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class LoginUseCase {
  private readonly logger = new Logger(LoginUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async execute(dto: LoginDto): Promise<TokenPair> {
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

    // 2. Verifica senha (SHA-256 — em produção usar bcrypt)
    const inputHash = createHash('sha256').update(dto.password).digest('hex');
    if (inputHash !== user.passwordHash) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // 3. Gera tokens
    const { accessToken, refreshToken } = await this.generateTokenPair(user);

    // 4. Atualiza lastLoginAt
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    this.logger.log(`Login: ${user.email} (agência ${agencyId})`);

    const expiresIn = 15 * 60; // 15 minutos em segundos
    return { accessToken, refreshToken, expiresIn };
  }

  private async generateTokenPair(user: {
    id: string;
    agencyId: string;
    email: string;
    role: string;
  }): Promise<{ accessToken: string; refreshToken: string }> {
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
      },
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }
}
