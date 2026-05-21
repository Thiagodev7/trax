import { Controller, Get, Param, ParseUUIDPipe, Query, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '@common/decorators/current-tenant.decorator';
import { GetMetaAdsMetricsUseCase } from '../application/use-cases/get-meta-ads-metrics.use-case';
import { GetOrganicMetricsUseCase } from '../application/use-cases/get-organic-metrics.use-case';
import { GetCrmMetricsUseCase } from '../application/use-cases/get-crm-metrics.use-case';
import { GetCalendarMetricsUseCase } from '../application/use-cases/get-calendar-metrics.use-case';

@ApiBearerAuth()
@ApiTags('Metrics')
@Controller('reports/:id/metrics')
export class MetricsController {
  constructor(
    private readonly getMetaAds: GetMetaAdsMetricsUseCase,
    private readonly getOrganic: GetOrganicMetricsUseCase,
    private readonly getCrm: GetCrmMetricsUseCase,
    private readonly getCalendar: GetCalendarMetricsUseCase,
  ) {}

  @Get('meta-ads')
  @Version('1')
  @ApiOperation({ summary: 'Métricas de Meta Ads do relatório' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'campaign', required: false, type: String })
  async metaAds(
    @CurrentTenant('agencyId') agencyId: string,
    @Param('id', ParseUUIDPipe) reportId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('campaign') campaign?: string,
  ) {
    return this.getMetaAds.execute({ agencyId, reportId, startDate, endDate, campaign });
  }

  @Get('organic')
  @Version('1')
  @ApiOperation({ summary: 'Métricas orgânicas (Instagram + Facebook) do relatório' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async organic(
    @CurrentTenant('agencyId') agencyId: string,
    @Param('id', ParseUUIDPipe) reportId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.getOrganic.execute({ agencyId, reportId, startDate, endDate });
  }

  @Get('crm')
  @Version('1')
  @ApiOperation({ summary: 'Métricas de CRM (Nectar) do relatório' })
  async crm(
    @CurrentTenant('agencyId') agencyId: string,
    @Param('id', ParseUUIDPipe) reportId: string,
  ) {
    return this.getCrm.execute({ agencyId, reportId });
  }

  @Get('calendar')
  @Version('1')
  @ApiOperation({ summary: 'Dados de calendário editorial do relatório' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async calendar(
    @CurrentTenant('agencyId') agencyId: string,
    @Param('id', ParseUUIDPipe) reportId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.getCalendar.execute({ agencyId, reportId, startDate, endDate });
  }
}
