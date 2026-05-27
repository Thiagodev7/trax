import { Injectable, Logger } from '@nestjs/common';

export interface GoogleAdsCredentials {
  refreshToken: string;
  customerId: string;
  loginCustomerId?: string;
}

interface GoogleAdsRow {
  campaign?: {
    id?: string;
    name?: string;
    advertisingChannelType?: string;
    advertising_channel_type?: string;
  };
  customer?: { descriptiveName?: string; descriptive_name?: string };
  segments?: { date?: string };
  metrics?: Record<string, string | number | undefined>;
}

const API_VERSION = 'v18';
const ADS_API = `https://googleads.googleapis.com/${API_VERSION}`;
const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const ADWORDS_SCOPE = 'https://www.googleapis.com/auth/adwords';

const CHANNEL_LABELS: Record<string, string> = {
  SEARCH: 'Search',
  DISPLAY: 'Display',
  PERFORMANCE_MAX: 'Performance Max',
  VIDEO: 'YouTube',
  SHOPPING: 'Shopping',
  DEMAND_GEN: 'Discovery',
  MULTI_CHANNEL: 'Multi Channel',
};

@Injectable()
export class GoogleAdsService {
  private readonly logger = new Logger(GoogleAdsService.name);

  private get clientId(): string {
    return process.env.GOOGLE_ADS_CLIENT_ID ?? '';
  }

  private get clientSecret(): string {
    return process.env.GOOGLE_ADS_CLIENT_SECRET ?? '';
  }

  get developerToken(): string {
    return process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? '';
  }

  private get defaultLoginCustomerId(): string | undefined {
    const id = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
    return id ? this.normalizeCustomerId(id) : undefined;
  }

  normalizeCustomerId(id: string): string {
    return id.replace(/\D/g, '');
  }

  formatCustomerId(id: string): string {
    const n = this.normalizeCustomerId(id);
    if (n.length !== 10) return n;
    return `${n.slice(0, 3)}-${n.slice(3, 6)}-${n.slice(6)}`;
  }

  getOAuthScope(): string {
    return ADWORDS_SCOPE;
  }

  buildAuthUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: ADWORDS_SCOPE,
      access_type: 'offline',
      prompt: 'consent',
      state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  async exchangeCodeForTokens(
    code: string,
    redirectUri: string,
  ): Promise<{ refreshToken: string; accessToken: string }> {
    const body = new URLSearchParams({
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });
    const res = await fetch(OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(`Google OAuth error: ${(json as { error_description?: string }).error_description ?? res.statusText}`);
    }
    const refreshToken = (json as { refresh_token?: string }).refresh_token;
    const accessToken = (json as { access_token: string }).access_token;
    if (!refreshToken) {
      throw new Error(
        'Google não retornou refresh_token. Revogue o acesso em myaccount.google.com/permissions e conecte novamente.',
      );
    }
    return { refreshToken, accessToken };
  }

