import { Module } from '@nestjs/common';
import { IntegrationController } from './presentation/integration.controller';
import { ListIntegrationsUseCase } from './application/use-cases/list-integrations.use-case';
import { CreateIntegrationUseCase } from './application/use-cases/create-integration.use-case';
import { UpdateIntegrationUseCase } from './application/use-cases/update-integration.use-case';
import { DeleteIntegrationUseCase } from './application/use-cases/delete-integration.use-case';
import { SyncIntegrationUseCase } from './application/use-cases/sync-integration.use-case';
import { TestIntegrationUseCase } from './application/use-cases/test-integration.use-case';
import { MetaAdsService } from './application/services/meta-ads.service';
import { GoogleAdsService } from './application/services/google-ads.service';
import { GoogleAdsOAuthService } from './application/services/google-ads-oauth.service';
import { InstagramService } from './application/services/instagram.service';
import { FacebookPageService } from './application/services/facebook-page.service';
import { NectarCrmService } from './application/services/nectar-crm.service';
import { SyncScheduler } from './application/services/sync.scheduler';
import {
  ConnectGoogleAdsUseCase,
  ListGoogleAdsCustomersUseCase,
  FinalizeGoogleAdsOAuthUseCase,
  GoogleAdsOAuthCallbackUseCase,
} from './application/use-cases/google-ads-oauth.use-cases';

@Module({
  controllers: [IntegrationController],
  providers: [
    ListIntegrationsUseCase,
    CreateIntegrationUseCase,
    UpdateIntegrationUseCase,
    DeleteIntegrationUseCase,
    SyncIntegrationUseCase,
    TestIntegrationUseCase,
    MetaAdsService,
    GoogleAdsService,
    GoogleAdsOAuthService,
    ConnectGoogleAdsUseCase,
    ListGoogleAdsCustomersUseCase,
    FinalizeGoogleAdsOAuthUseCase,
    GoogleAdsOAuthCallbackUseCase,
    InstagramService,
    FacebookPageService,
    NectarCrmService,
    SyncScheduler,
  ],
  exports: [MetaAdsService, GoogleAdsService, InstagramService, FacebookPageService, NectarCrmService],
})
export class IntegrationModule {}
