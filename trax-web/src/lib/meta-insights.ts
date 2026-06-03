import type { MetaConfigShape } from './meta-heuristics'

interface InsightInput {
  summary: {
    totalSpend: number;
    totalLeads: number;
    totalImpressions: number;
    totalClicks: number;
    cpl: number;
    ctr: number;
    cpc: number;
    cpm: number;
  };
  adsetTable?: Array<{ name: string; status: string; ctr: number; cpc: number; cpl: number | null; leads: number }>;
  creatives?: Array<{ ad_name: string; leads: number; cpl: number | null }>;
  config?: MetaConfigShape | null;
}

export function generateMetaInsights(input: InsightInput): string[] {
  const insights: string[] = [];
  const { summary, adsetTable = [], creatives = [], config } = input;
  const t = config?.thresholds ?? {
    ctr: { good: 1.0, warn: 0.7 },
    cpc: { warn: 6.0, bad: 10.0 },
    cpm: { warn: 45, bad: 70 },
    cpl: { warn: 80, bad: 150 },
  };

  if (summary.ctr >= t.ctr.good) {
    insights.push(`CTR excelente (${summary.ctr.toFixed(2)}%) — criativos gerando cliques acima da média.`);
  } else if (summary.ctr < t.ctr.warn) {
    insights.push(`CTR baixo (${summary.ctr.toFixed(2)}%) — considere testar novos criativos ou revisar público.`);
  }

  if (summary.cpl > 0 && summary.cpl <= t.cpl.warn) {
    insights.push(`CPL saudável (R$ ${summary.cpl.toFixed(0)}) para o período analisado.`);
  } else if (summary.cpl > (t.cpl.bad ?? 150)) {
    insights.push(`CPL elevado (R$ ${summary.cpl.toFixed(0)}) — revise segmentação e landing pages.`);
  }

  if (summary.cpc > (t.cpc.bad ?? 10)) {
    insights.push(`CPC alto (R$ ${summary.cpc.toFixed(2)}) — otimize lances ou qualidade do anúncio.`);
  }

  const activeAdsets = adsetTable.filter((a) => a.status === 'ACTIVE' || a.status === 'active').length;
  if (activeAdsets > 0) {
    insights.push(`${activeAdsets} conjunto(s) ativo(s) no período.`);
  }

  const topCreative = [...creatives].sort((a, b) => b.leads - a.leads)[0];
  if (topCreative && topCreative.leads > 0) {
    insights.push(`Melhor criativo: "${topCreative.ad_name}" com ${topCreative.leads} leads.`);
  }

  const lowCtrAdsets = adsetTable.filter((a) => a.ctr < t.ctr.warn * 0.7 && a.leads === 0);
  if (lowCtrAdsets.length > 0) {
    insights.push(`${lowCtrAdsets.length} conjunto(s) sem leads e CTR muito abaixo do mínimo.`);
  }

  if (summary.totalLeads === 0 && summary.totalSpend > 0) {
    insights.push('Investimento sem leads no período — verifique pixel/formulário de captação.');
  }

  return insights.slice(0, 6);
}
