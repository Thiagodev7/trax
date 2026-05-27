import { Module } from '@nestjs/common';
import { AgencyController } from './presentation/agency.controller';
import { GetAgencyBrandingUseCase } from './application/use-cases/get-agency-branding.use-case';
import { UpdateAgencyBrandingUseCase } from './application/use-cases/update-agency-branding.use-case';
import { GetAgencyPlanUseCase } from './application/use-cases/get-agency-plan.use-case';

@Module({
  controllers: [AgencyController],
  providers: [GetAgencyBrandingUseCase, UpdateAgencyBrandingUseCase, GetAgencyPlanUseCase],
})
export class AgencyModule {}
