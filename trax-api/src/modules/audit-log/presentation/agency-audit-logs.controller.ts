import { Controller, Get, Query, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { CurrentTenant } from '@common/decorators/current-tenant.decorator';
import { ListAuditLogsUseCase } from '../application/use-cases/list-audit-logs.use-case';

@ApiBearerAuth()
@ApiTags('Audit Logs')
@Controller('audit-logs')
export class AgencyAuditLogsController {
  constructor(private readonly listAuditLogs: ListAuditLogsUseCase) {}

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'Lista logs de auditoria da agência atual (multi-tenant)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'entityType', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  async list(
    @CurrentTenant('agencyId') agencyId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('search') search?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.listAuditLogs.execute({
      agencyIdFilter: agencyId,
      page: page ? Number(page) : 1,
      limit: limit ? Math.min(Number(limit), 50) : 20,
      action: action as any,
      entityType: entityType as any,
      search,
      from,
      to,
    });
  }
}
