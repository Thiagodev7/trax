import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

interface CrmQuery {
  agencyId: string;
  reportId: string;
  origin?: string;
}

interface PipelineShape {
  contatos: number;
  qualificacao: number;
  agendamento: number;
  qualificada: number;
  vendida: number;
  perdidas: number;
}

export interface CrmMetricsResponse {
  pipeline: PipelineShape | null;
  pipelineLegacy: {
    totalContatos: number;
    oportunidadesAbertas: number;
    oportunidadesGanhas: number;
    oportunidadesPerdidas: number;
  } | null;
  vendas: number;
  receita: number;
  ticketMedio: number;
  mrr: number;
  historico: unknown[];
  funil: Array<{ etapa: string; quantidade: number; valor: number }>;
  syncedAt?: string;
  origin: string;
  source?: string;
  primarySource?: 'NECTAR_CRM' | 'RD_STATION' | 'MERGED';
  sources?: {
    nectar?: {
      pipeline: PipelineShape;
      receita: number;
      ticketMedio: number;
      mrr: number;
    };
    rd?: {
      pipeline: PipelineShape;
      totalLeads: number;
    };
  };
}

@Injectable()
export class GetCrmMetricsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: CrmQuery): Promise<CrmMetricsResponse> {
    const report = await this.prisma.report.findFirst({
      where: { id: query.reportId, agencyId: query.agencyId },
      include: { integrations: { include: { integration: true } } },
    });
    if (!report) throw new NotFoundException('Relatório não encontrado.');

    const allIntegrations = report.integrations.map((ri) => ri.integration);
    const nectarIntegrations = allIntegrations.filter(
      (i) => i.provider === 'NECTAR_CRM' && i.status === 'ACTIVE',
    );
    const rdIntegrations = allIntegrations.filter(
      (i) => i.provider === 'RD_STATION' && i.status === 'ACTIVE',
    );

    if (nectarIntegrations.length === 0 && rdIntegrations.length === 0) {
      return this.empty();
    }

    const nectarData =
      nectarIntegrations.length > 0
        ? await this.loadNectar(nectarIntegrations.map((i) => i.id), query.origin)
        : null;
    const rdData =
      rdIntegrations.length > 0
        ? await this.loadRd(rdIntegrations.map((i) => i.id))
        : null;

    if (!nectarData && !rdData) return this.empty();

    const sources: CrmMetricsResponse['sources'] = {};
    if (nectarData) sources.nectar = nectarData;
    if (rdData) sources.rd = rdData;

    let primarySource: CrmMetricsResponse['primarySource'] = 'MERGED';
    let pipeline: PipelineShape | null = null;
    let receita = 0;
    let ticketMedio = 0;
    let mrr = 0;
    let historico: unknown[] = [];
    let funil: CrmMetricsResponse['funil'] = [];
    let syncedAt: string | undefined;

    if (nectarData && rdData) {
      pipeline = {
        contatos: rdData.totalLeads,
        qualificacao: nectarData.pipeline.qualificacao,
        agendamento: nectarData.pipeline.agendamento,
        qualificada: nectarData.pipeline.qualificada,
        vendida: nectarData.pipeline.vendida,
        perdidas: nectarData.pipeline.perdidas,
      };
      receita = nectarData.receita;
      ticketMedio = nectarData.ticketMedio;
      mrr = nectarData.mrr;
      historico = nectarData.historico;
      funil = nectarData.funil.length > 0 ? nectarData.funil : rdData.funil;
      primarySource = 'MERGED';
    } else if (nectarData) {
      pipeline = nectarData.pipeline;
      receita = nectarData.receita;
      ticketMedio = nectarData.ticketMedio;
      mrr = nectarData.mrr;
      historico = nectarData.historico;
      funil = nectarData.funil;
      primarySource = 'NECTAR_CRM';
    } else if (rdData) {
      pipeline = rdData.pipeline;
      funil = rdData.funil;
      primarySource = 'RD_STATION';
    }

    if (pipeline && query.origin) {
      pipeline = this.applyOriginFilter(pipeline, nectarData?.raw, query.origin);
    }

    const vendas = pipeline?.vendida ?? 0;

