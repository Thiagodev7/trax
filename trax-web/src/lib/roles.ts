/**
 * Papéis do backend (Prisma UserRole) mapeados para permissões de navegação no frontend.
 */
export type NavRole = 'ADMIN' | 'MANAGER' | 'VIEWER'

const API_ROLE_TO_NAV: Record<string, NavRole> = {
  AGENCY_ADMIN: 'ADMIN',
  AGENCY_VIEWER: 'MANAGER',
  CLIENT_VIEWER: 'VIEWER',
  // aliases legados (se existirem em sessões antigas)
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  VIEWER: 'VIEWER',
}

export function toNavRole(apiRole: string | undefined | null): NavRole {
  if (!apiRole) return 'VIEWER'
  return API_ROLE_TO_NAV[apiRole] ?? 'VIEWER'
}

export function canAccessNavItem(apiRole: string | undefined | null, allowedNavRoles: NavRole[]): boolean {
  const navRole = toNavRole(apiRole)
  return allowedNavRoles.includes(navRole)
}

export const ROLE_LABELS: Record<string, string> = {
  AGENCY_ADMIN: 'Administrador',
  AGENCY_VIEWER: 'Visualizador da agência',
  CLIENT_VIEWER: 'Visualizador de cliente',
  ADMIN: 'Admin',
  MANAGER: 'Gerente',
  VIEWER: 'Visualizador',
}

export function getRoleLabel(apiRole: string | undefined | null): string {
  if (!apiRole) return 'Usuário'
  return ROLE_LABELS[apiRole] ?? apiRole
}

/** Apenas administradores da agência podem editar branding / configurações */
export function canAccessSettings(apiRole: string | undefined | null): boolean {
  return toNavRole(apiRole) === 'ADMIN'
}
