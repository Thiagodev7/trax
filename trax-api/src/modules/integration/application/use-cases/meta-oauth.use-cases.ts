import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { AuditAction, AuditEntityType, IntegrationProvider } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { MetaOAuthService } from '../services/meta-oauth.service';
import { encryptCredentials } from '../crypto.helper';
import { AuditLogService } from '@modules/audit-log/application/services/audit-log.service';

type ScopeGroup = 'ads' | 'pages' | 'instagram' | 'all';

// ── Connect ───────────────────────────────────────────────────────────────────

@Injectable()
export class ConnectMetaUseCase {
  constructor(
    private readonly oauth: MetaOAuthService,
    private readonly auditLog: AuditLogService,
  ) {}

  execute(agencyId: string, companyId: string, scopeGroup: ScopeGroup = 'ads', returnUrl?: string): { url: string } {
    const url = this.oauth.buildConnectUrl(agencyId, companyId, scopeGroup, returnUrl);
    this.auditLog.record({
      agencyId,
      action: AuditAction.OAUTH_CONNECT,
      entityType: AuditEntityType.INTEGRATION,
      entityId: companyId,
      entityName: 'Meta',
      description: 'Fluxo OAuth Meta iniciado',
      metadata: { companyId, provider: 'META', scopeGroup, step: 'start' },
    });
    return { url };
  }
}

// ── Callback (Public) ─────────────────────────────────────────────────────────

@Injectable()
export class MetaOAuthCallbackUseCase {
  private readonly logger = new Logger(MetaOAuthCallbackUseCase.name);

  constructor(
    private readonly oauth: MetaOAuthService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(code: string, state: string, error?: string): Promise<string> {
    if (error) {
      let agencyId: string | undefined;
      let redirectBase = this.oauth.getWebAppUrl();
      try {
        const payload = this.oauth.verifyState(state);
        agencyId = payload.agencyId;
        redirectBase =
          payload.returnUrl ??
          `${this.oauth.getWebAppUrl()}/companies/${payload.companyId}/integrations`;
      } catch { /* silencioso */ }
      if (agencyId) {
        this.auditLog.record({
          agencyId,
          action: AuditAction.OAUTH_CONNECT,
          entityType: AuditEntityType.INTEGRATION,
          entityId: agencyId,
          entityName: 'Meta',
          description: `OAuth Meta falhou: ${error}`,
          metadata: { provider: 'META', step: 'error', error },
        });
      }
      const sep = redirectBase.includes('?') ? '&' : '?';
      return `${redirectBase}${sep}meta_oauth=error&message=${encodeURIComponent(error)}`;
    }

    try {
      const { redirectUrl, pendingId } = await this.oauth.handleCallback(code, state);
      const payload = this.oauth.verifyState(state);
      this.auditLog.record({
        agencyId: payload.agencyId,
        action: AuditAction.OAUTH_CONNECT,
        entityType: AuditEntityType.INTEGRATION,
        entityId: payload.companyId,
        entityName: 'Meta',
        description: 'OAuth Meta autorizado — aguardando seleção de conta',
        metadata: { provider: 'META', step: 'authorized', pendingId },
      });
      return redirectUrl;
    } catch (err: unknown) {
      this.logger.error('Meta OAuth callback falhou', err);
      let redirectBase = this.oauth.getWebAppUrl();
      try {
        const payload = this.oauth.verifyState(state);
        redirectBase =
          payload.returnUrl ??
          `${this.oauth.getWebAppUrl()}/companies/${payload.companyId}/integrations`;
      } catch { /* silencioso */ }
      const sep = redirectBase.includes('?') ? '&' : '?';
      return `${redirectBase}${sep}meta_oauth=error&message=${encodeURIComponent('Falha na conexão Meta')}`;
    }
  }
}

// ── List Ad Accounts ──────────────────────────────────────────────────────────

@Injectable()
export class ListMetaAdAccountsUseCase {
  constructor(
    private readonly oauth: MetaOAuthService,
  ) {}

  async execute(agencyId: string, companyId: string, pendingId: string) {
    const pending = await this.oauth.getPending(pendingId);
    if (!pending) throw new BadRequestException('Sessão OAuth expirada. Conecte novamente.');
    if (pending.agencyId !== agencyId || pending.companyId !== companyId) {
      throw new ForbiddenException('Sessão OAuth não pertence a este cliente.');
    }
    const accounts = await this.oauth.listAdAccounts(pending.longLivedToken);
    return accounts.map((a) => ({
      id: a.id,
      name: a.name,
      currency: a.currency,
    }));
  }
}

// ── List Pages (Instagram / Facebook Page) ────────────────────────────────────

@Injectable()
export class ListMetaPagesUseCase {
  constructor(private readonly oauth: MetaOAuthService) {}

