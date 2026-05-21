import { Module } from '@nestjs/common';
import { MetricsController } from './presentation/metrics.controller';
import { GetMetaAdsMetricsUseCase } from './application/use-cases/get-meta-ads-metrics.use-case';
import { GetOrganicMetricsUseCase } from './application/use-cases/get-organic-metrics.use-case';
import { GetCrmMetricsUseCase } from './application/use-cases/get-crm-metrics.use-case';
import { GetCalendarMetricsUseCase } from './application/use-cases/get-calendar-metrics.use-case';

@Module({
  controllers: [MetricsController],
  providers: [
    GetMetaAdsMetricsUseCase,
    GetOrganicMetricsUseCase,
    GetCrmMetricsUseCase,
    GetCalendarMetricsUseCase,
  ],
})
export class MetricsModule {}
