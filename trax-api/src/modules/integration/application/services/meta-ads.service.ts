import { Injectable, Logger } from '@nestjs/common';

interface MetaCredentials {
  accessToken: string;
  adAccountId: string; // "act_XXXX"
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
  thumbnail_url?: string;
  object_story_spec?: unknown;
}

const GRAPH_URL = 'https://graph.facebook.com/v21.0';
const LEAD_ACTIONS = ['lead', 'onsite_conversion.lead_grouped', 'offsite_conversion.fb_pixel_lead'];

function extractLeads(actions?: Array<{ action_type: string; value: string }>): number {
  if (!actions) return 0;
  return actions
    .filter((a) => LEAD_ACTIONS.includes(a.action_type))
    .reduce((sum, a) => sum + Number(a.value || 0), 0);
}

@Injectable()
export class MetaAdsService {
  private readonly logger = new Logger(MetaAdsService.name);

  private async graphGet<T>(path: string, params: Record<string, string>): Promise<T> {
    const url = new URL(`${GRAPH_URL}/${path}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString());
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
      throw new Error(`Meta API error: ${err?.error?.message ?? res.statusText}`);
    }
    return res.json() as Promise<T>;
  }

  /** Fetch daily insights at campaign level for a date range */
  async fetchDailyInsights(
    creds: MetaCredentials,
    startDate: string,
    endDate: string,
  ): Promise<Array<Record<string, unknown>>> {
    const fields = [
      'campaign_id', 'campaign_name', 'date_start',
      'impressions', 'clicks', 'spend', 'reach',
      'actions', 'cost_per_action_type', 'ctr', 'cpc', 'cpm',
    ].join(',');

    const result: DailyInsightRow[] = [];
    const accountId = creds.adAccountId.startsWith('act_') ? creds.adAccountId : `act_${creds.adAccountId}`;
    let url: string | null =
      `${GRAPH_URL}/${accountId}/insights?` +
      new URLSearchParams({
        level: 'campaign',
        time_range: JSON.stringify({ since: startDate, until: endDate }),
        time_increment: '1',
        fields,
        limit: '500',
        access_token: creds.accessToken,
      });

    while (url) {
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Meta Ads insights error: ${(err as any)?.error?.message ?? res.statusText}`);
      }
      const json = await res.json() as { data: DailyInsightRow[]; paging?: { next?: string } };
      result.push(...json.data);
      url = json.paging?.next ?? null;
    }

    return result.map((row) => ({
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

  /** Fetch all adsets for the account */
  async fetchAdsets(creds: MetaCredentials): Promise<Array<Record<string, unknown>>> {
    const accountId = creds.adAccountId.startsWith('act_') ? creds.adAccountId : `act_${creds.adAccountId}`;
    const data = await this.graphGet<{ data: AdSetRow[] }>(
      `${accountId}/adsets`,
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

  /** Fetch adset-level insights over multiple windows (7d, 14d, 30d, this_month) */
  async fetchAdsetMetrics(
    creds: MetaCredentials,
    startDate: string,
    endDate: string,
  ): Promise<Array<Record<string, unknown>>> {
    const fields = [
      'adset_id', 'adset_name', 'date_start',
      'impressions', 'clicks', 'spend', 'reach',
      'actions', 'ctr', 'cpc', 'cpm',
    ].join(',');

    const result: InsightRow[] = [];
    const accountId = creds.adAccountId.startsWith('act_') ? creds.adAccountId : `act_${creds.adAccountId}`;
    let url: string | null =
      `${GRAPH_URL}/${accountId}/insights?` +
      new URLSearchParams({
        level: 'adset',
        time_range: JSON.stringify({ since: startDate, until: endDate }),
        time_increment: '1',
        fields,
        limit: '500',
        access_token: creds.accessToken,
      });

    while (url) {
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Meta Ads adset error: ${(err as any)?.error?.message ?? res.statusText}`);
      }
      const json = await res.json() as { data: InsightRow[]; paging?: { next?: string } };
      result.push(...json.data);
      url = json.paging?.next ?? null;
    }

    return result.map((row) => ({
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

  /** Fetch ad-level creative insights */
  async fetchCreatives(
    creds: MetaCredentials,
    startDate: string,
    endDate: string,
  ): Promise<Array<Record<string, unknown>>> {
    const fields = [
      'ad_id', 'ad_name', 'spend', 'impressions', 'clicks', 'actions',
      'thumbnail_url',
    ].join(',');

    const result: CreativeInsightRow[] = [];
    const accountId = creds.adAccountId.startsWith('act_') ? creds.adAccountId : `act_${creds.adAccountId}`;
    let url: string | null =
      `${GRAPH_URL}/${accountId}/insights?` +
      new URLSearchParams({
        level: 'ad',
        time_range: JSON.stringify({ since: startDate, until: endDate }),
        fields,
        limit: '500',
        access_token: creds.accessToken,
      });

    while (url) {
      const res = await fetch(url);
      if (!res.ok) break;
      const json = await res.json() as { data: CreativeInsightRow[]; paging?: { next?: string } };
      result.push(...json.data);
      url = json.paging?.next ?? null;
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
        thumbnailUrl: row.thumbnail_url,
      };
    });
  }

  /** Validate credentials by fetching basic account info */
  async testConnection(creds: MetaCredentials): Promise<{ valid: boolean; name?: string }> {
    try {
      const accountId = creds.adAccountId.startsWith('act_') ? creds.adAccountId : `act_${creds.adAccountId}`;
      const data = await this.graphGet<{ name: string; id: string }>(
        `${accountId}`,
        { fields: 'id,name', access_token: creds.accessToken },
      );
      return { valid: true, name: data.name };
    } catch {
      return { valid: false };
    }
  }
}
