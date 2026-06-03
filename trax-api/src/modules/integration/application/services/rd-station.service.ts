/**
 * RD Station Marketing — Data Sync Service
 * Docs: https://developers.rdstation.com/reference/
 */
import { Injectable, Logger } from '@nestjs/common';

export interface RdsCredentials {
  accessToken: string;
  refreshToken: string;
}

interface RdsContactListItem {
  uuid: string;
  name?: string;
  email?: string;
  created_at: string;
  last_conversion_date?: string;
  lifecycle_stage?: string;
  conversion_identifier?: string;
  tags?: string[];
}

interface RdsContactDetail {
  uuid: string;
  name?: string;
  email?: string;
  created_at?: string;
  lifecycle_stage?: string;
  conversion_identifier?: string;
  tags?: string[];
}

interface RdsContactsResponse {
  contacts: RdsContactListItem[];
  total?: number;
}

const RDS_API = 'https://api.rd.services';
const RDS_ACCOUNT_INFO_PATH = '/marketing/account_info';
const PAGE_SIZE = 100;
/** RD limita ~120 req/min — sequencial + pausa; interrompe se 429 persistir */
const DETAIL_DELAY_MS = 450;
const MAX_DETAIL_FETCH = 40;
const DETAIL_429_MAX_RETRIES = 3;
const DETAIL_429_BASE_MS = 3000;
const DETAIL_COOLDOWN_MS = 10_000;
const DETAIL_RATE_LIMIT_ABORT = 2;

export function buildRdPeriodKey(startDate: string, endDate: string): string {
  return `${startDate}_${endDate}`;
}

export function classifyRdStage(stage: string | undefined): 'customer' | 'qualifiedLead' | 'lead' {
  const s = (stage ?? '').toLowerCase().trim();
  if (s.includes('client') || s.includes('cliente') || s.includes('customer')) {
    return 'customer';
  }
  if (s.includes('qualified') || s.includes('qualificado')) {
    return 'qualifiedLead';
  }
  return 'lead';
}

export interface RdOfficialFunnelSnapshot {
  referenceDay: string;
  visitors: number;
  leads: number;
  qualified: number;
  opportunities: number;
  sales: number;
}

export interface RdOfficialFunnelResult {
  available: boolean;
  advancedRequired?: boolean;
  unauthorized?: boolean;
  queryStart?: string;
  queryEnd?: string;
  snapshot?: RdOfficialFunnelSnapshot;
}

interface RdAnalyticsFunnelRow {
  reference_day: string;
  visitors_count: number;
  contacts_count: number;
  qualified_contacts_count: number;
  opportunities_count: number;
  sales_count: number;
}

interface RdAnalyticsFunnelResponse {
  query_date?: { start_date: string; end_date: string };
  funnel?: RdAnalyticsFunnelRow[];
}

export interface RdsDailyBreakdown {
  leads: number;
  qualifiedLeads: number;
  customers: number;
  total: number;
}

export interface RdsSyncResult {
  dailyBreakdown: Record<string, RdsDailyBreakdown>;
  conversionsByDay: Record<string, number>;
  topForms: Array<{ name: string; conversions: number }>;
  summary: {
    total: number;
    leads: number;
    qualifiedLeads: number;
    customers: number;
    qualificationRate: number;
    conversionRate: number;
    enrichedDetailCount: number;
    segmentationId: number | null;
  };
}

@Injectable()
export class RdStationService {
  private readonly logger = new Logger(RdStationService.name);

