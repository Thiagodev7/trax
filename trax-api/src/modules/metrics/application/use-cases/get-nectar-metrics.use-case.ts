import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { sumReportAdsSpend } from '../helpers/report-ads-spend.helper';

interface NectarQuery {
  agencyId: string;
  reportId: string;
  startDate?: string;
  endDate?: string;
}

export interface NectarMetricsDto {
  pipeline: {
    contatos: number;
    qualificacao: number;
    agendamento: number;
    qualificada: number;
    vendida: number;
    perdidas: number;
  } | null;
  vendas: number;
  receita: number;
  ticketMedio: number;
  mrr: number;
  historico: Array<{ mes: string; ganhas: number; perdidas: number; receita: number }>;
  funil: Array<{ etapa: string; quantidade: number; valor: number }>;
  trend: Array<{ date: string; contacts: number }>;
  cplCruzado: { spend: number; leads: number; cpl: number } | null;
  syncedAt: string | null;
  hasData: boolean;
}

@Injectable()
export class GetNectarMetricsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: NectarQuery): Promise<NectarMetricsDto> {
    const report = await this.prisma.report.findFirst({
      where: { id: query.reportId, agencyId: query.agencyId },
      include: { integrations: { include: { integration: true } } },
    });
    if (!report) throw new NotFoundException('Relatório não encontrado.');

    const integrations = report.integrations.map((ri) => ri.integration);
    const nectarIds = integrations
      .filter((i) => i.provider === 'NECTAR_CRM' && i.status === 'ACTIVE')
      .map((i) => i.id);

    if (nectarIds.length === 0) return this.empty();

    const startDate = query.startDate ?? report.periodStart?.toISOString().slice(0, 10);
    const endDate = query.endDate ?? report.periodEnd?.toISOString().slice(0, 10);
    const dateFilter =
      startDate && endDate
        ? { gte: new Date(startDate), lte: new Date(endDate) }
        : undefined;

    const [summaryRow, dailyRows] = await Promise.all([
      this.prisma.dailyMetric.findFirst({
        where: { integrationId: { in: nectarIds }, metricType: 'crm', entityId: 'summary' },
        orderBy: { date: 'desc' },
      }),
      this.prisma.dailyMetric.findMany({
        where: {
          integrationId: { in: nectarIds },
          metricType: 'nectar_daily',
          ...(dateFilter ? { date: dateFilter } : {}),
        },
        orderBy: { date: 'asc' },
      }),
    ]);

    if (!summaryRow && dailyRows.length === 0) return this.empty();

    const d = (summaryRow?.data ?? {}) as Record<string, unknown>;
    const pipeline = {
      contatos: Number(d.totalContatos ?? 0),
      qualificacao: Number(d.qualificacao ?? d.oportunidadesAbertas ?? 0),
      agendamento: Number(d.agendamento ?? 0),
      qualificada: Number(d.qualificada ?? 0),
      vendida: Number(d.oportunidadesGanhas ?? 0),
      perdidas: Number(d.oportunidadesPerdidas ?? 0),
    };

    const trend = dailyRows.map((r) => {
      const row = r.data as { contacts?: number };
      return {
        date: r.date.toISOString().slice(0, 10),
        contacts: row.contacts ?? 0,
      };
    });

    const totalLeadsForCpl = pipeline.contatos || trend.reduce((s, t) => s + t.contacts, 0);
    const spend = await sumReportAdsSpend(this.prisma, integrations, dateFilter);
    const cplCruzado =
      spend > 0 && totalLeadsForCpl > 0
        ? {
            spend: Math.round(spend * 100) / 100,
            leads: totalLeadsForCpl,
            cpl: Math.round((spend / totalLeadsForCpl) * 100) / 100,
          }
        : null;

    return {
      pipeline,
      vendas: pipeline.vendida,
      receita: Number(d.receitaTotal ?? 0),
      ticketMedio: Number(d.ticketMedio ?? 0),
      mrr: Number(d.mrr ?? 0),
      historico: (d.historicoMensal as NectarMetricsDto['historico']) ?? [],
      funil: (d.funil as NectarMetricsDto['funil']) ?? [],
      trend,
      cplCruzado,
      syncedAt: nectarIds.length
        ? integrations.find((i) => i.provider === 'NECTAR_CRM')?.lastSyncAt?.toISOString() ?? null
        : null,
      hasData: true,
    };
  }

  private empty(): NectarMetricsDto {
    return {
      pipeline: null,
      vendas: 0,
      receita: 0,
      ticketMedio: 0,
      mrr: 0,
      historico: [],
      funil: [],
      trend: [],
      cplCruzado: null,
      syncedAt: null,
      hasData: false,
    };
  }
}
