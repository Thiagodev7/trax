import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MetricData {
  spend?: number;
  leads?: number;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  roas?: number;
  cpl?: number;
}

interface MonthlyAggregate {
  totalSpend: number;
  totalLeads: number;
  totalImpressions: number;
  totalClicks: number;
  avgCtr: number;
  avgRoas: number;
  avgCpl: number;
}

interface MonthPoint {
  month: string;
  spend: number;
  leads: number;
}

export interface DashboardSummaryDto {
  currentMonth: MonthlyAggregate;
  previousMonth: MonthlyAggregate;
  deltas: {
    spend: number | null;
    leads: number | null;
    ctr: number | null;
    roas: number | null;
  };
  monthlyEvolution: MonthPoint[];
  hasData: boolean;
  connectedIntegrations: number;
}

function aggregateMetrics(records: { data: unknown }[]): MonthlyAggregate {
  const totals = {
    totalSpend: 0,
    totalLeads: 0,
    totalImpressions: 0,
    totalClicks: 0,
    ctrSum: 0,
    roasSum: 0,
    cplSum: 0,
    ctrCount: 0,
    roasCount: 0,
    cplCount: 0,
  };

  for (const record of records) {
    const d = record.data as MetricData;
    totals.totalSpend += d.spend ?? 0;
    totals.totalLeads += d.leads ?? 0;
    totals.totalImpressions += d.impressions ?? 0;
    totals.totalClicks += d.clicks ?? 0;
    if (d.ctr != null) { totals.ctrSum += d.ctr; totals.ctrCount++; }
    if (d.roas != null) { totals.roasSum += d.roas; totals.roasCount++; }
    if (d.cpl != null) { totals.cplSum += d.cpl; totals.cplCount++; }
  }

  return {
    totalSpend: Math.round(totals.totalSpend * 100) / 100,
    totalLeads: totals.totalLeads,
    totalImpressions: totals.totalImpressions,
    totalClicks: totals.totalClicks,
    avgCtr: totals.ctrCount > 0 ? Math.round((totals.ctrSum / totals.ctrCount) * 100) / 100 : 0,
    avgRoas: totals.roasCount > 0 ? Math.round((totals.roasSum / totals.roasCount) * 100) / 100 : 0,
    avgCpl: totals.cplCount > 0 ? Math.round((totals.cplSum / totals.cplCount) * 100) / 100 : 0,
  };
}

function calcDelta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
}

@Injectable()
export class GetDashboardSummaryUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(agencyId: string): Promise<DashboardSummaryDto> {
    const now = new Date();
    const startCurrent = startOfMonth(now);
    const endCurrent = endOfMonth(now);
    const startPrev = startOfMonth(subMonths(now, 1));
    const endPrev = endOfMonth(subMonths(now, 1));

    const integrations = await this.prisma.integration.findMany({
      where: { agencyId, status: 'ACTIVE' },
      select: { id: true },
    });

    const integrationIds = integrations.map((i) => i.id);

    if (integrationIds.length === 0) {
      const empty: MonthlyAggregate = {
        totalSpend: 0, totalLeads: 0, totalImpressions: 0,
        totalClicks: 0, avgCtr: 0, avgRoas: 0, avgCpl: 0,
      };
      return {
        currentMonth: empty,
        previousMonth: empty,
        deltas: { spend: null, leads: null, ctr: null, roas: null },
        monthlyEvolution: [],
        hasData: false,
        connectedIntegrations: 0,
      };
    }

    const [currentRecords, prevRecords] = await Promise.all([
      this.prisma.dailyMetric.findMany({
        where: {
          integrationId: { in: integrationIds },
          date: { gte: startCurrent, lte: endCurrent },
          metricType: { in: ['campaign', 'summary', 'crm'] },
        },
        select: { data: true },
      }),
      this.prisma.dailyMetric.findMany({
        where: {
          integrationId: { in: integrationIds },
          date: { gte: startPrev, lte: endPrev },
          metricType: { in: ['campaign', 'summary', 'crm'] },
        },
        select: { data: true },
      }),
    ]);

    // Monthly evolution: last 6 months (aggregated spend + leads per month)
    const evolutionMonths = await this.prisma.dailyMetric.findMany({
      where: {
        integrationId: { in: integrationIds },
        date: { gte: startOfMonth(subMonths(now, 5)), lte: endCurrent },
        metricType: { in: ['campaign', 'summary', 'crm'] },
      },
      select: { date: true, data: true },
    });

    // Group evolution by month
    const monthMap = new Map<string, { spend: number; leads: number }>();
    for (let i = 5; i >= 0; i--) {
      const m = subMonths(now, i);
      const key = format(m, 'MMM', { locale: ptBR });
      const label = key.charAt(0).toUpperCase() + key.slice(1);
      monthMap.set(format(m, 'yyyy-MM'), { spend: 0, leads: 0 });
      void label;
    }

    for (const rec of evolutionMonths) {
      const key = format(new Date(rec.date), 'yyyy-MM');
      const entry = monthMap.get(key);
      if (entry) {
        const d = rec.data as MetricData;
        entry.spend += d.spend ?? 0;
        entry.leads += d.leads ?? 0;
      }
    }

    const monthlyEvolution: MonthPoint[] = [];
    for (let i = 5; i >= 0; i--) {
      const m = subMonths(now, i);
      const key = format(m, 'yyyy-MM');
      const label = format(m, 'MMM', { locale: ptBR });
      const display = label.charAt(0).toUpperCase() + label.slice(1);
      const entry = monthMap.get(key) ?? { spend: 0, leads: 0 };
      monthlyEvolution.push({
        month: display,
        spend: Math.round(entry.spend * 100) / 100,
        leads: entry.leads,
      });
    }

    const current = aggregateMetrics(currentRecords);
    const previous = aggregateMetrics(prevRecords);
    const hasData = currentRecords.length > 0 || prevRecords.length > 0;

    return {
      currentMonth: current,
      previousMonth: previous,
      deltas: {
        spend: calcDelta(current.totalSpend, previous.totalSpend),
        leads: calcDelta(current.totalLeads, previous.totalLeads),
        ctr: calcDelta(current.avgCtr, previous.avgCtr),
        roas: calcDelta(current.avgRoas, previous.avgRoas),
      },
      monthlyEvolution,
      hasData,
      connectedIntegrations: integrationIds.length,
    };
  }
}
