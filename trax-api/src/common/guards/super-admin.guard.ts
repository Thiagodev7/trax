import {
  Injectable,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard exclusivo para rotas do super-admin.
 * Valida JWT e exige o claim isSuperAdmin: true.
 */
@Injectable()
export class SuperAdminGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
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
