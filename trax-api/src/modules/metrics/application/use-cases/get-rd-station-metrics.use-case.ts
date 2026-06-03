import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { buildRdPeriodKey } from '@/modules/integration/application/services/rd-station.service';
import { sumReportAdsSpend } from '../helpers/report-ads-spend.helper';
import { RdOfficialFunnelService } from '../services/rd-official-funnel.service';

interface RdQuery {
  agencyId: string;
  reportId: string;
  startDate?: string;
  endDate?: string;
}

interface RdDailyRow {
  leads: number;
  qualifiedLeads: number;
  customers: number;
  total: number;
}

interface RdSummaryRow {
  total: number;
  leads: number;
  qualifiedLeads: number;
  customers: number;
  qualificationRate: number;
  conversionRate: number;
}

interface FunnelStage {
  etapa: string;
  total: number;
  cor: string;
  taxaConversao: number | null;
}

interface TrendPoint {
  date: string;
  leads: number;
  qualifiedLeads: number;
  customers: number;
}

interface CplCruzado {
  spend: number;
  leads: number;
  cpl: number;
}

export interface RdOfficialFunnelDto {
  available: boolean;
  advancedRequired?: boolean;
  unauthorized?: boolean;
  referenceDay?: string;
  stages: FunnelStage[];
}

export interface RdStationMetricsDto {
  funil: FunnelStage[];
  officialFunnel: RdOfficialFunnelDto | null;
  kpis: {
    totalLeads: number;
    qualifiedLeads: number;
    customers: number;
    taxaQualificacao: number;
    taxaConversao: number;
    leads?: number;
    enrichedDetailCount?: number;
    officialLeads?: number;
    officialQualified?: number;
  };
  trend: TrendPoint[];
  conversionsTrend: Array<{ date: string; conversions: number }>;
  topForms: Array<{ name: string; conversions: number }>;
  cplCruzado: CplCruzado | null;
  accountName: string | null;
  syncedAt: string | null;
  hasData: boolean;
}

