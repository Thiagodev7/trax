import { Injectable, Logger } from '@nestjs/common';

export interface MetaAdsCredentials {
  accessToken: string;
  adAccountId: string;
}

interface DailyInsightRow {
  campaign_id: string;
  campaign_name: string;
  date_start: string;
  impressions: string;
  clicks: string;
  spend: string;
  reach: string;
  actions?: Array<{ action_type: string; value: string }>;
  cost_per_action_type?: Array<{ action_type: string; value: string }>;
  ctr: string;
  cpc: string;
  cpm: string;
}

interface AdSetRow {
  id: string;
  name: string;
  daily_budget: string;
  lifetime_budget: string;
  status: string;
}

interface InsightRow {
  adset_id: string;
  adset_name: string;
  date_start: string;
  impressions: string;
  clicks: string;
  spend: string;
  reach: string;
  actions?: Array<{ action_type: string; value: string }>;
  ctr: string;
  cpc: string;
  cpm: string;
}

interface CreativeInsightRow {
  ad_id: string;
  ad_name: string;
  spend: string;
  impressions: string;
  clicks: string;
  actions?: Array<{ action_type: string; value: string }>;
}

const GRAPH_URL = 'https://graph.facebook.com/v21.0';
const MAX_GRAPH_RETRIES = 4;

export const META_LEAD_ACTION_TYPES = [
  'lead',
  'onsite_conversion.lead_grouped',
  'offsite_conversion.fb_pixel_lead',
] as const;

const LEAD_ACTION_SET = new Set<string>(META_LEAD_ACTION_TYPES);

export function extractLeads(actions?: Array<{ action_type: string; value: string }>): number {
  if (!actions) return 0;
  return actions
    .filter((a) => LEAD_ACTION_SET.has(a.action_type))
    .reduce((sum, a) => sum + Number(a.value || 0), 0);
}

interface GraphErrorBody {
  error?: { message?: string; code?: number };
}

@Injectable()
export class MetaAdsService {
  private readonly logger = new Logger(MetaAdsService.name);

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private parseGraphError(body: unknown, statusText: string): string {
    const err = body as GraphErrorBody;
    return err.error?.message ?? statusText;
  }

  private async fetchUrl(url: string, attempt = 0): Promise<Response> {
    const res = await fetch(url);
    if (res.status === 429 && attempt < MAX_GRAPH_RETRIES) {
      const delay = 1000 * (attempt + 1);
      this.logger.warn(`Meta rate limit 429 — retry em ${delay}ms (tentativa ${attempt + 1})`);
      await this.sleep(delay);
      return this.fetchUrl(url, attempt + 1);
    }
    return res;
  }

  private async fetchPagedData<T>(initialUrl: string): Promise<T[]> {
    const result: T[] = [];
    let url: string | null = initialUrl;

    while (url) {
      const res = await this.fetchUrl(url);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(`Meta API error: ${this.parseGraphError(body, res.statusText)}`);
      }
      const json = (await res.json()) as { data: T[]; paging?: { next?: string } };
      result.push(...(json.data ?? []));
      url = json.paging?.next ?? null;
    }