  async execute(agencyId: string, companyId: string, pendingId: string) {
    const pending = await this.oauth.getPending(pendingId);
    if (!pending) throw new BadRequestException('Sessão OAuth expirada. Conecte novamente.');
    if (pending.agencyId !== agencyId || pending.companyId !== companyId) {
      throw new ForbiddenException('Sessão OAuth não pertence a este cliente.');
    }
    const pages = await this.oauth.listPages(pending.longLivedToken);
    return pages.map((p) => ({
      id: p.id,
      name: p.name,
      instagramAccountId: p.instagram_business_account?.id ?? null,
    }));
  }
}

// ── Finalize ─────────────────────────────────────────────────────────────────

export interface FinalizeMetaDto {
  pendingId: string;
  /** If connecting Meta Ads */
  adAccountId?: string;
  /** If connecting Instagram or Facebook Page */
  pageId?: string;
  /** 'META_ADS' | 'INSTAGRAM' | 'FACEBOOK_PAGE' */
  targetProvider: IntegrationProvider;
  displayName?: string;
}

@Injectable()
export class FinalizeMetaOAuthUseCase {
  private readonly logger = new Logger(FinalizeMetaOAuthUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly oauth: MetaOAuthService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(agencyId: string, companyId: string, dto: FinalizeMetaDto) {
    const pending = await this.oauth.consumePending(dto.pendingId);
    if (!pending) throw new BadRequestException('Sessão OAuth expirada. Conecte novamente.');
    if (pending.agencyId !== agencyId || pending.companyId !== companyId) {
      throw new ForbiddenException('Sessão OAuth não pertence a este cliente.');
    }

    const { longLivedToken } = pending;
    let credentials: Record<string, string> = { accessToken: longLivedToken };
    let externalAccount: string | undefined;
    let metadata: Record<string, unknown> = { oauth: true };

    if (dto.targetProvider === 'META_ADS') {
      if (!dto.adAccountId) throw new BadRequestException('adAccountId obrigatório para META_ADS.');
      credentials.adAccountId = dto.adAccountId;
      externalAccount = dto.adAccountId;
      metadata.adAccountId = dto.adAccountId;

    } else if (dto.targetProvider === 'INSTAGRAM') {
      if (!dto.pageId) throw new BadRequestException('pageId obrigatório para INSTAGRAM.');
      // Retrieve igUserId from page
      const pages = await this.oauth.listPages(longLivedToken);
      const page = pages.find((p) => p.id === dto.pageId);
      const igId = page?.instagram_business_account?.id;
      if (!igId) throw new BadRequestException('Conta Instagram não encontrada para esta página.');
      credentials.igUserId = igId;
      externalAccount = igId;
      metadata.pageId = dto.pageId;

    } else if (dto.targetProvider === 'FACEBOOK_PAGE') {
      if (!dto.pageId) throw new BadRequestException('pageId obrigatório para FACEBOOK_PAGE.');
      // Use page-scoped token
      const pages = await this.oauth.listPages(longLivedToken);
      const page = pages.find((p) => p.id === dto.pageId);
      if (!page) throw new BadRequestException('Página não encontrada.');
      credentials = { accessToken: page.access_token, pageId: dto.pageId };
      externalAccount = dto.pageId;
      metadata.pageName = page.name;
    }

    const credentialsEnc = encryptCredentials(credentials);
    const integration = await this.prisma.integration.create({
      data: {
        agencyId,
        companyId,
        provider: dto.targetProvider,
        displayName: dto.displayName ?? null,
        credentialsEnc,
        externalAccount: externalAccount ?? null,
        status: 'ACTIVE',
        metadata: metadata as Record<string, string>,
      },
    });

    this.auditLog.record({
      agencyId,
      action: AuditAction.OAUTH_CONNECT,
      entityType: AuditEntityType.INTEGRATION,
      entityId: integration.id,
      entityName: dto.targetProvider,
      description: `${dto.targetProvider} conectado via OAuth Meta`,
      metadata: { provider: dto.targetProvider, step: 'finalized', externalAccount },
    });

    return integration;
  }
}
