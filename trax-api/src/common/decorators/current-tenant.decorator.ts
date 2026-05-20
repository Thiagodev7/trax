import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { getTenantContext, TenantContext } from '@common/context/tenant.context';

/**
 * Decorator que extrai o contexto do tenant atual do AsyncLocalStorage.
 *
 * Uso:
 *   @Get()
 *   findAll(@CurrentTenant() tenant: TenantContext) { ... }
 *
 *   @Get()
 *   findAll(@CurrentTenant('agencyId') agencyId: string) { ... }
 */
export const CurrentTenant = createParamDecorator(
  (field: keyof TenantContext | undefined, _ctx: ExecutionContext) => {
    const tenant = getTenantContext();
    return field ? tenant[field] : tenant;
  },
);
