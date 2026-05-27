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
}

export function generateMetaInsights(input: InsightInput): string[] {
  const insights: string[] = [];
  const { summary, adsetTable = [], creatives = [] } = input;

  if (summary.ctr >= 1.0) {
    insights.push(`CTR excelente (${summary.ctr.toFixed(2)}%) — criativos gerando cliques acima da média.`);
  } else if (summary.ctr < 0.7) {
    insights.push(`CTR baixo (${summary.ctr.toFixed(2)}%) — considere testar novos criativos ou revisar público.`);
  }

  if (summary.cpl > 0 && summary.cpl <= 80) {
    insights.push(`CPL saudável (${summary.cpl.toFixed(0)} BRL) para o período analisado.`);
  } else if (summary.cpl > 150) {
    insights.push(`CPL elevado (${summary.cpl.toFixed(0)} BRL) — revise segmentação e landing pages.`);
  }

  if (summary.cpc > 8) {
    insights.push(`CPC alto (${summary.cpc.toFixed(2)} BRL) — otimize lances ou qualidade do anúncio.`);
  }

  const activeAdsets = adsetTable.filter((a) => a.status === 'ACTIVE' || a.status === 'active').length;
  if (activeAdsets > 0) {
    insights.push(`${activeAdsets} conjunto(s) ativo(s) no período.`);
  }

  const topCreative = [...creatives].sort((a, b) => b.leads - a.leads)[0];
  if (topCreative && topCreative.leads > 0) {
    insights.push(`Melhor criativo: "${topCreative.ad_name}" com ${topCreative.leads} leads.`);
  }

  const lowCtrAdsets = adsetTable.filter((a) => a.ctr < 0.5 && a.leads === 0);
  if (lowCtrAdsets.length > 0) {
    insights.push(`${lowCtrAdsets.length} conjunto(s) sem leads e CTR abaixo de 0,5%.`);
  }

  if (summary.totalLeads === 0 && summary.totalSpend > 0) {
    insights.push('Investimento sem leads no período — verifique pixel/formulário de captação.');
  }

  return insights.slice(0, 6);
}
