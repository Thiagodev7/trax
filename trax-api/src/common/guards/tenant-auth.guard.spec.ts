import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantAuthGuard } from './tenant-auth.guard';
import * as tenantContext from '@common/context/tenant.context';

// Mock do @nestjs/passport AuthGuard
jest.mock('@nestjs/passport', () => ({
  AuthGuard: () => {
    return class {
      async canActivate(context: ExecutionContext): Promise<boolean> {
        return true;
      }
    };
  },
}));

describe('TenantAuthGuard', () => {
  let guard: TenantAuthGuard;
  let reflector: jest.Mocked<Reflector>;
  let mockExecutionContext: any;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;
    guard = new TenantAuthGuard(reflector);

    mockExecutionContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user: null }),
      }),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve liberar o acesso se a rota for pública (@Public)', async () => {
    reflector.getAllAndOverride.mockReturnValueOnce(true); // isPublic = true

    const result = await guard.canActivate(mockExecutionContext);
    expect(result).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalled();
  });

  it('deve lançar UnauthorizedException se não houver usuário (falha de autenticação)', async () => {
    reflector.getAllAndOverride.mockReturnValueOnce(false); // isPublic = false
    mockExecutionContext.switchToHttp().getRequest.mockReturnValue({ user: null });

    await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
  });

  it('deve lançar ForbiddenException se user.agencyId não bater com o tenant (cross-tenant attack)', async () => {
    reflector.getAllAndOverride.mockReturnValue(false); // isPublic = false, sem required roles
    mockExecutionContext.switchToHttp().getRequest.mockReturnValue({
      user: { agencyId: 'agency-A', role: 'AGENCY_ADMIN', isSuperAdmin: false },
    });

    jest.spyOn(tenantContext, 'getAgencyId').mockReturnValue('agency-B');

    await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow('Acesso negado: token não pertence a esta agência');
  });

  it('deve liberar o acesso se user.agencyId bater com o tenant', async () => {
    reflector.getAllAndOverride.mockReturnValue(null); // isPublic = false, sem required roles
    mockExecutionContext.switchToHttp().getRequest.mockReturnValue({
      user: { agencyId: 'agency-A', role: 'AGENCY_ADMIN', isSuperAdmin: false },
    });

    jest.spyOn(tenantContext, 'getAgencyId').mockReturnValue('agency-A');

    const result = await guard.canActivate(mockExecutionContext);
    expect(result).toBe(true);
  });

  it('deve permitir acesso cross-tenant para super-admins', async () => {
    reflector.getAllAndOverride.mockReturnValue(null);
    mockExecutionContext.switchToHttp().getRequest.mockReturnValue({
      user: { agencyId: 'agency-superadmin', role: 'SUPER_ADMIN', isSuperAdmin: true },
    });

    // O superadmin pode acessar a 'agency-B' sem ser da 'agency-B'
    jest.spyOn(tenantContext, 'getAgencyId').mockReturnValue('agency-B');

    const result = await guard.canActivate(mockExecutionContext);
    expect(result).toBe(true);
  });

  it('deve lançar ForbiddenException se o usuário não tiver a role necessária', async () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(false) // isPublic
      .mockReturnValueOnce(['AGENCY_ADMIN']); // requiredRoles

    mockExecutionContext.switchToHttp().getRequest.mockReturnValue({
      user: { agencyId: 'agency-A', role: 'CLIENT_VIEWER', isSuperAdmin: false },
    });

    jest.spyOn(tenantContext, 'getAgencyId').mockReturnValue('agency-A');

    await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(ForbiddenException);
  });
});
