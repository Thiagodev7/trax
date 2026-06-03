import { Controller, Get, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '@common/decorators/current-tenant.decorator';
import { GetDashboardSummaryUseCase } from '../application/use-cases/get-dashboard-summary.use-case';

@ApiBearerAuth()
@ApiTags('Metrics')
@Controller('metrics')
export class DashboardSummaryController {
  constructor(private readonly getDashboardSummary: GetDashboardSummaryUseCase) {}

  @Get('summary')
  @Version('1')
  @ApiOperation({ summary: 'KPIs agregados da agência para o dashboard (mês corrente vs anterior)' })
  summary(@CurrentTenant('agencyId') agencyId: string) {
    return this.getDashboardSummary.execute(agencyId);
  }
}
