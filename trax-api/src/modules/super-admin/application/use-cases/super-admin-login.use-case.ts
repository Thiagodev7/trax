import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '@/prisma/prisma.service';
import { SuperAdminLoginDto } from '../../presentation/dto/super-admin-login.dto';

export interface SuperAdminTokenPayload {
  accessToken: string;
  expiresIn: number;
  id: string;
  email: string;
  name: string;
}

@Injectable()
export class SuperAdminLoginUseCase {
  private readonly logger = new Logger(SuperAdminLoginUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: SuperAdminLoginDto): Promise<SuperAdminTokenPayload> {
    const admin = await this.prisma.superAdmin.findUnique({
      where: { email: dto.email },
    });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordMatch = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = {
      sub: admin.id,
      email: admin.email,
      role: 'SUPER_ADMIN',
      isSuperAdmin: true,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '8h' });
    const expiresIn = 8 * 60 * 60;

    await this.prisma.superAdmin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    this.logger.log(`Super-admin login: ${admin.email}`);

    return { accessToken, expiresIn, id: admin.id, email: admin.email, name: admin.name };
  }
}
