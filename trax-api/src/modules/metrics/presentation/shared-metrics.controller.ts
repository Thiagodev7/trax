import { Controller, Get, Header, Param, Query, Res, Version } from '@nestjs/common';
import type { Response } from 'express';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '@common/decorators/roles.decorator';
import { GetMetaAdsMetricsUseCase } from '../application/use-cases/get-meta-ads-metrics.use-case';
import { GetMetaAdsAdsetDetailUseCase } from '../application/use-cases/get-meta-ads-adset-detail.use-case';
import { ExportMetaAdsUseCase } from '../application/use-cases/export-meta-ads.use-case';
import { GetGoogleAdsMetricsUseCase } from '../application/use-cases/get-google-ads-metrics.use-case';
import { GetOrganicMetricsUseCase } from '../application/use-cases/get-organic-metrics.use-case';
import { GetCrmMetricsUseCase } from '../application/use-cases/get-crm-metrics.use-case';
import { GetCalendarMetricsUseCase } from '../application/use-cases/get-calendar-metrics.use-case';
import { SharedReportAccessService } from '../application/services/shared-report-access.service';

@ApiTags('Shared Metrics')
@Controller('reports/shared/:token/metrics')
export class SharedMetricsController {
  constructor(
    private readonly sharedAccess: SharedReportAccessService,
    private readonly getMetaAds: GetMetaAdsMetricsUseCase,
    private readonly getAdsetDetail: GetMetaAdsAdsetDetailUseCase,
    private readonly exportMetaAds: ExportMetaAdsUseCase,
    private readonly getGoogleAds: GetGoogleAdsMetricsUseCase,
    private readonly getOrganic: GetOrganicMetricsUseCase,
    private readonly getCrm: GetCrmMetricsUseCase,
    private readonly getCalendar: GetCalendarMetricsUseCase,
  ) {}

  @Public()
  @Get('meta-ads')
  @Version('1')
  @ApiOperation({ summary: 'Métricas Meta Ads via link público' })
  async metaAds(
    @Param('token') token: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('campaign') campaign?: string,
    @Query('status') status?: 'active' | 'paused' | 'all',
    @Query('product') product?: string,
    @Query('state') state?: string,
    @Query('search') search?: string,
  ) {
    return this.sharedAccess.withSharedReport(token, ({ reportId, agencyId }) =>
      this.getMetaAds.execute({
        agencyId,
        reportId,
        startDate,
        endDate,
        campaign,
        status,
        product,
        state,
        search,
      }),
    );
  }

  @Public()
  @Get('meta-ads/adsets/:adsetId')
  @Version('1')
  async metaAdsAdset(
    @Param('token') token: string,
    @Param('adsetId') adsetId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.sharedAccess.withSharedReport(token, ({ reportId, agencyId }) =>
      this.getAdsetDetail.execute({ agencyId, reportId, adsetId, startDate, endDate }),
    );
  }

  @Public()
  @Get('meta-ads/export.csv')
  @Version('1')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportCsv(
    @Param('token') token: string,
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('entity') entity: 'adsets' | 'creatives' | 'daily' = 'adsets',
  ) {
    const csv = await this.sharedAccess.withSharedReport(token, ({ reportId, agencyId }) =>
      this.exportMetaAds.execute({ agencyId, reportId, startDate, endDate, entity }),
    );
    res.setHeader('Content-Disposition', `attachment; filename="meta-ads-${entity}-${Date.now()}.csv"`);
    res.send(csv);
  }

  @Public()
  @Get('google-ads')
  @Version('1')
  async googleAds(
    @Param('token') token: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.sharedAccess.withSharedReport(token, ({ reportId, agencyId }) =>
      this.getGoogleAds.execute({ agencyId, reportId, startDate, endDate }),
    );
  }

  @Public()
  @Get('organic')
  @Version('1')
  async organic(
    @Param('token') token: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('selectedDate') selectedDate?: string,
  ) {
    return this.sharedAccess.withSharedReport(token, ({ reportId, agencyId }) =>
      this.getOrganic.execute({ agencyId, reportId, startDate, endDate, selectedDate }),
    );
  }

  @Public()
  @Get('crm')
  @Version('1')
  async crm(@Param('token') token: string, @Query('origin') origin?: string) {
    return this.sharedAccess.withSharedReport(token, ({ reportId, agencyId }) =>
      this.getCrm.execute({ agencyId, reportId, origin }),
    );
  }

  @Public()
  @Get('calendar')
  @Version('1')
  async calendar(
    @Param('token') token: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.sharedAccess.withSharedReport(token, ({ reportId, agencyId }) =>
      this.getCalendar.execute({ agencyId, reportId, startDate, endDate }),
    );
  }
}
