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
import { MetaConfigModule } from '@/modules/company/meta-config/meta-config.module';

@Module({
  imports: [MetaConfigModule],
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
  ],
})
export class MetricsModule {}
