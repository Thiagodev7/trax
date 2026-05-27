import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

interface CrmQuery {
  agencyId: string;
  reportId: string;
  origin?: string;
}

@Injectable()
export class GetCrmMetricsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: CrmQuery) {
    const report = await this.prisma.report.findFirst({
      where: { id: query.reportId, agencyId: query.agencyId },
      include: { integrations: { include: { integration: true } } },
    });
    if (!report) throw new NotFoundException('Relatório não encontrado.');

    const nectarIntegrations = report.integrations
      .map((ri) => ri.integration)
      .filter((i) => i.provider === 'NECTAR_CRM' && i.status === 'ACTIVE');

    if (nectarIntegrations.length === 0) {
      return this.empty();
    }

    const ids = nectarIntegrations.map((i) => i.id);
    const latest = await this.prisma.dailyMetric.findFirst({
      where: { integrationId: { in: ids }, metricType: 'crm', entityId: 'summary' },
      orderBy: { date: 'desc' },
    });

    if (!latest) return this.empty();

    const d = latest.data as Record<string, unknown>;
    const origin = query.origin?.toLowerCase();

    let pipeline = {
      contatos: Number(d.totalContatos ?? 0),
      qualificacao: Number((d as any).qualificacao ?? (d as any).oportunidadesAbertas ?? 0),
      agendamento: Number((d as any).agendamento ?? 0),
      qualificada: Number((d as any).qualificada ?? 0),
      vendida: Number(d.oportunidadesGanhas ?? 0),
      perdidas: Number(d.oportunidadesPerdidas ?? 0),
    };

    if (origin === 'meta ads' || origin === 'meta') {
      const byOrigin = (d.byOrigin as Record<string, unknown>) ?? {};
      const meta = (byOrigin['Meta Ads'] ?? byOrigin.meta) as Record<string, number> | undefined;
      if (meta) {
        pipeline = {
          contatos: meta.contatos ?? pipeline.contatos,
          qualificacao: meta.qualificacao ?? pipeline.qualificacao,
          agendamento: meta.agendamento ?? pipeline.agendamento,
          qualificada: meta.qualificada ?? pipeline.qualificada,
          vendida: meta.vendidas ?? pipeline.vendida,
          perdidas: meta.perdidas ?? pipeline.perdidas,
        };
      }
    }

    const vendas = pipeline.vendida;
    const receita = Number(d.receitaTotal ?? 0);

    return {
      pipeline,
      pipelineLegacy: {
        totalContatos: pipeline.contatos,
        oportunidadesAbertas: pipeline.qualificacao,
        oportunidadesGanhas: pipeline.vendida,
        oportunidadesPerdidas: pipeline.perdidas,
      },
      vendas,
      receita,
      ticketMedio: Number(d.ticketMedio ?? 0),
      mrr: Number(d.mrr ?? 0),
      historico: (d.historicoMensal as unknown[]) ?? [],
      funil: (d.funil as unknown[]) ?? [],
      syncedAt: latest.date,
      origin: query.origin ?? 'all',
    };
  }

  private empty() {
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
