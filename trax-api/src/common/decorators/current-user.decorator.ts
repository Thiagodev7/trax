import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedUser {
  sub: string;      // userId
  agencyId: string;
  role: string;
  email: string;
}

/**
 * Extrai o usuário autenticado do JWT (injetado pelo JwtStrategy).
 *
 * Uso:
 *   @Get('me')
 *   getMe(@CurrentUser() user: AuthenticatedUser) { ... }
 *
 *   @Get('me')
 *   getMe(@CurrentUser('sub') userId: string) { ... }
 */
export const CurrentUser = createParamDecorator(
  (field: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;
    return field ? user?.[field] : user;
  },
);
