import { AsyncLocalStorage } from 'async_hooks';
import { AuditActorType } from '@prisma/client';

export interface AuditContext {
  actorType: AuditActorType;
  userId?: string;
  superAdminId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export const auditContextStorage = new AsyncLocalStorage<AuditContext>();

export function getAuditContext(): AuditContext | undefined {
  return auditContextStorage.getStore();
}
