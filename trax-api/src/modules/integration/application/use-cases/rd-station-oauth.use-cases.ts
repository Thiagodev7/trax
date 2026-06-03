import { Injectable, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { AuditAction, AuditEntityType } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { RdStationOAuthService } from '../services/rd-station-oauth.service';
import { encryptCredentials } from '../crypto.helper';
import { AuditLogService } from '@modules/audit-log/application/services/audit-log.service';

// ── Connect ───────────────────────────────────────────────────────────────────

@Injectable()
export class ConnectRdStationUseCase {
  constructor(
    private readonly oauth: RdStationOAuthService,
    private readonly auditLog: AuditLogService,
  ) {}

  execute(agencyId: string, companyId: string, returnUrl?: string): { url: string } {
    const url = this.oauth.buildConnectUrl(agencyId, companyId, returnUrl);
    this.auditLog.record({
      agencyId,
      action: AuditAction.OAUTH_CONNECT,
      entityType: AuditEntityType.INTEGRATION,
      entityId: companyId,
      entityName: 'RD Station',
      description: 'Fluxo OAuth RD Station iniciado',
      metadata: { companyId, provider: 'RD_STATION', step: 'start' },
    });
    return { url };
  }
}

// ── Callback (Public) ─────────────────────────────────────────────────────────

@Injectable()
export class RdStationCallbackUseCase {
  private readonly logger = new Logger(RdStationCallbackUseCase.name);

  constructor(
    private readonly oauth: RdStationOAuthService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(code: string, state: string, error?: string): Promise<string> {
    if (error) {
      try {
        const payload = this.oauth.verifyState(state);
        this.auditLog.record({
          agencyId: payload.agencyId,
          action: AuditAction.OAUTH_CONNECT,
          entityType: AuditEntityType.INTEGRATION,
          entityId: payload.agencyId,
          entityName: 'RD Station',
          description: `OAuth RD Station falhou: ${error}`,
          metadata: { provider: 'RD_STATION', step: 'error', error },
        });
      } catch { /* silencioso */ }
      const base = this.oauth.getWebAppUrl();
      return `${base}/?rd_oauth=error&message=${encodeURIComponent(error)}`;
    }

    try {
      const { redirectUrl, pendingId } = await this.oauth.handleCallback(code, state);
      const payload = this.oauth.verifyState(state);
      this.auditLog.record({
        agencyId: payload.agencyId,
        action: AuditAction.OAUTH_CONNECT,
        entityType: AuditEntityType.INTEGRATION,
        entityId: payload.companyId,
        entityName: 'RD Station',
        description: 'OAuth RD Station autorizado',
        metadata: { provider: 'RD_STATION', step: 'authorized', pendingId },
      });
      return redirectUrl;
    } catch (err: unknown) {
      this.logger.error('RD Station OAuth callback falhou', err);
      const base = this.oauth.getWebAppUrl();
      return `${base}/?rd_oauth=error&message=${encodeURIComponent('Falha na conexão RD Station')}`;
    }
  }
}

// ── Finalize ─────────────────────────────────────────────────────────────────

@Injectable()
export class FinalizeRdStationUseCase {
  private readonly logger = new Logger(FinalizeRdStationUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly oauth: RdStationOAuthService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(agencyId: string, companyId: string, pendingId: string, displayName?: string) {
    const pending = await this.oauth.consumePending(pendingId);
    if (!pending) throw new BadRequestException('Sessão OAuth expirada. Conecte novamente.');
    if (pending.agencyId !== agencyId || pending.companyId !== companyId) {
      throw new ForbiddenException('Sessão OAuth não pertence a este cliente.');
    }

    const credentials = {
      accessToken: pending.accessToken,
      refreshToken: pending.refreshToken,
    };

    const credentialsEnc = encryptCredentials(credentials);

    const integration = await this.prisma.integration.create({
      data: {
        agencyId,
        companyId,
        provider: 'RD_STATION',
        displayName: displayName ?? null,
        credentialsEnc,
        externalAccount: null,
        status: 'ACTIVE',
        metadata: { oauth: 'true' } as Record<string, string>,
      },
    });

    this.auditLog.record({
      agencyId,
      action: AuditAction.OAUTH_CONNECT,
      entityType: AuditEntityType.INTEGRATION,
      entityId: integration.id,
      entityName: 'RD Station',
      description: 'RD Station conectado via OAuth',
      metadata: { provider: 'RD_STATION', step: 'finalized' },
    });

    return integration;
  }
}
