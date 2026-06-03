/**
 * RD Station Marketing OAuth 2.0 Service
 *
 * Docs: https://developers.rdstation.com/reference/autenticacao
 *
 * Fluxo:
 *  1. buildConnectUrl → redireciona para api.rd.services/auth/dialog
 *  2. handleCallback  → POST /auth/token (code, client_id, client_secret)
 *  3. Tokens ficam salvos via encryptCredentials (access_token + refresh_token)
 *  4. refreshAccessToken → POST /auth/token com grant_type=refresh_token
 */
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { RedisService } from '@/redis/redis.service';

const RD_AUTH_URL = 'https://api.rd.services/auth/dialog';
const RD_TOKEN_URL = 'https://api.rd.services/auth/token';
/** Troca do authorization code — exige query token_by=code (docs RD) */
const RD_TOKEN_URL_BY_CODE = `${RD_TOKEN_URL}?token_by=code`;
const RD_ACCOUNT_INFO_PATH = '/marketing/account_info';

const PENDING_TTL = 15 * 60;
const REDIS_PREFIX = 'oauth:rds:pending:';

export interface RdsPendingOAuth {
  agencyId: string;
  companyId: string;
  accessToken: string;
  refreshToken: string;
  returnUrl?: string;
}

export interface RdsTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in?: number;
}

export interface RdsAccountInfo {
  name: string;
  email: string;
}

@Injectable()
export class RdStationOAuthService {
  private readonly logger = new Logger(RdStationOAuthService.name);

  constructor(private readonly redis: RedisService) {}

  private get clientId(): string {
    const id = process.env.RD_STATION_CLIENT_ID;
    if (!id) throw new BadRequestException('RD_STATION_CLIENT_ID não configurado.');
    return id;
  }

  private get clientSecret(): string {
    const s = process.env.RD_STATION_CLIENT_SECRET;
    if (!s) throw new BadRequestException('RD_STATION_CLIENT_SECRET não configurado.');
    return s;
  }

  getRedirectUri(): string {
    const explicit = process.env.RD_STATION_REDIRECT_URI;
    if (explicit) return explicit;
    const apiBase = process.env.API_PUBLIC_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
    return `${apiBase.replace(/\/$/, '')}/api/v1/integrations/rd-station/callback`;
  }

  getWebAppUrl(): string {
    return process.env.WEB_APP_URL ?? process.env.CORS_ORIGINS?.split(',')[0]?.trim() ?? 'http://localhost:3001';
  }

  private signState(payload: { agencyId: string; companyId: string; returnUrl?: string; nonce: string }): string {
    const secret = process.env.JWT_SECRET ?? 'dev-secret';
    const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = createHmac('sha256', secret).update(data).digest('base64url');
    return `${data}.${sig}`;
  }

  verifyState(state: string): { agencyId: string; companyId: string; returnUrl?: string } {
    const [data, sig] = state.split('.');
    if (!data || !sig) throw new BadRequestException('State OAuth inválido.');
    const secret = process.env.JWT_SECRET ?? 'dev-secret';
    const expected = createHmac('sha256', secret).update(data).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new BadRequestException('Assinatura OAuth RD Station inválida.');
    }
    return JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
  }

  validateReturnUrl(returnUrl?: string): string | undefined {
    if (!returnUrl) return undefined;
    try {
      const parsed = new URL(returnUrl);
      const base = process.env.TRAX_BASE_DOMAIN ?? 'traxsolucoes.com.br';
      const isLocal = parsed.hostname === 'localhost' || parsed.hostname.endsWith('.localhost');
      const isProd = base !== 'localhost' && parsed.hostname.endsWith(`.${base}`);
      if (!isLocal && !isProd) return undefined;
      if (base !== 'localhost' && parsed.protocol !== 'https:') return undefined;
      return returnUrl;
    } catch {
      return undefined;
    }
  }

  buildConnectUrl(agencyId: string, companyId: string, returnUrl?: string): string {
    const state = this.signState({
      agencyId, companyId,
      returnUrl: this.validateReturnUrl(returnUrl),
      nonce: randomBytes(16).toString('hex'),
    });
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.getRedirectUri(),
      response_type: 'code',
      state,
    });
    return `${RD_AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<RdsTokenResponse> {
    const res = await fetch(RD_TOKEN_URL_BY_CODE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new BadRequestException(`RD Station OAuth falhou: ${(err as any)?.error_description ?? res.statusText}`);
    }
    return res.json() as Promise<RdsTokenResponse>;
  }

  async refreshAccessToken(refreshToken: string): Promise<RdsTokenResponse> {
    const res = await fetch(RD_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
      }),
    });
    if (!res.ok) throw new BadRequestException('Falha ao renovar token RD Station.');
    return res.json() as Promise<RdsTokenResponse>;
  }

  async getAccountInfo(accessToken: string): Promise<RdsAccountInfo> {
    const res = await fetch(`https://api.rd.services${RD_ACCOUNT_INFO_PATH}`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    });
    if (!res.ok) throw new BadRequestException('Falha ao obter informações da conta RD Station.');
    const data = (await res.json()) as { name?: string; email?: string };
    return { name: data.name ?? 'RD Station', email: data.email ?? '' };
  }

  async testConnection(accessToken: string): Promise<{ valid: boolean; name?: string }> {
    try {
      const info = await this.getAccountInfo(accessToken);
      return { valid: true, name: info.name };
    } catch {
      return { valid: false };
    }
  }

  // ── Pending store (Redis) ──────────────────────────────────────────────────

  async storePending(id: string, data: RdsPendingOAuth): Promise<void> {
    const value = JSON.stringify(data);
    if (this.redis.isConnected) {
      await this.redis.set(`${REDIS_PREFIX}${id}`, value, PENDING_TTL);
    } else {
      this.logger.warn('Redis indisponível — RD Station OAuth pending em memória');
      rdsMemFallback.set(id, { ...data, expiresAt: Date.now() + PENDING_TTL * 1000 });
    }
  }

  async getPending(id: string): Promise<RdsPendingOAuth | null> {
    if (this.redis.isConnected) {
      const raw = await this.redis.get(`${REDIS_PREFIX}${id}`);
      return raw ? (JSON.parse(raw) as RdsPendingOAuth) : null;
    }
    const e = rdsMemFallback.get(id);
    if (!e || e.expiresAt < Date.now()) { rdsMemFallback.delete(id); return null; }
    return { agencyId: e.agencyId, companyId: e.companyId, accessToken: e.accessToken, refreshToken: e.refreshToken };
  }

  async consumePending(id: string): Promise<RdsPendingOAuth | null> {
    const entry = await this.getPending(id);
    if (entry) {
      if (this.redis.isConnected) await this.redis.del(`${REDIS_PREFIX}${id}`);
      else rdsMemFallback.delete(id);
    }
    return entry;
  }

  async handleCallback(code: string, state: string): Promise<{ redirectUrl: string; pendingId: string }> {
    const payload = this.verifyState(state);
    const tokens = await this.exchangeCodeForTokens(code);
    const pendingId = randomBytes(24).toString('hex');
    await this.storePending(pendingId, {
      agencyId: payload.agencyId,
      companyId: payload.companyId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    });
    const base = payload.returnUrl ?? `${this.getWebAppUrl()}/companies/${payload.companyId}/integrations`;
    const sep = base.includes('?') ? '&' : '?';
    return {
      pendingId,
      redirectUrl: `${base}${sep}rd_oauth=pending&pendingId=${pendingId}`,
    };
  }
}

interface RdsMemEntry extends RdsPendingOAuth { expiresAt: number }
const rdsMemFallback = new Map<string, RdsMemEntry>();
