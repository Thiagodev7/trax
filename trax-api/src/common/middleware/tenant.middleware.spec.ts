import { UnauthorizedException } from '@nestjs/common';
import { TenantMiddleware, clearTenantCache } from './tenant.middleware';
import { PrismaService } from '@/prisma/prisma.service';
import * as tenantContext from '@common/context/tenant.context';

describe('TenantMiddleware', () => {
  let middleware: TenantMiddleware;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(() => {
    process.env.TRAX_BASE_DOMAIN = 'traxsolucoes.com.br';
    prismaService = {
      agency: {
        findFirst: jest.fn(),
      },
    } as any;
    middleware = new TenantMiddleware(prismaService);
    clearTenantCache();
  });

  it('deve pular a resolução de tenant em rotas públicas', async () => {
    const req = { path: '/api/health', headers: {} } as any;
    const res = {} as any;
    const next = jest.fn();

    await middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(prismaService.agency.findFirst).not.toHaveBeenCalled();
  });

  it('deve pular a resolução de tenant para admin host', async () => {
    const req = { path: '/api/v1/clients', headers: { host: 'admin.traxsolucoes.com.br' } } as any;
    const res = {} as any;
    const next = jest.fn();

    await middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(prismaService.agency.findFirst).not.toHaveBeenCalled();
  });

  it('deve extrair o hostname do header x-agency-domain', async () => {
    const req = {
      path: '/api/v1/clients',
      headers: { 'x-agency-domain': 'agencia-x.com.br' },
    } as any;
    const res = {} as any;
    const next = jest.fn();

    (prismaService.agency.findFirst as jest.Mock).mockResolvedValue({
      id: 'agency-1',
      slug: 'agencia-x',
    } as any);

    jest.spyOn(tenantContext.tenantStorage, 'run').mockImplementation((_, cb) => cb());

    await middleware.use(req, res, next);

    expect(prismaService.agency.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ customDomain: 'agencia-x.com.br' }],
        }),
      }),
    );
    expect(next).toHaveBeenCalled();
  });

  it('deve lançar UnauthorizedException se o tenant não for encontrado', async () => {
    const req = {
      path: '/api/v1/clients',
      headers: { host: 'unknown.com' },
    } as any;
    const res = {} as any;
    const next = jest.fn();

    (prismaService.agency.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(middleware.use(req, res, next)).rejects.toThrow(UnauthorizedException);
  });

  it('deve usar o cache na segunda requisição', async () => {
    const req = {
      path: '/api/v1/clients',
      headers: { host: 'agencia.com.br' },
    } as any;
    const res = {} as any;
    const next = jest.fn();

    (prismaService.agency.findFirst as jest.Mock).mockResolvedValue({
      id: 'agency-1',
      slug: 'agencia',
    } as any);

    jest.spyOn(tenantContext.tenantStorage, 'run').mockImplementation((_, cb) => cb());

    // Primeira request
    await middleware.use(req, res, next);
    expect(prismaService.agency.findFirst).toHaveBeenCalledTimes(1);

    // Segunda request
    await middleware.use(req, res, next);
    // Não deve chamar o prisma novamente
    expect(prismaService.agency.findFirst).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(2);
  });
});
