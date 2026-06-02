import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginUseCase } from './login.use-case';
import { PrismaService } from '@/prisma/prisma.service';
import { AuditLogService } from '@modules/audit-log/application/services/audit-log.service';
import * as tenantContext from '@common/context/tenant.context';
import * as bcrypt from 'bcryptjs';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let prismaService: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(() => {
    prismaService = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
      },
    } as any;

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    } as any;

    configService = {} as any;

    auditLogService = {
      record: jest.fn(),
    } as any;

    useCase = new LoginUseCase(
      prismaService,
      jwtService,
      configService,
      auditLogService,
    );

    jest.spyOn(tenantContext, 'getAgencyId').mockReturnValue('agency-1');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve falhar se o usuário não for encontrado', async () => {
    (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'test@test.com', password: 'password' }),
    ).rejects.toThrow(UnauthorizedException);
    
    // Assegura que verificou o agencyId
    expect(prismaService.user.findUnique).toHaveBeenCalledWith({
      where: { agencyId_email: { agencyId: 'agency-1', email: 'test@test.com' } },
      select: expect.any(Object),
    });
  });

  it('deve falhar se o usuário estiver inativo', async () => {
    (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      isActive: false,
    });

    await expect(
      useCase.execute({ email: 'test@test.com', password: 'password' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('deve falhar se a senha estiver incorreta', async () => {
    (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      isActive: true,
      passwordHash: 'hashed-password',
    });

    jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

    await expect(
      useCase.execute({ email: 'test@test.com', password: 'wrong-password' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('deve retornar accessToken e refreshToken em caso de sucesso', async () => {
    (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      agencyId: 'agency-1',
      email: 'test@test.com',
      name: 'Test User',
      role: 'AGENCY_ADMIN',
      isActive: true,
      passwordHash: 'hashed-password',
    });

    jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);

    const result = await useCase.execute({ email: 'test@test.com', password: 'password' });

    expect(result).toHaveProperty('accessToken', 'mock-jwt-token');
    expect(result).toHaveProperty('refreshToken');
    expect(result.refreshToken).toBeDefined();

    expect(prismaService.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { lastLoginAt: expect.any(Date) },
    });

    expect(auditLogService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'LOGIN',
        userId: 'user-1',
        agencyId: 'agency-1',
      })
    );
  });
});
