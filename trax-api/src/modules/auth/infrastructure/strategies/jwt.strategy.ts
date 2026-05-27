import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';

interface JwtPayload {
  sub: string;
  agencyId?: string;
  email: string;
  role: string;
  isSuperAdmin?: boolean;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * Chamado pelo Passport após verificar a assinatura do JWT.
   * Suporta tokens de usuário de agência e tokens de super-admin.
   */
  async validate(payload: JwtPayload) {
    // Super-admin: valida na tabela super_admins
    if (payload.isSuperAdmin) {
      const admin = await this.prisma.superAdmin.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, isActive: true },
      });

      if (!admin || !admin.isActive) {
        throw new UnauthorizedException('Super-admin inativo ou não encontrado');
      }

      return {
        sub: admin.id,
        email: admin.email,
        role: 'SUPER_ADMIN',
        isSuperAdmin: true,
      };
    }

    // Usuário de agência: valida na tabela users
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, agencyId: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuário inativo ou não encontrado');
    }

    return {
      sub: user.id,
      agencyId: user.agencyId,
      email: user.email,
      role: user.role,
      isSuperAdmin: false,
    };
  }
}
