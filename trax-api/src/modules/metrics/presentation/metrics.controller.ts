import { Controller, Get, Header, Param, ParseUUIDPipe, Query, Res, Version } from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '@common/decorators/current-tenant.decorator';
import { GetMetaAdsMetricsUseCase } from '../application/use-cases/get-meta-ads-metrics.use-case';
import { GetMetaAdsAdsetDetailUseCase } from '../application/use-cases/get-meta-ads-adset-detail.use-case';
import { ExportMetaAdsUseCase } from '../application/use-cases/export-meta-ads.use-case';
import { GetGoogleAdsMetricsUseCase } from '../application/use-cases/get-google-ads-metrics.use-case';
import { GetOrganicMetricsUseCase } from '../application/use-cases/get-organic-metrics.use-case';
import { GetCrmMetricsUseCase } from '../application/use-cases/get-crm-metrics.use-case';
import { GetCalendarMetricsUseCase } from '../application/use-cases/get-calendar-metrics.use-case';

@ApiBearerAuth()
@ApiTags('Metrics')
@Controller('reports/:id/metrics')
export class MetricsController {
  constructor(
    private readonly getMetaAds: GetMetaAdsMetricsUseCase,
    private readonly getAdsetDetail: GetMetaAdsAdsetDetailUseCase,
    private readonly exportMetaAds: ExportMetaAdsUseCase,
    private readonly getGoogleAds: GetGoogleAdsMetricsUseCase,
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
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'paused', 'all'] })
  @ApiQuery({ name: 'product', required: false, type: String })
  @ApiQuery({ name: 'state', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  async metaAds(
    @CurrentTenant('agencyId') agencyId: string,
    @Param('id', ParseUUIDPipe) reportId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('campaign') campaign?: string,
    @Query('status') status?: 'active' | 'paused' | 'all',
    @Query('product') product?: string,
    @Query('state') state?: string,
    @Query('search') search?: string,
  ) {
    return this.getMetaAds.execute({
      agencyId,
      reportId,
      startDate,
      endDate,
      campaign,
      status,
      product,
      state,
      search,
    });
  }

  @Get('meta-ads/adsets/:adsetId')
  @Version('1')
  @ApiOperation({ summary: 'Drill-down de um conjunto de anúncios' })
  async metaAdsAdset(
    @CurrentTenant('agencyId') agencyId: string,
    @Param('id', ParseUUIDPipe) reportId: string,
    @Param('adsetId') adsetId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.getAdsetDetail.execute({ agencyId, reportId, adsetId, startDate, endDate });
  }

  @Get('meta-ads/export.csv')
  @Version('1')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @ApiOperation({ summary: 'Exportar dados Meta Ads em CSV' })
  async exportCsv(
    @CurrentTenant('agencyId') agencyId: string,
    @Param('id', ParseUUIDPipe) reportId: string,
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('entity') entity: 'adsets' | 'creatives' | 'daily' = 'adsets',
  ) {
    const csv = await this.exportMetaAds.execute({ agencyId, reportId, startDate, endDate, entity });
    res.setHeader('Content-Disposition', `attachment; filename="meta-ads-${entity}-${Date.now()}.csv"`);
    res.send(csv);
  }

  @Get('google-ads')
  @Version('1')
  @ApiOperation({ summary: 'Métricas de Google Ads do relatório' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async googleAds(
    @CurrentTenant('agencyId') agencyId: string,
    @Param('id', ParseUUIDPipe) reportId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.getGoogleAds.execute({ agencyId, reportId, startDate, endDate });
  }

  @Get('organic')
  @Version('1')
  @ApiOperation({ summary: 'Métricas orgânicas (Instagram + Facebook) do relatório' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'selectedDate', required: false, type: String })
  async organic(
    @CurrentTenant('agencyId') agencyId: string,
    @Param('id', ParseUUIDPipe) reportId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('selectedDate') selectedDate?: string,
  ) {
    return this.getOrganic.execute({ agencyId, reportId, startDate, endDate, selectedDate });
  }

  @Get('crm')
  @Version('1')
  @ApiOperation({ summary: 'Métricas de CRM (Nectar) do relatório' })
  @ApiQuery({ name: 'origin', required: false, type: String, description: 'meta | google | all' })
  async crm(
    @CurrentTenant('agencyId') agencyId: string,
    @Param('id', ParseUUIDPipe) reportId: string,
    @Query('origin') origin?: string,
  ) {
    return this.getCrm.execute({ agencyId, reportId, origin });
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