  async rdsGet<T>(creds: RdsCredentials, path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${RDS_API}${path}`);
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${creds.accessToken}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      const rawBody = await res.text().catch(() => '');
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(rawBody) as Record<string, unknown>;
      } catch {
        /* ignore */
      }
      const rdErrors = (parsed as { errors?: { error_type?: string; error_message?: string } }).errors;
      const rdErrorType = rdErrors?.error_type;
      const rdErrorMessage = rdErrors?.error_message ?? '';
      const accessDenied =
        rdErrorType === 'FORBIDDEN' ||
        /do not have access/i.test(rdErrorMessage);

      const log =
        res.status === 429 || accessDenied
          ? this.logger.warn.bind(this.logger)
          : this.logger.error.bind(this.logger);
      log(`RD Station ${res.status} em ${path} → ${rawBody.slice(0, 200)}`);

      const msg =
        rdErrorMessage ||
        (parsed as { error?: { message?: string }; message?: string }).error?.message ||
        (parsed as { error_description?: string }).error_description ||
        (parsed as { message?: string }).message ||
        res.statusText;
      const error = new Error(`RD Station API error ${res.status}: ${msg}`) as Error & {
        status: number;
        rdErrorType?: string;
        accessDenied?: boolean;
      };
      error.status = res.status;
      error.rdErrorType = rdErrorType;
      error.accessDenied = accessDenied;
      throw error;
    }
    return res.json() as Promise<T>;
  }

  async fetchDefaultSegmentationId(creds: RdsCredentials): Promise<number | null> {
    try {
      interface Seg { id: number; name: string; standard: boolean }
      const data = await this.rdsGet<{ segmentations: Seg[] }>(creds, '/platform/segmentations');
      const segs = data.segmentations ?? [];
      return (segs.find((s) => s.standard) ?? segs[0])?.id ?? null;
    } catch {
      return null;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async fetchContactDetail(
    creds: RdsCredentials,
    uuid: string,
  ): Promise<{ detail: RdsContactDetail | null; rateLimited: boolean }> {
    for (let attempt = 0; attempt <= DETAIL_429_MAX_RETRIES; attempt++) {
      try {
        const detail = await this.rdsGet<RdsContactDetail>(creds, `/platform/contacts/${uuid}`);
        return { detail, rateLimited: false };
      } catch (err: unknown) {
        const status = (err as { status?: number })?.status;
        if (status === 429 && attempt < DETAIL_429_MAX_RETRIES) {
          const wait = DETAIL_429_BASE_MS * Math.pow(2, attempt);
          await this.sleep(wait);
          continue;
        }
        return { detail: null, rateLimited: status === 429 };
      }
    }
    return { detail: null, rateLimited: true };
  }

  private needsDetailEnrichment(contact: RdsContactListItem): boolean {
    return !contact.lifecycle_stage?.trim();
  }

  private async enrichContacts(
    creds: RdsCredentials,
    contacts: RdsContactListItem[],
  ): Promise<{ contacts: RdsContactListItem[]; enrichedCount: number }> {
    const toEnrich = contacts.filter((c) => this.needsDetailEnrichment(c)).slice(0, MAX_DETAIL_FETCH);
    const enriched: RdsContactListItem[] = [...contacts];
    let enrichedCount = 0;

    if (toEnrich.length === 0) {
      return { contacts: enriched, enrichedCount: 0 };
    }

    this.logger.log(
      `RD enrich: ${toEnrich.length} contatos sem lifecycle (máx ${MAX_DETAIL_FETCH}, sequencial)`,
    );

    let rateLimitStreak = 0;
    for (const contact of toEnrich) {
      const { detail, rateLimited } = await this.fetchContactDetail(creds, contact.uuid);

      if (rateLimited) {
        rateLimitStreak++;
        if (rateLimitStreak >= DETAIL_RATE_LIMIT_ABORT) {
          this.logger.warn(
            `RD enrich interrompido por rate limit (${enrichedCount} detalhes obtidos). Próximo sync continua.`,
          );
          break;
        }
        await this.sleep(DETAIL_COOLDOWN_MS);
        continue;
      }

      rateLimitStreak = 0;
      if (!detail) {
        await this.sleep(DETAIL_DELAY_MS);
        continue;
      }

      const idx = enriched.findIndex((x) => x.uuid === contact.uuid);
      if (idx >= 0) {
        enriched[idx] = {
          ...enriched[idx],
          lifecycle_stage: detail.lifecycle_stage ?? enriched[idx].lifecycle_stage,
          conversion_identifier:
            detail.conversion_identifier ?? enriched[idx].conversion_identifier,
          tags: detail.tags ?? enriched[idx].tags,
        };
        enrichedCount++;
      }

      await this.sleep(DETAIL_DELAY_MS);
    }

    return { contacts: enriched, enrichedCount };
  }

  private async fetchAllContacts(
    creds: RdsCredentials,
    segmentationId: number,
    startDate: string,
    endDate: string,
  ): Promise<RdsContactListItem[]> {
    const all: RdsContactListItem[] = [];
    let page = 1;
    const MAX_PAGES = 30;
    const startTs = new Date(startDate).getTime();
    const endTs = new Date(endDate).getTime() + 86400_000;

    while (page <= MAX_PAGES) {
      const params: Record<string, string> = { page_size: String(PAGE_SIZE) };
      if (page > 1) params.page = String(page);

      const data = await this.rdsGet<RdsContactsResponse>(
        creds,
        `/platform/segmentations/${segmentationId}/contacts`,
        params,
      );
      const contacts = data.contacts ?? [];
      let inRangeOnPage = 0;

      for (const contact of contacts) {
        const ts = contact.created_at ? new Date(contact.created_at).getTime() : 0;
        if (ts >= startTs && ts <= endTs) {
          all.push(contact);
          inRangeOnPage++;
        }
      }

      if (contacts.length < PAGE_SIZE) break;
      if (inRangeOnPage === 0 && contacts.length > 0) {
        const oldest = contacts[contacts.length - 1]?.created_at;
        if (oldest && new Date(oldest).getTime() < startTs) break;
      }
      page++;
    }

    return all;
  }

  async syncData(
    creds: RdsCredentials,
    startDate: string,
    endDate: string,
    cachedSegmentationId?: number | null,
  ): Promise<RdsSyncResult> {
    let segmentationId = cachedSegmentationId ?? null;
    if (!segmentationId) {
      segmentationId = await this.fetchDefaultSegmentationId(creds);
    }

    let listContacts: RdsContactListItem[] = [];
    if (segmentationId) {
      try {
        listContacts = await this.fetchAllContacts(creds, segmentationId, startDate, endDate);
      } catch (err: unknown) {
        const status = (err as { status?: number })?.status;
        this.logger.warn(
          `RD Station segmentação ${segmentationId} falhou (${status ?? 'error'}). Sync com dados vazios.`,
        );
      }
    }

    const { contacts, enrichedCount } = await this.enrichContacts(creds, listContacts);

    const dailyBreakdown: Record<string, RdsDailyBreakdown> = {};
    const conversionsByDay: Record<string, number> = {};
    const formCount: Record<string, number> = {};

    const startTs = new Date(startDate).getTime();
    const endTs = new Date(endDate).getTime() + 86400_000;

    let totalLeads = 0;
    let totalQualified = 0;
    let totalCustomers = 0;

    for (const contact of contacts) {
      const createdDay = contact.created_at?.slice(0, 10);
      if (createdDay) {
        if (!dailyBreakdown[createdDay]) {
          dailyBreakdown[createdDay] = { leads: 0, qualifiedLeads: 0, customers: 0, total: 0 };
        }
        dailyBreakdown[createdDay].total++;
        const stage = classifyRdStage(contact.lifecycle_stage);
        if (stage === 'customer') {
          dailyBreakdown[createdDay].customers++;
          totalCustomers++;
        } else if (stage === 'qualifiedLead') {
          dailyBreakdown[createdDay].qualifiedLeads++;
          totalQualified++;
        } else {
          dailyBreakdown[createdDay].leads++;
          totalLeads++;
        }
      }

      const convDay = contact.last_conversion_date?.slice(0, 10);
      const convTs = convDay ? new Date(convDay).getTime() : 0;
      const convInRange = convTs >= startTs && convTs <= endTs;

      if (convDay && convInRange) {
        conversionsByDay[convDay] = (conversionsByDay[convDay] ?? 0) + 1;
        const form = contact.conversion_identifier?.trim() || `Sem identificador (${convDay})`;
        formCount[form] = (formCount[form] ?? 0) + 1;
      } else if (contact.conversion_identifier?.trim()) {
        const createdTs = contact.created_at ? new Date(contact.created_at).getTime() : 0;
        if (createdTs >= startTs && createdTs <= endTs) {
          const form = contact.conversion_identifier.trim();
          formCount[form] = (formCount[form] ?? 0) + 1;
        }
      }
    }

    const totalContacts = totalLeads + totalQualified + totalCustomers;
    const qualificationRate =
      totalContacts > 0
        ? Math.round(((totalQualified + totalCustomers) / totalContacts) * 1000) / 10
        : 0;
    const conversionRate =
      totalContacts > 0
        ? Math.round((totalCustomers / totalContacts) * 1000) / 10
        : 0;

    const topForms = Object.entries(formCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, conversions]) => ({ name, conversions }));

    return {
      dailyBreakdown,
      conversionsByDay,
      topForms,
      summary: {
        total: totalContacts,
        leads: totalLeads,
        qualifiedLeads: totalQualified,
        customers: totalCustomers,
        qualificationRate,
        conversionRate,
        enrichedDetailCount: enrichedCount,
        segmentationId,
      },
    };
  }

  async fetchAnalyticsFunnel(
    creds: RdsCredentials,
    startDate: string,
    endDate: string,
  ): Promise<RdOfficialFunnelResult> {
    try {
      const data = await this.rdsGet<RdAnalyticsFunnelResponse>(creds, '/platform/analytics/funnel', {
        start_date: startDate,
        end_date: endDate,
        grouped_by: 'daily',
      });

      const rows = data.funnel ?? [];
      const startTs = new Date(startDate).getTime();
      const endTs = new Date(endDate).getTime();

      const inRange = rows.filter((row) => {
        const t = new Date(row.reference_day).getTime();
        return t >= startTs && t <= endTs;
      });

      const pick = inRange.length > 0 ? inRange[inRange.length - 1] : rows[rows.length - 1];
      if (!pick) {
        return { available: false, queryStart: startDate, queryEnd: endDate };
      }

      return {
        available: true,
        queryStart: data.query_date?.start_date ?? startDate,
        queryEnd: data.query_date?.end_date ?? endDate,
        snapshot: {
          referenceDay: pick.reference_day,
          visitors: pick.visitors_count ?? 0,
          leads: pick.contacts_count ?? 0,
          qualified: pick.qualified_contacts_count ?? 0,
          opportunities: pick.opportunities_count ?? 0,
          sales: pick.sales_count ?? 0,
        },
      };
    } catch (err: unknown) {
      const e = err as { status?: number; rdErrorType?: string; accessDenied?: boolean };
      const status = e.status;
      const accessDenied =
        e.accessDenied === true ||
        e.rdErrorType === 'FORBIDDEN' ||
        status === 403;

      if (accessDenied) {
        return { available: false, advancedRequired: true, queryStart: startDate, queryEnd: endDate };
      }
      if (status === 401) {
        return { available: false, unauthorized: true, queryStart: startDate, queryEnd: endDate };
      }
      this.logger.warn(`RD analytics funnel indisponível: ${(err as Error).message}`);
      return { available: false, queryStart: startDate, queryEnd: endDate };
    }
  }

  async testConnection(creds: RdsCredentials): Promise<{ valid: boolean; name?: string }> {
    try {
      const data = await this.rdsGet<{ name?: string }>(creds, RDS_ACCOUNT_INFO_PATH);
      return { valid: true, name: data.name };
    } catch {
      return { valid: false };
    }
  }
}
