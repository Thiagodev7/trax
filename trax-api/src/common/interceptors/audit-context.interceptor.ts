import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuditActorType } from '@prisma/client';
import { auditContextStorage } from '@common/context/audit.context';

@Injectable()
export class AuditContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const user = req.user as
      | { sub?: string; isSuperAdmin?: boolean }
      | undefined;

    const auditCtx = user
      ? {
          actorType: user.isSuperAdmin
            ? AuditActorType.SUPER_ADMIN
            : AuditActorType.AGENCY_USER,
          userId: user.isSuperAdmin ? undefined : user.sub,
          superAdminId: user.isSuperAdmin ? user.sub : undefined,
          ipAddress: req.ip as string | undefined,
          userAgent: (req.headers['user-agent'] as string | undefined)?.substring(0, 512),
        }
      : {
          actorType: AuditActorType.SYSTEM,
          ipAddress: req.ip as string | undefined,
          userAgent: (req.headers['user-agent'] as string | undefined)?.substring(0, 512),
        };

    return new Observable((subscriber) => {
      auditContextStorage.run(auditCtx, () => {
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
