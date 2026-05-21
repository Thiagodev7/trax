import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

interface CrmQuery {
  agencyId: string;
  reportId: string;
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
      return { pipeline: null, vendas: 0, receita: 0, mrr: 0, historico: [], funil: [] };
    }

    const ids = nectarIntegrations.map((i) => i.id);
    const latest = await this.prisma.dailyMetric.findFirst({
      where: { integrationId: { in: ids }, metricType: 'crm', entityId: 'summary' },
      orderBy: { date: 'desc' },
    });

    if (!latest) {
      return { pipeline: null, vendas: 0, receita: 0, mrr: 0, historico: [], funil: [] };
    }

    const d = latest.data as Record<string, unknown>;
    return {
      pipeline: {
        totalContatos: d.totalContatos ?? 0,
        oportunidadesAbertas: d.oportunidadesAbertas ?? 0,
        oportunidadesGanhas: d.oportunidadesGanhas ?? 0,
        oportunidadesPerdidas: d.oportunidadesPerdidas ?? 0,
      },
      vendas: d.oportunidadesGanhas ?? 0,
      receita: d.receitaTotal ?? 0,
      ticketMedio: d.ticketMedio ?? 0,
      mrr: d.mrr ?? 0,
      historico: (d.historicoMensal as unknown[]) ?? [],
      funil: (d.funil as unknown[]) ?? [],
      syncedAt: latest.date,
    };
  }
}
