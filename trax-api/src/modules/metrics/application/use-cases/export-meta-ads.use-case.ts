import { Injectable } from '@nestjs/common';
import { GetMetaAdsMetricsUseCase } from './get-meta-ads-metrics.use-case';

interface Query {
  agencyId: string;
  reportId: string;
  startDate?: string;
  endDate?: string;
  entity: 'adsets' | 'creatives' | 'daily';
}

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = typeof v === 'number' ? v.toString() : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(headers: string[], rows: Array<Array<unknown>>): string {
  const lines = [headers.join(','), ...rows.map((r) => r.map(csvEscape).join(','))];
  return lines.join('\n');
}

@Injectable()
export class ExportMetaAdsUseCase {
  constructor(private readonly getMetaAds: GetMetaAdsMetricsUseCase) {}

  async execute(q: Query): Promise<string> {
    const data = await this.getMetaAds.execute({
      agencyId: q.agencyId,
      reportId: q.reportId,
      startDate: q.startDate,
      endDate: q.endDate,
    });

    if (q.entity === 'adsets') {
      return toCsv(
        ['id', 'nome', 'campanha', 'produto', 'estados', 'status', 'verba_diaria', 'gasto', 'leads', 'cpl', 'ctr', 'cpc', 'cpm', 'impressoes', 'cliques'],
        data.adsetTable.map((a) => [
          a.id,
          a.name,
          a.campaign,
          a.product ?? '',
          a.states.join('|'),
          a.status,
          a.budget,
          a.spend,
          a.leads,
          a.cpl ?? '',
          a.ctr.toFixed(2),
          a.cpc.toFixed(2),
          a.cpm.toFixed(2),
          a.impressions,
          a.clicks,
        ]),
      );
    }

    if (q.entity === 'creatives') {
      return toCsv(
        ['ad_id', 'ad_name', 'campanha', 'status', 'gasto', 'leads', 'cpl', 'ctr', 'cpc', 'impressoes', 'cliques', 'permalink'],
        data.creatives.map((c) => [
          c.ad_id,
          c.ad_name,
          c.campaign_code,
          c.status,
          c.spend,
          c.leads,
          c.cpl ?? '',
          c.ctr.toFixed(2),
          c.cpc.toFixed(2),
          c.impressions,
          c.clicks,
          c.permalink ?? '',
        ]),
      );
    }

    return toCsv(
      ['data', 'gasto', 'leads', 'impressoes', 'cliques', 'alcance', 'ctr', 'cpc', 'cpl', 'cpm'],
      data.dailyData.map((d) => [
        d.date,
        d.spend,
        d.leads,
        d.impressions,
        d.clicks,
        d.reach,
        d.impressions > 0 ? ((d.clicks / d.impressions) * 100).toFixed(2) : '0.00',
        d.clicks > 0 ? (d.spend / d.clicks).toFixed(2) : '0.00',
        d.leads > 0 ? (d.spend / d.leads).toFixed(2) : '0.00',
        d.impressions > 0 ? ((d.spend / d.impressions) * 1000).toFixed(2) : '0.00',
      ]),
    );
  }
}
