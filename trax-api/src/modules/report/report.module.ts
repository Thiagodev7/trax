import { Module } from '@nestjs/common';
import { ReportController } from './presentation/report.controller';
import { ListReportsUseCase } from './application/use-cases/list-reports.use-case';
import { GetReportUseCase } from './application/use-cases/get-report.use-case';
import { CreateReportUseCase } from './application/use-cases/create-report.use-case';
import { PublishReportUseCase } from './application/use-cases/publish-report.use-case';

@Module({
  controllers: [ReportController],
  providers: [
    ListReportsUseCase,
    GetReportUseCase,
    CreateReportUseCase,
    PublishReportUseCase,
  ],
})
export class ReportModule {}
