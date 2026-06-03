import { Global, Module } from '@nestjs/common';
import { AuditLogService } from './application/services/audit-log.service';
import { ListAuditLogsUseCase } from './application/use-cases/list-audit-logs.use-case';
import { AgencyAuditLogsController } from './presentation/agency-audit-logs.controller';

@Global()
@Module({
  controllers: [AgencyAuditLogsController],
  providers: [AuditLogService, ListAuditLogsUseCase],
  exports: [AuditLogService, ListAuditLogsUseCase],
})
export class AuditLogModule {}
