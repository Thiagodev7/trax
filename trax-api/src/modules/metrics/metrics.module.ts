import { Module } from '@nestjs/common';
import { MetricsController } from './presentation/metrics.controller';
import { SharedMetricsController } from './presentation/shared-metrics.controller';
import { DashboardSummaryController } from './presentation/dashboard-summary.controller';
import { SharedReportAccessService } from './application/services/shared-report-access.service';
import { GetMetaAdsMetricsUseCase } from './application/use-cases/get-meta-ads-metrics.use-case';
import { GetMetaAdsAdsetDetailUseCase } from './application/use-cases/get-meta-ads-adset-detail.use-case';
import { ExportMetaAdsUseCase } from './application/use-cases/export-meta-ads.use-case';
import { GetGoogleAdsMetricsUseCase } from './application/use-cases/get-google-ads-metrics.use-case';
import { GetOrganicMetricsUseCase } from './application/use-cases/get-organic-metrics.use-case';
import { GetCrmMetricsUseCase } from './application/use-cases/get-crm-metrics.use-case';
import { GetCalendarMetricsUseCase } from './application/use-cases/get-calendar-metrics.use-case';
import { GetDashboardSummaryUseCase } from './application/use-cases/get-dashboard-summary.use-case';
import { GetRdStationMetricsUseCase } from './application/use-cases/get-rd-station-metrics.use-case';
import { GetNectarMetricsUseCase } from './application/use-cases/get-nectar-metrics.use-case';
import { GetMarketingFunnelUseCase } from './application/use-cases/get-marketing-funnel.use-case';
import { MetaConfigModule } from '@/modules/company/meta-config/meta-config.module';
import { IntegrationModule } from '@/modules/integration/integration.module';
import { RdOfficialFunnelService } from './application/services/rd-official-funnel.service';

@Module({
  imports: [MetaConfigModule, IntegrationModule],
  controllers: [MetricsController, SharedMetricsController, DashboardSummaryController],
  providers: [
    SharedReportAccessService,
    GetMetaAdsMetricsUseCase,
    GetMetaAdsAdsetDetailUseCase,
    ExportMetaAdsUseCase,
    GetGoogleAdsMetricsUseCase,
    GetOrganicMetricsUseCase,
    GetCrmMetricsUseCase,
    GetCalendarMetricsUseCase,
    GetDashboardSummaryUseCase,
    GetRdStationMetricsUseCase,
    GetNectarMetricsUseCase,
    GetMarketingFunnelUseCase,
    RdOfficialFunnelService,
  ],
})
export class MetricsModule {}