    return {
      pipeline,
      pipelineLegacy: pipeline
        ? {
            totalContatos: pipeline.contatos,
            oportunidadesAbertas: pipeline.qualificacao,
            oportunidadesGanhas: pipeline.vendida,
            oportunidadesPerdidas: pipeline.perdidas,
          }
        : null,
      vendas,
      receita,
      ticketMedio,
      mrr,
      historico,
      funil,
      syncedAt,
      origin: query.origin ?? 'all',
      source: primarySource,
      primarySource,
      sources,
    };
  }

  private async loadNectar(
    ids: string[],
    origin?: string,
  ): Promise<{
    pipeline: PipelineShape;
    receita: number;
    ticketMedio: number;
    mrr: number;
    historico: unknown[];
    funil: CrmMetricsResponse['funil'];
    raw: Record<string, unknown>;
  } | null> {
    const latest = await this.prisma.dailyMetric.findFirst({
      where: { integrationId: { in: ids }, metricType: 'crm', entityId: 'summary' },
      orderBy: { date: 'desc' },
    });
    if (!latest) return null;

    const d = latest.data as Record<string, unknown>;
    const pipeline: PipelineShape = {
      contatos: Number(d.totalContatos ?? 0),
      qualificacao: Number(d.qualificacao ?? d.oportunidadesAbertas ?? 0),
      agendamento: Number(d.agendamento ?? 0),
      qualificada: Number(d.qualificada ?? 0),
      vendida: Number(d.oportunidadesGanhas ?? 0),
      perdidas: Number(d.oportunidadesPerdidas ?? 0),
    };

    return {
      pipeline,
      receita: Number(d.receitaTotal ?? 0),
      ticketMedio: Number(d.ticketMedio ?? 0),
      mrr: Number(d.mrr ?? 0),
      historico: (d.historicoMensal as unknown[]) ?? [],
      funil: (d.funil as CrmMetricsResponse['funil']) ?? [],
      raw: d,
    };
  }

  private async loadRd(ids: string[]): Promise<{
    pipeline: PipelineShape;
    totalLeads: number;
    funil: CrmMetricsResponse['funil'];
  } | null> {
    const summaryRow = await this.prisma.dailyMetric.findFirst({
      where: { integrationId: { in: ids }, metricType: 'rd_summary' },
      orderBy: { date: 'desc' },
    });
    if (!summaryRow) return null;

    const d = summaryRow.data as Record<string, unknown>;
    const total = Number(d.total ?? 0);
    const qualified = Number(d.qualifiedLeads ?? 0);
    const customers = Number(d.customers ?? 0);

    return {
      totalLeads: total,
      pipeline: {
        contatos: total,
        qualificacao: qualified,
        agendamento: 0,
        qualificada: qualified,
        vendida: customers,
        perdidas: 0,
      },
      funil: [
        { etapa: 'Leads', quantidade: total, valor: 0 },
        { etapa: 'Qualificados', quantidade: qualified, valor: 0 },
        { etapa: 'Clientes', quantidade: customers, valor: 0 },
      ],
    };
  }

  private applyOriginFilter(
    pipeline: PipelineShape,
    raw: Record<string, unknown> | undefined,
    origin: string,
  ): PipelineShape {
    const o = origin.toLowerCase();
    if (o !== 'meta ads' && o !== 'meta') return pipeline;
    const byOrigin = (raw?.byOrigin as Record<string, unknown>) ?? {};
    const meta = (byOrigin['Meta Ads'] ?? byOrigin.meta) as Record<string, number> | undefined;
    if (!meta) return pipeline;
    return {
      contatos: meta.contatos ?? pipeline.contatos,
      qualificacao: meta.qualificacao ?? pipeline.qualificacao,
      agendamento: meta.agendamento ?? pipeline.agendamento,
      qualificada: meta.qualificada ?? pipeline.qualificada,
      vendida: meta.vendidas ?? pipeline.vendida,
      perdidas: meta.perdidas ?? pipeline.perdidas,
    };
  }

  private empty(): CrmMetricsResponse {
    return {
      pipeline: null,
      pipelineLegacy: null,
      vendas: 0,
      receita: 0,
      ticketMedio: 0,
      mrr: 0,
      historico: [],
      funil: [],
      origin: 'all',
    };
  }
}
