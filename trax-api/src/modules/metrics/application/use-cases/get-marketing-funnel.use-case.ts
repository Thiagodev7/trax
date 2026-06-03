import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { buildRdPeriodKey } from '@/modules/integration/application/services/rd-station.service';
import { sumMetaAdLeads, sumReportAdsSpend } from '../helpers/report-ads-spend.helper';
import { RdOfficialFunnelService } from '../services/rd-official-funnel.service';

interface FunnelQuery {
  agencyId: string;
  reportId: string;
  startDate?: string;
  endDate?: string;
}

export interface FunnelStageDto {
  id: string;
  label: string;
  value: number;
  formato: 'currency' | 'number';
  taxaConversao: number | null;
  cplParcial: number | null;
}

export interface MarketingFunnelDto {
  stages: FunnelStageDto[];
  kpis: {
    spend: number;
    metaLeads: number;
    rdLeads: number;
    nectarContacts: number;
    nectarSales: number;
    nectarRevenue: number;
    cplAdsToRd: number | null;
    cplAdsToSale: number | null;
    roas: number | null;
  };
  hasData: boolean;
}

@Injectable()
export class GetMarketingFunnelUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rdOfficialFunnel: RdOfficialFunnelService,
  ) {}

  async execute(query: FunnelQuery): Promise<MarketingFunnelDto> {
    const report = await this.prisma.report.findFirst({
      where: { id: query.reportId, agencyId: query.agencyId },
      include: { integrations: { include: { integration: true } } },
    });
    if (!report) throw new NotFoundException('Relatório não encontrado.');

    const integrations = report.integrations.map((ri) => ri.integration);
    const startDate = query.startDate ?? report.periodStart?.toISOString().slice(0, 10);
    const endDate = query.endDate ?? report.periodEnd?.toISOString().slice(0, 10);
    const dateFilter =
      startDate && endDate
        ? { gte: new Date(startDate), lte: new Date(endDate) }
        : undefined;

    const spend = await sumReportAdsSpend(this.prisma, integrations, dateFilter);
    const metaLeads = await sumMetaAdLeads(this.prisma, integrations, dateFilter);

    const rdIds = integrations
      .filter((i) => i.provider === 'RD_STATION' && i.status === 'ACTIVE')
      .map((i) => i.id);
    const nectarIds = integrations
      .filter((i) => i.provider === 'NECTAR_CRM' && i.status === 'ACTIVE')
      .map((i) => i.id);

    let rdLeads = 0;
    const rdIntegration = integrations.find(
      (i) => i.provider === 'RD_STATION' && i.status === 'ACTIVE',
    );
    if (rdIds.length > 0 && startDate && endDate) {
      if (rdIntegration) {
        const official = await this.rdOfficialFunnel.fetchForIntegration(
          rdIntegration,
          startDate,
          endDate,
        );
        if (official.available && official.snapshot) {
          rdLeads = official.snapshot.leads;
        }
      }
      if (rdLeads === 0) {
        const periodKey = buildRdPeriodKey(startDate, endDate);
        const rdSummary = await this.prisma.dailyMetric.findFirst({
          where: {
            integrationId: { in: rdIds },
            metricType: 'rd_summary',
            entityId: periodKey,
          },
          orderBy: { date: 'desc' },
        });
        if (rdSummary) {
          const s = rdSummary.data as { leads?: number; total?: number };
          rdLeads = s.leads ?? s.total ?? 0;
        } else {
          const daily = await this.prisma.dailyMetric.findMany({
            where: {
              integrationId: { in: rdIds },
              metricType: 'rd_leads',
              ...(dateFilter ? { date: dateFilter } : {}),
            },
          });
          rdLeads = daily.reduce((sum, r) => {
            const d = r.data as {
              leads?: number;
              qualifiedLeads?: number;
              customers?: number;
            };
            return sum + (d.leads ?? 0) + (d.qualifiedLeads ?? 0) + (d.customers ?? 0);
          }, 0);
        }
      }
    }

    let nectarContacts = 0;
    let nectarSales = 0;
    let nectarRevenue = 0;
    if (nectarIds.length > 0) {
      const crm = await this.prisma.dailyMetric.findFirst({
        where: { integrationId: { in: nectarIds }, metricType: 'crm', entityId: 'summary' },
        orderBy: { date: 'desc' },
      });
      if (crm) {
        const d = crm.data as Record<string, unknown>;
        nectarContacts = Number(d.totalContatos ?? 0);
        nectarSales = Number(d.oportunidadesGanhas ?? 0);
        nectarRevenue = Number(d.receitaTotal ?? 0);
      }
    }

    const pct = (from: number, to: number) =>
      from > 0 ? Math.round((to / from) * 1000) / 10 : null;
    const cpl = (invest: number, count: number) =>
      count > 0 ? Math.round((invest / count) * 100) / 100 : null;

    const stages: FunnelStageDto[] = [
      {
        id: 'spend',
        label: 'Investimento (Meta + Google)',
        value: Math.round(spend * 100) / 100,
        formato: 'currency',
        taxaConversao: null,
        cplParcial: null,
      },
      {
        id: 'meta_leads',
        label: 'Leads nos anúncios (Meta)',
        value: metaLeads,
        formato: 'number',
        taxaConversao: pct(spend, metaLeads),
        cplParcial: cpl(spend, metaLeads),
      },
      {
        id: 'rd_leads',
        label: 'Leads RD Station',
        value: rdLeads,
        formato: 'number',
        taxaConversao: pct(metaLeads || spend, rdLeads),
        cplParcial: cpl(spend, rdLeads),
      },
      {
        id: 'nectar_contacts',
        label: 'Contatos Nectar CRM',
        value: nectarContacts,
        formato: 'number',
        taxaConversao: pct(rdLeads || metaLeads, nectarContacts),
        cplParcial: null,
      },
      {
        id: 'nectar_sales',
        label: 'Vendas fechadas',
        value: nectarSales,
        formato: 'number',
        taxaConversao: pct(nectarContacts || rdLeads, nectarSales),
        cplParcial: cpl(spend, nectarSales),
      },
      {
        id: 'nectar_revenue',
        label: 'Receita',
        value: Math.round(nectarRevenue * 100) / 100,
        formato: 'currency',
        taxaConversao: null,
        cplParcial: null,
      },
    ];

    const hasData = spend > 0 || rdLeads > 0 || nectarContacts > 0 || metaLeads > 0;

    return {
      stages,
      kpis: {
        spend: Math.round(spend * 100) / 100,
        metaLeads,
        rdLeads,
        nectarContacts,
        nectarSales,
        nectarRevenue: Math.round(nectarRevenue * 100) / 100,
        cplAdsToRd: cpl(spend, rdLeads),
        cplAdsToSale: cpl(spend, nectarSales),
        roas: spend > 0 ? Math.round((nectarRevenue / spend) * 100) / 100 : null,
      },
      hasData,
    };
  }
}
