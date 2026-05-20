import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async execute(rawToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    // 1. Busca o refresh token pelo hash
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            agencyId: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    // 2. Valida token
    if (
      !stored ||
      stored.revokedAt !== null ||
      stored.expiresAt < new Date() ||
      !stored.user.isActive
    ) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    // 3. Gera novo access token
    const payload = {
      sub: stored.user.id,
      agencyId: stored.user.agencyId,
      email: stored.user.email,
      role: stored.user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const expiresIn = 15 * 60;

    return { accessToken, expiresIn };
  }
}
