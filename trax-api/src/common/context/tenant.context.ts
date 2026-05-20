import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  agencyId: string;
  agencySlug: string;
}

/**
 * AsyncLocalStorage garante que o contexto do tenant seja propagado
 * de forma segura por toda a cadeia de execução assíncrona de uma request,
 * sem precisar passar agencyId como parâmetro em cada função.
 */
export const tenantStorage = new AsyncLocalStorage<TenantContext>();

export function getTenantContext(): TenantContext {
  const ctx = tenantStorage.getStore();
  if (!ctx) {
    throw new Error(
      'TenantContext não disponível. Verifique se o TenantMiddleware está configurado.',
    );
  }
  return ctx;
}

export function getAgencyId(): string {
  return getTenantContext().agencyId;
}
