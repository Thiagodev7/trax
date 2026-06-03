/**
 * Meta (Facebook) OAuth 2.0 Service
 *
 * Fluxo:
 *  1. buildConnectUrl  → redireciona para accounts.facebook.com
 *  2. handleCallback   → troca code por short-lived token → troca por long-lived token (60 dias)
 *  3. listAdAccounts   → GET /me/adaccounts
 *  4. Persiste sessão pendente no Redis (TTL 15 min) — consumida ao finalizar
 *
 * Scopes necessários no Meta App:
 *  - ads_read, ads_management, business_management (Meta Ads)
 *  - instagram_basic, instagram_manage_insights, pages_show_list (Instagram)
 *  - pages_read_engagement, read_insights (Facebook Page)
 */
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { RedisService } from '@/redis/redis.service';

const GRAPH_URL = 'https://graph.facebook.com/v21.0';
const OAUTH_URL = 'https://www.facebook.com/v21.0/dialog/oauth';

export interface MetaOAuthState {
  agencyId: string;
  companyId: string;
  scopes: string[];
  returnUrl?: string;
  nonce: string;
}

export interface MetaPendingOAuth {
  agencyId: string;
  companyId: string;
  longLivedToken: string;
  scopes: string[];
}

export interface MetaAdAccount {
  id: string;          // "act_XXXXXXXXXX"
  name: string;
  currency: string;
  account_status: number; // 1 = ACTIVE
}

export interface MetaPage {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: { id: string };
}

const PENDING_TTL_SECONDS = 15 * 60;
const REDIS_PREFIX = 'oauth:meta:pending:';

const META_ADS_SCOPES = ['ads_read', 'ads_management', 'business_management'];
const INSTAGRAM_SCOPES = ['instagram_basic', 'instagram_manage_insights', 'pages_show_list', 'pages_read_engagement', 'read_insights'];

@Injectable()
export class MetaOAuthService {
  private readonly logger = new Logger(MetaOAuthService.name);

  constructor(private readonly redis: RedisService) {}

  private get appId(): string {
    const id = process.env.META_APP_ID;
    if (!id) throw new BadRequestException('META_APP_ID não configurado.');
    return id;
  }

  private get appSecret(): string {
    const s = process.env.META_APP_SECRET;
    if (!s) throw new BadRequestException('META_APP_SECRET não configurado.');
    return s;
  }

  getRedirectUri(): string {
    const explicit = process.env.META_REDIRECT_URI;
    if (explicit) return explicit;
    const apiBase = process.env.API_PUBLIC_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
    return `${apiBase.replace(/\/$/, '')}/api/v1/integrations/meta/callback`;
  }

  getWebAppUrl(): string {
    return process.env.WEB_APP_URL ?? process.env.CORS_ORIGINS?.split(',')[0]?.trim() ?? 'http://localhost:3001';
  }

  private signState(payload: MetaOAuthState): string {
    const secret = process.env.JWT_SECRET ?? 'dev-secret';
    const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = createHmac('sha256', secret).update(data).digest('base64url');
    return `${data}.${sig}`;
  }