    return result;
  }

  private async graphGet<T>(path: string, params: Record<string, string>): Promise<T> {
    const url = new URL(`${GRAPH_URL}/${path}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await this.fetchUrl(url.toString());
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(`Meta API error: ${this.parseGraphError(body, res.statusText)}`);
    }
    return res.json() as Promise<T>;
  }

  private accountId(creds: MetaAdsCredentials): string {
    return creds.adAccountId.startsWith('act_') ? creds.adAccountId : `act_${creds.adAccountId}`;
  }

  async fetchDailyInsights(
    creds: MetaAdsCredentials,
    startDate: string,
    endDate: string,
  ): Promise<Array<Record<string, unknown>>> {
    const fields = [
      'campaign_id', 'campaign_name', 'date_start',
      'impressions', 'clicks', 'spend', 'reach',
      'actions', 'cost_per_action_type', 'ctr', 'cpc', 'cpm',
    ].join(',');

    const rows = await this.fetchPagedData<DailyInsightRow>(
      `${GRAPH_URL}/${this.accountId(creds)}/insights?` +
        new URLSearchParams({
          level: 'campaign',
          time_range: JSON.stringify({ since: startDate, until: endDate }),
          time_increment: '1',
          fields,
          limit: '500',
          access_token: creds.accessToken,
        }),
    );

    return rows.map((row) => ({
      campaign_id: row.campaign_id,
      campaign_name: row.campaign_name,
      date: row.date_start,
      impressions: Number(row.impressions || 0),
      clicks: Number(row.clicks || 0),
      spend: parseFloat(row.spend || '0'),
      reach: Number(row.reach || 0),
      leads: extractLeads(row.actions),
      ctr: parseFloat(row.ctr || '0'),
      cpc: parseFloat(row.cpc || '0'),
      cpm: parseFloat(row.cpm || '0'),
    }));
  }

  async fetchAdsets(creds: MetaAdsCredentials): Promise<Array<Record<string, unknown>>> {
    const data = await this.graphGet<{ data: AdSetRow[] }>(
      `${this.accountId(creds)}/adsets`,
      {
        fields: 'id,name,daily_budget,lifetime_budget,status',
        limit: '500',
        access_token: creds.accessToken,
      },
    );
    return data.data.map((a) => ({
      id: a.id,
      name: a.name,
      dailyBudget: Number(a.daily_budget || 0) / 100,
      lifetimeBudget: Number(a.lifetime_budget || 0) / 100,
      status: a.status,
    }));
  }

  async fetchAdsetMetrics(
    creds: MetaAdsCredentials,
    startDate: string,
    endDate: string,
  ): Promise<Array<Record<string, unknown>>> {
    const fields = [
      'adset_id', 'adset_name', 'date_start',
      'impressions', 'clicks', 'spend', 'reach',
      'actions', 'ctr', 'cpc', 'cpm',
    ].join(',');

    const rows = await this.fetchPagedData<InsightRow>(
      `${GRAPH_URL}/${this.accountId(creds)}/insights?` +
        new URLSearchParams({
          level: 'adset',
          time_range: JSON.stringify({ since: startDate, until: endDate }),
          time_increment: '1',
          fields,
          limit: '500',
          access_token: creds.accessToken,
        }),
    );

    return rows.map((row) => ({
      adset_id: row.adset_id,
      adset_name: row.adset_name,
      date: row.date_start,
      impressions: Number(row.impressions || 0),
      clicks: Number(row.clicks || 0),
      spend: parseFloat(row.spend || '0'),
      leads: extractLeads(row.actions),
      ctr: parseFloat(row.ctr || '0'),
      cpc: parseFloat(row.cpc || '0'),
      cpm: parseFloat(row.cpm || '0'),
    }));
  }

  async fetchCreatives(
    creds: MetaAdsCredentials,
    startDate: string,
    endDate: string,
  ): Promise<Array<Record<string, unknown>>> {
    // thumbnail_url não é campo válido em /insights — ver Marketing API Ad Insights
    const fields = ['ad_id', 'ad_name', 'spend', 'impressions', 'clicks', 'actions'].join(',');

    const initialUrl =
      `${GRAPH_URL}/${this.accountId(creds)}/insights?` +
      new URLSearchParams({
        level: 'ad',
        time_range: JSON.stringify({ since: startDate, until: endDate }),
        fields,
        limit: '500',
        access_token: creds.accessToken,
      });

    const result: CreativeInsightRow[] = [];
    let url: string | null = initialUrl;

    while (url) {
      try {
        const res = await this.fetchUrl(url);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const msg = this.parseGraphError(body, res.statusText);
          if (result.length > 0) {
            this.logger.warn(`Meta creatives sync parcial (${result.length} ads): ${msg}`);
            break;
          }
          throw new Error(`Meta Ads creatives error: ${msg}`);
        }
        const json = (await res.json()) as { data: CreativeInsightRow[]; paging?: { next?: string } };
        result.push(...(json.data ?? []));
        url = json.paging?.next ?? null;
      } catch (err: unknown) {
        if (result.length > 0) {
          this.logger.warn(`Meta creatives interrompido: ${(err as Error).message}`);
          break;
        }
        throw err;
      }
    }

    return result.map((row) => {
      const spend = parseFloat(row.spend || '0');
      const leads = extractLeads(row.actions);
      return {
        ad_id: row.ad_id,
        ad_name: row.ad_name,
        spend,
        impressions: Number(row.impressions || 0),
        clicks: Number(row.clicks || 0),
        leads,
        cpl: leads > 0 ? spend / leads : null,
      };
    });
  }

  async testConnection(creds: MetaAdsCredentials): Promise<{ valid: boolean; name?: string }> {
    try {
      const data = await this.graphGet<{ name: string; id: string }>(
        `${this.accountId(creds)}`,
        { fields: 'id,name', access_token: creds.accessToken },
      );
      return { valid: true, name: data.name };
    } catch {
      return { valid: false };
    }
  }
}
