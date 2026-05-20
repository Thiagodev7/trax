import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Define quais roles podem acessar uma rota.
 *
 * Uso:
 *   @Roles(UserRole.AGENCY_ADMIN)
 *   @Delete(':id')
 *   remove() { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/** Marca a rota como pública (sem autenticação JWT necessária) */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
