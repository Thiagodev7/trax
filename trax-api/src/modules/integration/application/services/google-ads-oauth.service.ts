import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { GoogleAdsService } from './google-ads.service';
import { RedisService } from '@/redis/redis.service';

export interface OAuthStatePayload {
  agencyId: string;
  companyId: string;
  returnUrl?: string;
  nonce: string;
}

export interface PendingOAuth {
  agencyId: string;
  companyId: string;
  refreshToken: string;
}

const PENDING_TTL_SECONDS = 15 * 60; // 15 minutos
const REDIS_PREFIX = 'oauth:google-ads:pending:';

@Injectable()
export class GoogleAdsOAuthService {
  private readonly logger = new Logger(GoogleAdsOAuthService.name);

  constructor(
    private readonly googleAds: GoogleAdsService,
    private readonly redis: RedisService,
  ) {}

  getRedirectUri(): string {
    const explicit = process.env.GOOGLE_ADS_REDIRECT_URI;
    if (explicit) return explicit;
    const apiBase = process.env.API_PUBLIC_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
    return `${apiBase.replace(/\/$/, '')}/api/v1/integrations/google-ads/callback`;
  }

  getWebAppUrl(): string {
    return (
      process.env.WEB_APP_URL ??
      process.env.CORS_ORIGINS?.split(',')[0]?.trim() ??
      'http://localhost:3001'
    );
  }

  signState(payload: OAuthStatePayload): string {
    const secret = process.env.JWT_SECRET ?? process.env.JWT_REFRESH_SECRET ?? 'dev-secret';
    const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = createHmac('sha256', secret).update(data).digest('base64url');
    return `${data}.${sig}`;
  }

  verifyState(state: string): OAuthStatePayload {
    const [data, sig] = state.split('.');
    if (!data || !sig) throw new BadRequestException('State OAuth inválido.');
    const secret = process.env.JWT_SECRET ?? process.env.JWT_REFRESH_SECRET ?? 'dev-secret';
    const expected = createHmac('sha256', secret).update(data).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new BadRequestException('Assinatura OAuth inválida.');
    }
    return JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as OAuthStatePayload;
  }

  /**
   * Valida que o returnUrl pertence ao domínio do tenant para evitar open redirect.
   * Em desenvolvimento qualquer localhost é aceito.
   */
  validateReturnUrl(returnUrl: string | undefined, agencySlug?: string): string | undefined {
    if (!returnUrl) return undefined;
    try {
      const parsed = new URL(returnUrl);
      const baseDomain = process.env.TRAX_BASE_DOMAIN ?? process.env.NEXT_PUBLIC_TRAX_BASE_DOMAIN ?? 'traxsolucoes.com.br';
      const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname.endsWith('.localhost');
      const isProductionTenant = baseDomain !== 'localhost' && parsed.hostname.endsWith(`.${baseDomain}`);
      const isAdminPanel = parsed.hostname === `admin.${baseDomain}` || parsed.hostname === 'admin.localhost';

      if (!isLocalhost && !isProductionTenant) {
        this.logger.warn(`returnUrl bloqueado (domínio não confiável): ${returnUrl}`);
        return undefined;
      }
      if (isAdminPanel) {
        this.logger.warn(`returnUrl bloqueado (admin domain não permitido no OAuth de agência): ${returnUrl}`);
        return undefined;
      }
      // Só permite https em produção
      if (baseDomain !== 'localhost' && parsed.protocol !== 'https:') {
        return undefined;
      }
      return returnUrl;
    } catch {
      return undefined;
    }
  }

  buildConnectUrl(agencyId: string, companyId: string, returnUrl?: string): string {
    if (!process.env.GOOGLE_ADS_CLIENT_ID || !process.env.GOOGLE_ADS_CLIENT_SECRET) {
      throw new BadRequestException('Google Ads OAuth não configurado no servidor (CLIENT_ID/SECRET).');
    }
    const safeReturnUrl = this.validateReturnUrl(returnUrl);
    const state = this.signState({
      agencyId,
      companyId,
      returnUrl: safeReturnUrl,
      nonce: randomBytes(16).toString('hex'),
    });
    return this.googleAds.buildAuthUrl(this.getRedirectUri(), state);
  }

  createPendingId(): string {
    return randomBytes(24).toString('hex');
  }

  /** Armazena sessão OAuth pendente no Redis (com fallback em memória se indisponível) */
  async storePending(pendingId: string, data: PendingOAuth): Promise<void> {
    const key = `${REDIS_PREFIX}${pendingId}`;
    const value = JSON.stringify(data);

    if (this.redis.isConnected) {
      await this.redis.set(key, value, PENDING_TTL_SECONDS);
    } else {
      // Fallback em memória (single-instance dev)
      this.logger.warn('Redis indisponível — OAuth pending em memória (não adequado para produção multi-instância)');
      memoryFallback.set(pendingId, { ...data, expiresAt: Date.now() + PENDING_TTL_SECONDS * 1000 });
    }
  }

  /** Lê sessão OAuth pendente sem consumir */
  async getPending(pendingId: string): Promise<PendingOAuth | null> {
    const key = `${REDIS_PREFIX}${pendingId}`;

    if (this.redis.isConnected) {
      const raw = await this.redis.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as PendingOAuth;
    }

    // Fallback memória
    const entry = memoryFallback.get(pendingId);
    if (!entry || entry.expiresAt < Date.now()) {
      memoryFallback.delete(pendingId);
      return null;
    }
    return { agencyId: entry.agencyId, companyId: entry.companyId, refreshToken: entry.refreshToken };
  }

  /** Lê e deleta a sessão (uso único) */
  async consumePending(pendingId: string): Promise<PendingOAuth | null> {
    const entry = await this.getPending(pendingId);
    if (entry) {
      if (this.redis.isConnected) {
        await this.redis.del(`${REDIS_PREFIX}${pendingId}`);
      } else {
        memoryFallback.delete(pendingId);
      }
    }
    return entry;
  }

  async handleCallback(code: string, state: string): Promise<{ redirectUrl: string }> {
    const payload = this.verifyState(state);
    const { refreshToken } = await this.googleAds.exchangeCodeForTokens(code, this.getRedirectUri());
    const pendingId = this.createPendingId();
    await this.storePending(pendingId, {
      agencyId: payload.agencyId,
      companyId: payload.companyId,
      refreshToken,
    });

    const safePath = payload.returnUrl ?? `${this.getWebAppUrl()}/companies/${payload.companyId}/integrations`;
    const sep = safePath.includes('?') ? '&' : '?';
    const redirectUrl = `${safePath}${sep}google_oauth=pending&pendingId=${pendingId}`;
    return { redirectUrl };
  }
}

// Fallback em memória (apenas para ambientes sem Redis)
interface MemoryPendingOAuth extends PendingOAuth {
  expiresAt: number;
}
const memoryFallback = new Map<string, MemoryPendingOAuth>();
