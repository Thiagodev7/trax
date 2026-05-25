import { Module } from '@nestjs/common';
import { OnboardingController } from './presentation/onboarding.controller';
import { CreateAgencyUseCase } from './application/use-cases/create-agency.use-case';

@Module({
  controllers: [OnboardingController],
  providers: [CreateAgencyUseCase],
})
export class OnboardingModule {}
