import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { AuditAction, AuditEntityType } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { GoogleAdsService } from '../services/google-ads.service';
import { GoogleAdsOAuthService } from '../services/google-ads-oauth.service';
import { encryptCredentials } from '../crypto.helper';
import { AuditLogService } from '@modules/audit-log/application/services/audit-log.service';

@Injectable()
export class ConnectGoogleAdsUseCase {
  constructor(
    private readonly oauth: GoogleAdsOAuthService,
    private readonly auditLog: AuditLogService,
  ) {}

  execute(agencyId: string, companyId: string, returnUrl?: string): { url: string } {
    const url = this.oauth.buildConnectUrl(agencyId, companyId, returnUrl);
    // Registra início do fluxo OAuth (fire-and-forget)
    this.auditLog.record({
      agencyId,
      action: AuditAction.OAUTH_CONNECT,
      entityType: AuditEntityType.INTEGRATION,
      entityId: companyId,
      entityName: 'Google Ads',
      description: 'Fluxo OAuth Google Ads iniciado',
      metadata: { companyId, provider: 'GOOGLE_ADS', step: 'start' },
    });
    return { url };
  }
}

@Injectable()
export class ListGoogleAdsCustomersUseCase {
  constructor(
    private readonly oauth: GoogleAdsOAuthService,
    private readonly googleAds: GoogleAdsService,
  ) {}

  async execute(
    agencyId: string,
    companyId: string,
    pendingId: string,
  ): Promise<Array<{ id: string; formatted: string }>> {
    const pending = await this.oauth.getPending(pendingId);
    if (!pending) throw new BadRequestException('Sessão OAuth expirada. Conecte novamente.');
    if (pending.agencyId !== agencyId || pending.companyId !== companyId) {
      throw new ForbiddenException('Sessão OAuth não pertence a este cliente.');
    }
    return this.googleAds.listAccessibleCustomers(pending.refreshToken);
  }
}

@Injectable()
export class FinalizeGoogleAdsOAuthUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly oauth: GoogleAdsOAuthService,
    private readonly googleAds: GoogleAdsService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(
    agencyId: string,
    companyId: string,
    pendingId: string,
    customerId: string,
    displayName?: string,
  ) {
    const pending = await this.oauth.consumePending(pendingId);
    if (!pending) throw new BadRequestException('Sessão OAuth expirada. Conecte novamente.');
    if (pending.agencyId !== agencyId || pending.companyId !== companyId) {
      throw new ForbiddenException('Sessão OAuth não pertence a este cliente.');
    }

    await this.prisma.company.findFirstOrThrow({ where: { id: companyId, agencyId } });

    const normalizedId = this.googleAds.normalizeCustomerId(customerId);
    const credentials = {
      refreshToken: pending.refreshToken,
      customerId: normalizedId,
      ...(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID
        ? { loginCustomerId: this.googleAds.normalizeCustomerId(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID) }
        : {}),
    };

    const test = await this.googleAds.testConnection(credentials);
    if (!test.valid) {
      throw new BadRequestException('Não foi possível validar a conta Google Ads selecionada.');
    }

    const credentialsEnc = encryptCredentials(credentials);
    const externalAccount = normalizedId;

    try {
      const existing = await this.prisma.integration.findFirst({
        where: { companyId, agencyId, provider: 'GOOGLE_ADS', externalAccount },
      });

      const integration = existing
        ? await this.prisma.integration.update({
            where: { id: existing.id },
            data: {
              credentialsEnc,
              displayName: displayName ?? test.name ?? existing.displayName,
              status: 'ACTIVE',
              lastErrorMsg: null,
            },
            select: {
              id: true,
              provider: true,
              displayName: true,
              status: true,
              metadata: true,
              externalAccount: true,
              lastSyncAt: true,
              lastErrorMsg: true,
              createdAt: true,
              updatedAt: true,
            },
          })
        : await this.prisma.integration.create({
            data: {
              agencyId,
              companyId,
              provider: 'GOOGLE_ADS',
              displayName: displayName ?? test.name ?? 'Google Ads',
              credentialsEnc,
              externalAccount,
              status: 'ACTIVE',
            },
            select: {
              id: true,
              provider: true,
              displayName: true,
              status: true,
              metadata: true,
              externalAccount: true,
              lastSyncAt: true,
              lastErrorMsg: true,
              createdAt: true,
              updatedAt: true,
            },
          });

      await this.auditLog.record({
        agencyId,
        action: existing ? AuditAction.UPDATE : AuditAction.CREATE,
        entityType: AuditEntityType.INTEGRATION,
        entityId: integration.id,
        entityName: integration.displayName ?? integration.provider,
        description: `Google Ads conectado via OAuth (${this.googleAds.formatCustomerId(normalizedId)})`,
        metadata: { companyId, customerId: normalizedId },
      });

      return integration;
    } catch (err: unknown) {
      if ((err as { code?: string })?.code === 'P2002') {
        throw new ConflictException('Já existe integração Google Ads para esta conta.');
      }
      throw err;
    }
  }
}

@Injectable()
export class GoogleAdsOAuthCallbackUseCase {
  private readonly logger = new Logger(GoogleAdsOAuthCallbackUseCase.name);

  constructor(
    private readonly oauth: GoogleAdsOAuthService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(code: string | undefined, state: string | undefined, error?: string): Promise<string> {
    if (error) {
      // Registra falha OAuth se conseguirmos extrair o agencyId do state
      if (state) {
        try {
          const payload = this.oauth.verifyState(state);
          this.auditLog.record({
            agencyId: payload.agencyId,
            action: AuditAction.OAUTH_CONNECT,
            entityType: AuditEntityType.INTEGRATION,
            entityId: payload.companyId,
            entityName: 'Google Ads',
            description: `OAuth Google Ads recusado pelo usuário ou erro: ${error}`,
            metadata: { provider: 'GOOGLE_ADS', step: 'failed', error },
          });
        } catch { /* state inválido, não há contexto para logar */ }
      }
      const base = this.oauth.getWebAppUrl();
      return `${base}/integrations?google_oauth=error&message=${encodeURIComponent(error)}`;
    }
    if (!code || !state) {
      throw new BadRequestException('Parâmetros OAuth ausentes.');
    }
    const { redirectUrl } = await this.oauth.handleCallback(code, state);

    // Registra callback recebido com sucesso
    try {
      const payload = this.oauth.verifyState(state);
      this.auditLog.record({
        agencyId: payload.agencyId,
        action: AuditAction.OAUTH_CONNECT,
        entityType: AuditEntityType.INTEGRATION,
        entityId: payload.companyId,
        entityName: 'Google Ads',
        description: 'Token OAuth Google Ads recebido — aguardando seleção de conta',
        metadata: { provider: 'GOOGLE_ADS', step: 'callback_received' },
      });
    } catch { /* não bloqueia o redirect */ }

    return redirectUrl;
  }
}
