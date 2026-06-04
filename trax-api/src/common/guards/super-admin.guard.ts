import {
  Injectable,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '@common/decorators/roles.decorator';

/**
 * Guard exclusivo para rotas do super-admin.
 * Valida JWT e exige o claim isSuperAdmin: true.
 */
@Injectable()
export class SuperAdminGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    try {
      const isValid = await super.canActivate(context);
      if (!isValid) return false;
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as { isSuperAdmin?: boolean } | undefined;

    if (!user?.isSuperAdmin) {
      throw new ForbiddenException('Acesso restrito a administradores da plataforma');
    }

    return true;
  }
}
