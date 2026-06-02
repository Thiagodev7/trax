import { Module } from '@nestjs/common';
import { ReportController } from './presentation/report.controller';
import { ListReportsUseCase } from './application/use-cases/list-reports.use-case';
import { GetReportUseCase } from './application/use-cases/get-report.use-case';
import { CreateReportUseCase } from './application/use-cases/create-report.use-case';
import { UpdateReportUseCase } from './application/use-cases/update-report.use-case';
import { PublishReportUseCase } from './application/use-cases/publish-report.use-case';
import { DeleteReportUseCase } from './application/use-cases/delete-report.use-case';
import { ReportAiService } from './application/services/report-ai.service';

@Module({
  controllers: [ReportController],
  providers: [
    ListReportsUseCase,
    GetReportUseCase,
    CreateReportUseCase,
    UpdateReportUseCase,
    PublishReportUseCase,
    DeleteReportUseCase,
    ReportAiService,
  ],
})
export class ReportModule {}
