import { PrismaService } from '@/prisma/prisma.service';

interface IntegrationRef {
  id: string;
  provider: string;
  status: string;
}

interface DateFilter {
  gte: Date;
  lte: Date;
}

/** Soma spend de integrações Meta + Google ativas no relatório, no intervalo de datas. */
export async function sumReportAdsSpend(
  prisma: PrismaService,
  integrations: IntegrationRef[],
  dateFilter?: DateFilter,
): Promise<number> {
  const adsIds = integrations
    .filter(
      (i) =>
        (i.provider === 'META_ADS' || i.provider === 'GOOGLE_ADS') && i.status === 'ACTIVE',
    )
    .map((i) => i.id);

  if (adsIds.length === 0) return 0;

  const rows = await prisma.dailyMetric.findMany({
    where: {
      integrationId: { in: adsIds },
      metricType: { in: ['campaign', 'summary'] },
      ...(dateFilter ? { date: dateFilter } : {}),
    },
    select: { data: true },
  });

  return rows.reduce((sum, r) => {
    const d = r.data as { spend?: number };
    return sum + (d.spend ?? 0);
  }, 0);
}

/** Soma leads de campanhas Meta no período (campo leads dos insights). */
export async function sumMetaAdLeads(
  prisma: PrismaService,
  integrations: IntegrationRef[],
  dateFilter?: DateFilter,
): Promise<number> {
  const metaIds = integrations
    .filter((i) => i.provider === 'META_ADS' && i.status === 'ACTIVE')
    .map((i) => i.id);

  if (metaIds.length === 0) return 0;

  const rows = await prisma.dailyMetric.findMany({
    where: {
      integrationId: { in: metaIds },
      metricType: 'campaign',
      ...(dateFilter ? { date: dateFilter } : {}),
    },
    select: { data: true },
  });

  return rows.reduce((sum, r) => {
    const d = r.data as { leads?: number };
    return sum + (d.leads ?? 0);
  }, 0);
}