  async getAccessToken(refreshToken: string): Promise<string> {
    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });
    const res = await fetch(OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        `Google token refresh failed: ${(json as { error_description?: string }).error_description ?? res.statusText}`,
      );
    }
    return (json as { access_token: string }).access_token;
  }

  async listAccessibleCustomers(refreshToken: string): Promise<Array<{ id: string; formatted: string }>> {
    const accessToken = await this.getAccessToken(refreshToken);
    const res = await fetch(`${ADS_API}/customers:listAccessibleCustomers`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'developer-token': this.developerToken,
      },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(`Google Ads list customers: ${JSON.stringify(json).slice(0, 300)}`);
    }
    const ids = ((json as { resourceNames?: string[] }).resourceNames) ?? [];
    return ids
      .map((r) => r.replace('customers/', ''))
      .filter(Boolean)
      .map((id) => ({ id, formatted: this.formatCustomerId(id) }));
  }

  private async search(
    customerId: string,
    query: string,
    accessToken: string,
    loginCustomerId?: string,
  ): Promise<GoogleAdsRow[]> {
    const cid = this.normalizeCustomerId(customerId);
    const login = loginCustomerId ?? this.defaultLoginCustomerId;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      'developer-token': this.developerToken,
      'Content-Type': 'application/json',
    };
    if (login) headers['login-customer-id'] = login;

    const rows: GoogleAdsRow[] = [];
    let pageToken: string | undefined;

    do {
      const res = await fetch(`${ADS_API}/customers/${cid}/googleAds:search`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, pageToken }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          (json as { error?: { message?: string } })?.error?.message ??
          JSON.stringify(json).slice(0, 400);
        throw new Error(`Google Ads query failed: ${msg}`);
      }
      const results = ((json as { results?: GoogleAdsRow[] }).results) ?? [];
      rows.push(...results);
      pageToken = (json as { nextPageToken?: string }).nextPageToken;
    } while (pageToken);

    return rows;
  }

  private parseCtr(raw: number): number {
    if (!raw) return 0;
    return raw <= 1 ? raw * 100 : raw;
  }

  /** Daily campaign metrics for sync */
  async fetchCampaignMetrics(
    creds: GoogleAdsCredentials,
    startDate: string,
    endDate: string,
  ): Promise<Array<Record<string, unknown>>> {
    const accessToken = await this.getAccessToken(creds.refreshToken);
    const loginId = creds.loginCustomerId
      ? this.normalizeCustomerId(creds.loginCustomerId)
      : this.defaultLoginCustomerId;

    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.advertising_channel_type,
        segments.date,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr,
        metrics.average_cpc,
        metrics.search_impression_share,
        metrics.historical_quality_score
      FROM campaign
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
        AND campaign.status != 'REMOVED'
    `.trim();

    const rows = await this.search(creds.customerId, query, accessToken, loginId);

    return rows.map((row) => {
      const m = row.metrics ?? {};
      const costMicros = Number(m.costMicros ?? m.cost_micros ?? 0);
      const spend = costMicros / 1_000_000;
      const clicks = Number(m.clicks ?? 0);
      const conversions = Number(m.conversions ?? 0);
      const impressions = Number(m.impressions ?? 0);
      const cpcMicros = Number(m.averageCpc ?? m.average_cpc ?? 0);
      const channel = String(
        row.campaign?.advertisingChannelType ?? row.campaign?.advertising_channel_type ?? 'UNSPECIFIED',
      );

      return {
        campaign_id: String(row.campaign?.id ?? ''),
        campaign_name: String(row.campaign?.name ?? ''),
        advertising_channel_type: channel,
        channel_label: CHANNEL_LABELS[channel] ?? channel,
        date: String(row.segments?.date ?? ''),
        impressions,
        clicks,
        spend,
        conversions,
        ctr: this.parseCtr(Number(m.ctr ?? 0)),
        cpc: cpcMicros ? cpcMicros / 1_000_000 : clicks > 0 ? spend / clicks : 0,
        search_impression_share:
          Number(m.searchImpressionShare ?? m.search_impression_share ?? 0) *
          (Number(m.searchImpressionShare ?? m.search_impression_share ?? 0) <= 1 ? 100 : 1),
        quality_score: Number(m.historicalQualityScore ?? m.historical_quality_score ?? 0) || null,
      };
    });
  }

  async testConnection(creds: GoogleAdsCredentials): Promise<{ valid: boolean; name?: string }> {
    try {
      if (!this.developerToken) {
        throw new Error('GOOGLE_ADS_DEVELOPER_TOKEN não configurado no servidor.');
      }
      const accessToken = await this.getAccessToken(creds.refreshToken);
      const loginId = creds.loginCustomerId
        ? this.normalizeCustomerId(creds.loginCustomerId)
        : this.defaultLoginCustomerId;
      const query = 'SELECT customer.descriptive_name FROM customer LIMIT 1';
      const rows = await this.search(creds.customerId, query, accessToken, loginId);
      const name =
        rows[0]?.customer?.descriptiveName ??
        rows[0]?.customer?.descriptive_name ??
        this.formatCustomerId(creds.customerId);
      return { valid: true, name: String(name) };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Google Ads test failed: ${msg}`);
      return { valid: false };
    }
  }
}
