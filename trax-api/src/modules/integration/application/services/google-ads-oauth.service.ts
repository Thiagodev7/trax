import { Injectable, BadRequestException } from '@nestjs/common';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { GoogleAdsService } from './google-ads.service';

export interface OAuthStatePayload {
  agencyId: string;
  clientId: string;
  returnUrl?: string;
  nonce: string;
}

interface PendingOAuth {
  agencyId: string;
  clientId: string;
  refreshToken: string;
  expiresAt: number;
}

const pendingStore = new Map<string, PendingOAuth>();
const PENDING_TTL_MS = 15 * 60 * 1000;

@Injectable()
export class GoogleAdsOAuthService {
  constructor(private readonly googleAds: GoogleAdsService) {}

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

  buildConnectUrl(agencyId: string, clientId: string, returnUrl?: string): string {
    if (!process.env.GOOGLE_ADS_CLIENT_ID || !process.env.GOOGLE_ADS_CLIENT_SECRET) {
      throw new BadRequestException('Google Ads OAuth não configurado no servidor (CLIENT_ID/SECRET).');
    }
    const state = this.signState({
      agencyId,
      clientId,
      returnUrl,
      nonce: randomBytes(16).toString('hex'),
    });
    return this.googleAds.buildAuthUrl(this.getRedirectUri(), state);
  }

  createPendingId(): string {
    return randomBytes(24).toString('hex');
  }

  storePending(pendingId: string, data: Omit<PendingOAuth, 'expiresAt'>): void {
    this.pruneExpired();
    pendingStore.set(pendingId, { ...data, expiresAt: Date.now() + PENDING_TTL_MS });
  }

  getPending(pendingId: string): PendingOAuth | null {
    this.pruneExpired();
    const entry = pendingStore.get(pendingId);
    if (!entry || entry.expiresAt < Date.now()) {
      pendingStore.delete(pendingId);
      return null;
    }
    return entry;
  }

  consumePending(pendingId: string): PendingOAuth | null {
    const entry = this.getPending(pendingId);
    if (entry) pendingStore.delete(pendingId);
    return entry;
  }

  private pruneExpired(): void {
    const now = Date.now();
    for (const [k, v] of pendingStore) {
      if (v.expiresAt < now) pendingStore.delete(k);
    }
  }

  async handleCallback(code: string, state: string): Promise<{ redirectUrl: string }> {
    const payload = this.verifyState(state);
    const { refreshToken } = await this.googleAds.exchangeCodeForTokens(code, this.getRedirectUri());
    const pendingId = this.createPendingId();
    this.storePending(pendingId, {
      agencyId: payload.agencyId,
      clientId: payload.clientId,
      refreshToken,
    });

    const base = payload.returnUrl ?? `${this.getWebAppUrl()}/clients/${payload.clientId}/integrations`;
    const sep = base.includes('?') ? '&' : '?';
    const redirectUrl = `${base}${sep}google_oauth=pending&pendingId=${pendingId}`;
    return { redirectUrl };
  }
}
