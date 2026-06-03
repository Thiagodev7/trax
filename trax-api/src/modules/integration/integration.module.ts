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
import { MetaOAuthService } from './application/services/meta-oauth.service';
import { InstagramService } from './application/services/instagram.service';
import { FacebookPageService } from './application/services/facebook-page.service';
import { NectarCrmService } from './application/services/nectar-crm.service';
import { RdStationService } from './application/services/rd-station.service';
import { RdStationOAuthService } from './application/services/rd-station-oauth.service';
import { SyncScheduler } from './application/services/sync.scheduler';
import { RdTokenRefreshService } from './application/services/rd-token-refresh.service';
import { MetaTokenRefreshService } from './application/services/meta-token-refresh.service';
import {
  ConnectGoogleAdsUseCase,
  ListGoogleAdsCustomersUseCase,
  FinalizeGoogleAdsOAuthUseCase,
  GoogleAdsOAuthCallbackUseCase,
} from './application/use-cases/google-ads-oauth.use-cases';
import {
  ConnectMetaUseCase,
  MetaOAuthCallbackUseCase,
  ListMetaAdAccountsUseCase,
  ListMetaPagesUseCase,
  FinalizeMetaOAuthUseCase,
} from './application/use-cases/meta-oauth.use-cases';
import {
  ConnectRdStationUseCase,
  RdStationCallbackUseCase,
  FinalizeRdStationUseCase,
} from './application/use-cases/rd-station-oauth.use-cases';

@Module({
  controllers: [IntegrationController],
  providers: [
    // CRUD
    ListIntegrationsUseCase,
    CreateIntegrationUseCase,
    UpdateIntegrationUseCase,
    DeleteIntegrationUseCase,
    SyncIntegrationUseCase,
    TestIntegrationUseCase,
    // Services
    MetaAdsService,
    MetaOAuthService,
    GoogleAdsService,
    GoogleAdsOAuthService,
    InstagramService,
    FacebookPageService,
    NectarCrmService,
    RdStationService,
    RdStationOAuthService,
    SyncScheduler,
    RdTokenRefreshService,
    MetaTokenRefreshService,
    // Google Ads OAuth use-cases
    ConnectGoogleAdsUseCase,
    ListGoogleAdsCustomersUseCase,
    FinalizeGoogleAdsOAuthUseCase,
    GoogleAdsOAuthCallbackUseCase,
    // Meta OAuth use-cases
    ConnectMetaUseCase,
    MetaOAuthCallbackUseCase,
    ListMetaAdAccountsUseCase,
    ListMetaPagesUseCase,
    FinalizeMetaOAuthUseCase,
    // RD Station OAuth use-cases
    ConnectRdStationUseCase,
    RdStationCallbackUseCase,
    FinalizeRdStationUseCase,
  ],
  exports: [MetaAdsService, GoogleAdsService, InstagramService, FacebookPageService, NectarCrmService, RdStationService, RdStationOAuthService],
})
export class IntegrationModule {}
