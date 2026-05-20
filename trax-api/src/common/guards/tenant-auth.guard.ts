import {
  Injectable,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { IS_PUBLIC_KEY, ROLES_KEY } from '@common/decorators/roles.decorator';
import { AuthenticatedUser } from '@common/decorators/current-user.decorator';
import { getAgencyId } from '@common/context/tenant.context';

/**
 * Guard combinado que:
 * 1. Verifica se a rota é pública (@Public)
 * 2. Exige que o usuário esteja autenticado (JWT já validado pelo JwtStrategy)
 * 3. Valida que o agencyId do JWT == agencyId do tenant resolvido pelo domínio
 * 4. Verifica as roles permitidas (@Roles)
 */
@Injectable()
export class TenantAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Rota pública → libera
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // Dispara a validação do token JWT do Passport
    try {
      const isValid = await super.canActivate(context);
      if (!isValid) return false;
    } catch (e) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;

    // 2. Usuário não autenticado
    if (!user) {
      throw new UnauthorizedException('Autenticação necessária');
    }

    // 3. Validação Cross-Tenant: JWT.agencyId deve bater com o tenant do domínio
    const tenantAgencyId = getAgencyId();
    if (user.agencyId !== tenantAgencyId) {
      throw new ForbiddenException(
        'Acesso negado: token não pertence a esta agência',
      );
    }

    // 4. Verificação de roles
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) return true;

    if (!requiredRoles.includes(user.role as UserRole)) {
      throw new ForbiddenException(
        `Acesso negado: requer role ${requiredRoles.join(' ou ')}`,
      );
    }

    return true;
  }
}