  verifyState(state: string): MetaOAuthState {
    const [data, sig] = state.split('.');
    if (!data || !sig) throw new BadRequestException('State OAuth inválido.');
    const secret = process.env.JWT_SECRET ?? 'dev-secret';
    const expected = createHmac('sha256', secret).update(data).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new BadRequestException('Assinatura OAuth Meta inválida.');
    }
    return JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as MetaOAuthState;
  }

  validateReturnUrl(returnUrl: string | undefined): string | undefined {
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

  /**
   * Gera a URL de autorização para o escopo solicitado.
   * @param scopes 'ads' (Meta Ads) | 'instagram' | 'all' (todos os canais Meta)
   */
  buildConnectUrl(agencyId: string, companyId: string, scopeGroup: 'ads' | 'instagram' | 'all', returnUrl?: string): string {
    const scopes = scopeGroup === 'ads'
      ? META_ADS_SCOPES
      : scopeGroup === 'instagram'
        ? INSTAGRAM_SCOPES
        : [...new Set([...META_ADS_SCOPES, ...INSTAGRAM_SCOPES])];

    const state = this.signState({
      agencyId, companyId, scopes,
      returnUrl: this.validateReturnUrl(returnUrl),
      nonce: randomBytes(16).toString('hex'),
    });

    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.getRedirectUri(),
      scope: scopes.join(','),
      response_type: 'code',
      state,
    });
    return `${OAUTH_URL}?${params.toString()}`;
  }

  /** Troca code por short-lived e depois por long-lived token (60 dias) */
  async exchangeCodeForLongLivedToken(code: string): Promise<string> {
    // 1. Short-lived
    const shortRes = await fetch(`${GRAPH_URL}/oauth/access_token?${new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.getRedirectUri(),
      client_secret: this.appSecret,
      code,
    })}`);
    if (!shortRes.ok) {
      const err = await shortRes.json().catch(() => ({}));
      throw new BadRequestException(`Meta OAuth falhou: ${(err as any)?.error?.message ?? shortRes.statusText}`);
    }
    const { access_token: shortToken } = (await shortRes.json()) as { access_token: string };

    // 2. Long-lived (60 dias)
    const longRes = await fetch(`${GRAPH_URL}/oauth/access_token?${new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.appId,
      client_secret: this.appSecret,
      fb_exchange_token: shortToken,
    })}`);
    if (!longRes.ok) {
      throw new BadRequestException('Falha ao obter token de longa duração do Meta.');
    }
    const { access_token: longToken } = (await longRes.json()) as { access_token: string };
    return longToken;
  }

  async listAdAccounts(accessToken: string): Promise<MetaAdAccount[]> {
    const res = await fetch(
      `${GRAPH_URL}/me/adaccounts?fields=id,name,currency,account_status&limit=50&access_token=${accessToken}`,
    );
    if (!res.ok) throw new BadRequestException('Falha ao listar ad accounts do Meta.');
    const data = (await res.json()) as { data: MetaAdAccount[] };
    return (data.data ?? []).filter((a) => a.account_status === 1);
  }

  async listPages(accessToken: string): Promise<MetaPage[]> {
    const res = await fetch(
      `${GRAPH_URL}/me/accounts?fields=id,name,access_token,instagram_business_account&limit=50&access_token=${accessToken}`,
    );
    if (!res.ok) throw new BadRequestException('Falha ao listar páginas do Meta.');
    const data = (await res.json()) as { data: MetaPage[] };
    return data.data ?? [];
  }

  async testConnection(accessToken: string): Promise<{ valid: boolean; name?: string }> {
    try {
      const res = await fetch(`${GRAPH_URL}/me?fields=name&access_token=${accessToken}`);
      if (!res.ok) return { valid: false };
      const data = (await res.json()) as { name?: string };
      return { valid: true, name: data.name };
    } catch {
      return { valid: false };
    }
  }

  // ── Pending store (Redis) ──────────────────────────────────────────────────

  createPendingId(): string {
    return randomBytes(24).toString('hex');
  }

  async storePending(id: string, data: MetaPendingOAuth): Promise<void> {
    const value = JSON.stringify(data);
    if (this.redis.isConnected) {
      await this.redis.set(`${REDIS_PREFIX}${id}`, value, PENDING_TTL_SECONDS);
    } else {
      this.logger.warn('Redis indisponível — Meta OAuth pending em memória');
      memFallback.set(id, { ...data, expiresAt: Date.now() + PENDING_TTL_SECONDS * 1000 });
    }
  }

  async getPending(id: string): Promise<MetaPendingOAuth | null> {
    if (this.redis.isConnected) {
      const raw = await this.redis.get(`${REDIS_PREFIX}${id}`);
      return raw ? (JSON.parse(raw) as MetaPendingOAuth) : null;
    }
    const e = memFallback.get(id);
    if (!e || e.expiresAt < Date.now()) { memFallback.delete(id); return null; }
    return { agencyId: e.agencyId, companyId: e.companyId, longLivedToken: e.longLivedToken, scopes: e.scopes };
  }

  async consumePending(id: string): Promise<MetaPendingOAuth | null> {
    const entry = await this.getPending(id);
    if (entry) {
      if (this.redis.isConnected) await this.redis.del(`${REDIS_PREFIX}${id}`);
      else memFallback.delete(id);
    }
    return entry;
  }

  async handleCallback(code: string, state: string): Promise<{ redirectUrl: string; pendingId: string }> {
    const payload = this.verifyState(state);
    const longLivedToken = await this.exchangeCodeForLongLivedToken(code);
    const pendingId = this.createPendingId();
    await this.storePending(pendingId, {
      agencyId: payload.agencyId,
      companyId: payload.companyId,
      longLivedToken,
      scopes: payload.scopes,
    });
    const base = payload.returnUrl ?? `${this.getWebAppUrl()}/companies/${payload.companyId}/integrations`;
    const sep = base.includes('?') ? '&' : '?';
    return {
      pendingId,
      redirectUrl: `${base}${sep}meta_oauth=pending&pendingId=${pendingId}`,
    };
  }
}

// In-memory fallback
interface MemEntry extends MetaPendingOAuth { expiresAt: number }
const memFallback = new Map<string, MemEntry>();