@Injectable()
export class GetRdStationMetricsUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rdOfficialFunnel: RdOfficialFunnelService,
  ) {}

  async execute(query: RdQuery): Promise<RdStationMetricsDto> {
    const report = await this.prisma.report.findFirst({
      where: { id: query.reportId, agencyId: query.agencyId },
      include: { integrations: { include: { integration: true } } },
    });
    if (!report) throw new NotFoundException('Relatório não encontrado.');

    const reportIntegrations = report.integrations.map((ri) => ri.integration);

    const rdIntegrations = reportIntegrations.filter(
      (i) => i.provider === 'RD_STATION' && i.status === 'ACTIVE',
    );

    if (rdIntegrations.length === 0) {
      return this.empty();
    }

    const rdIds = rdIntegrations.map((i) => i.id);

    const startDate = query.startDate ?? report.periodStart?.toISOString().slice(0, 10);
    const endDate = query.endDate ?? report.periodEnd?.toISOString().slice(0, 10);
    const dateFilter =
      startDate && endDate
        ? { gte: new Date(startDate), lte: new Date(endDate) }
        : undefined;

    const periodKey =
      startDate && endDate ? buildRdPeriodKey(startDate, endDate) : null;

    const [dailyRows, summaryRow, formsRow, conversionRows] = await Promise.all([
      this.prisma.dailyMetric.findMany({
        where: {
          integrationId: { in: rdIds },
          metricType: 'rd_leads',
          ...(dateFilter ? { date: dateFilter } : {}),
        },
        orderBy: { date: 'asc' },
      }),
      periodKey
        ? this.prisma.dailyMetric.findFirst({
            where: {
              integrationId: { in: rdIds },
              metricType: 'rd_summary',
              entityId: periodKey,
            },
            orderBy: { date: 'desc' },
          })
        : Promise.resolve(null),
      periodKey
        ? this.prisma.dailyMetric.findFirst({
            where: {
              integrationId: { in: rdIds },
              metricType: 'rd_forms',
              entityId: periodKey,
            },
            orderBy: { date: 'desc' },
          })
        : Promise.resolve(null),
      this.prisma.dailyMetric.findMany({
        where: {
          integrationId: { in: rdIds },
          metricType: 'rd_conversions',
          ...(dateFilter ? { date: dateFilter } : {}),
        },
        orderBy: { date: 'asc' },
      }),
    ]);

    let totalLeads = 0;
    let totalQualified = 0;
    let totalCustomers = 0;
    const trend: TrendPoint[] = [];

    for (const row of dailyRows) {
      const d = row.data as Partial<RdDailyRow>;
      const leads = d.leads ?? 0;
      const qualified = d.qualifiedLeads ?? 0;
      const customers = d.customers ?? 0;

      totalLeads += leads;
      totalQualified += qualified;
      totalCustomers += customers;

      trend.push({
        date: row.date.toISOString().slice(0, 10),
        leads,
        qualifiedLeads: qualified,
        customers,
      });
    }

    let qualificationRate = 0;
    let conversionRate = 0;

    if (summaryRow && periodKey && summaryRow.entityId === periodKey) {
      const s = summaryRow.data as Partial<RdSummaryRow>;
      totalLeads = s.leads ?? totalLeads;
      totalQualified = s.qualifiedLeads ?? totalQualified;
      totalCustomers = s.customers ?? totalCustomers;
      qualificationRate = s.qualificationRate ?? 0;
      conversionRate = s.conversionRate ?? 0;
    }

    const totalContacts = totalLeads + totalQualified + totalCustomers;
    if (qualificationRate === 0 && totalContacts > 0) {
      qualificationRate =
        Math.round(((totalQualified + totalCustomers) / totalContacts) * 100 * 10) / 10;
    }
    if (conversionRate === 0 && totalContacts > 0) {
      conversionRate = Math.round((totalCustomers / totalContacts) * 100 * 10) / 10;
    }

    const funil: FunnelStage[] = [
      {
        etapa: 'Leads',
        total: totalContacts,
        cor: '#3B82F6',
        taxaConversao: null,
      },
      {
        etapa: 'Qualificados',
        total: totalQualified + totalCustomers,
        cor: '#F59E0B',
        taxaConversao:
          totalContacts > 0
            ? Math.round(((totalQualified + totalCustomers) / totalContacts) * 100 * 10) / 10
            : 0,
      },
      {
        etapa: 'Clientes',
        total: totalCustomers,
        cor: '#10B981',
        taxaConversao:
          totalQualified + totalCustomers > 0
            ? Math.round((totalCustomers / (totalQualified + totalCustomers)) * 100 * 10) / 10
            : 0,
      },
    ];

    const formsData = formsRow?.data as {
      forms?: Array<{ name: string; conversions: number }>;
    } | null;
    const topForms = formsData?.forms ?? [];

    const conversionsTrend = conversionRows.map((r) => ({
      date: r.date.toISOString().slice(0, 10),
      conversions: Number((r.data as { conversions?: number }).conversions ?? 0),
    }));

    let officialFunnel: RdOfficialFunnelDto | null = null;
    let officialLeads: number | undefined;
    let officialQualified: number | undefined;

    if (startDate && endDate) {
      const officialResult = await this.rdOfficialFunnel.fetchForIntegration(
        rdIntegrations[0],
        startDate,
        endDate,
      );
      officialFunnel = this.buildOfficialFunnelDto(officialResult);
      if (officialResult.snapshot) {
        officialLeads = officialResult.snapshot.leads;
        officialQualified = officialResult.snapshot.qualified;
      }
    }

    const cplLeadCount =
      officialLeads != null && officialLeads > 0 ? officialLeads : totalContacts;

    const totalSpend = await sumReportAdsSpend(this.prisma, reportIntegrations, dateFilter);
    const cplCruzado =
      totalSpend > 0 && cplLeadCount > 0
        ? {
            spend: Math.round(totalSpend * 100) / 100,
            leads: cplLeadCount,
            cpl: Math.round((totalSpend / cplLeadCount) * 100) / 100,
          }
        : null;

    const enrichedDetailCount = summaryRow
      ? Number((summaryRow.data as { enrichedDetailCount?: number }).enrichedDetailCount ?? 0)
      : 0;

    const accountName = rdIntegrations[0]?.externalAccount ?? null;
    const syncedAt = rdIntegrations[0]?.lastSyncAt?.toISOString() ?? null;

    const hasLocalData =
      dailyRows.length > 0 || (summaryRow != null && totalContacts > 0);
    const hasOfficialData = officialFunnel?.available === true;
    const hasData = hasLocalData || hasOfficialData;

    if (!hasData) return this.empty();

    return {
      funil,
      officialFunnel,
      kpis: {
        totalLeads: officialLeads ?? totalContacts,
        qualifiedLeads: officialQualified ?? totalQualified + totalCustomers,
        customers: totalCustomers,
        taxaQualificacao: qualificationRate,
        taxaConversao: conversionRate,
        leads: totalLeads,
        enrichedDetailCount,
        officialLeads,
        officialQualified,
      },
      trend,
      conversionsTrend,
      topForms,
      cplCruzado,
      accountName,
      syncedAt,
      hasData: true,
    };
  }

  private buildOfficialFunnelDto(
    result: Awaited<ReturnType<RdOfficialFunnelService['fetchForIntegration']>>,
  ): RdOfficialFunnelDto {
    if (!result.available || !result.snapshot) {
      return {
        available: false,
        advancedRequired: result.advancedRequired,
        unauthorized: result.unauthorized,
        stages: [],
      };
    }

    const s = result.snapshot;
    const stages: FunnelStage[] = [
      { etapa: 'Visitantes', total: s.visitors, cor: '#6366F1', taxaConversao: null },
      {
        etapa: 'Leads',
        total: s.leads,
        cor: '#3B82F6',
        taxaConversao: s.visitors > 0 ? Math.round((s.leads / s.visitors) * 1000) / 10 : 0,
      },
      {
        etapa: 'Qualificados',
        total: s.qualified,
        cor: '#F59E0B',
        taxaConversao: s.leads > 0 ? Math.round((s.qualified / s.leads) * 1000) / 10 : 0,
      },
      {
        etapa: 'Oportunidades',
        total: s.opportunities,
        cor: '#8B5CF6',
        taxaConversao:
          s.qualified > 0 ? Math.round((s.opportunities / s.qualified) * 1000) / 10 : 0,
      },
      {
        etapa: 'Vendas',
        total: s.sales,
        cor: '#10B981',
        taxaConversao:
          s.opportunities > 0 ? Math.round((s.sales / s.opportunities) * 1000) / 10 : 0,
      },
    ];

    return {
      available: true,
      referenceDay: s.referenceDay,
      stages,
    };
  }

  private empty(): RdStationMetricsDto {
    return {
      funil: [],
      officialFunnel: null,
      kpis: {
        totalLeads: 0,
        qualifiedLeads: 0,
        customers: 0,
        taxaQualificacao: 0,
        taxaConversao: 0,
        leads: 0,
        enrichedDetailCount: 0,
      },
      trend: [],
      conversionsTrend: [],
      topForms: [],
      cplCruzado: null,
      accountName: null,
      syncedAt: null,
      hasData: false,
    };
  }
}
