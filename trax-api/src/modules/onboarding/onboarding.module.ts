import { Module } from '@nestjs/common';
import { OnboardingController } from './presentation/onboarding.controller';
import { CreateAgencyUseCase } from './application/use-cases/create-agency.use-case';
import { CheckSlugUseCase } from './application/use-cases/check-slug.use-case';

@Module({
  controllers: [OnboardingController],
  providers: [CreateAgencyUseCase, CheckSlugUseCase],
})
export class OnboardingModule {}
