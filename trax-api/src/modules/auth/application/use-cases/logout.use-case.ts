import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class LogoutUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(rawToken: string): Promise<void> {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    // Tenta revogar o token — falha silenciosamente se não existir
    await this.prisma.refreshToken
      .updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      })
      .catch(() => {
        // Silencia — token pode já ter expirado ou não existir
      });
  }
}
