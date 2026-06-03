import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ReportMetricsContext {
  reportTitle: string;
  clientName: string;
  period: string;
  current: {
    spend?: number;
    leads?: number;
    impressions?: number;
    clicks?: number;
    ctr?: number;
    roas?: number;
    cpl?: number;
  };
  previous?: {
    spend?: number;
    leads?: number;
    ctr?: number;
    roas?: number;
  };
}

export interface AiInsight {
  type: 'positive' | 'negative' | 'neutral' | 'alert';
  metric: string;
  message: string;
  delta?: number;
}

export interface ReportAiResult {
  summary: string;
  insights: AiInsight[];
}

const ANALYSIS_PROMPT = (ctx: ReportMetricsContext) => `
Você é um analista sênior de marketing digital. Analise os dados abaixo e gere:
1. Um SUMÁRIO EXECUTIVO em português (2-3 parágrafos, tom profissional), destacando resultados do período, comparações com o mês anterior e contexto estratégico.
2. Uma lista de INSIGHTS em JSON.

DADOS DO RELATÓRIO:
- Relatório: ${ctx.reportTitle}
- Cliente: ${ctx.clientName}
- Período: ${ctx.period}

MÉTRICAS DO PERÍODO ATUAL:
${ctx.current.spend !== undefined ? `- Gasto total: R$ ${ctx.current.spend.toFixed(2)}` : ''}
${ctx.current.leads !== undefined ? `- Leads gerados: ${ctx.current.leads}` : ''}
${ctx.current.impressions !== undefined ? `- Impressões: ${ctx.current.impressions.toLocaleString('pt-BR')}` : ''}
${ctx.current.clicks !== undefined ? `- Cliques: ${ctx.current.clicks.toLocaleString('pt-BR')}` : ''}
${ctx.current.ctr !== undefined ? `- CTR médio: ${ctx.current.ctr}%` : ''}
${ctx.current.roas !== undefined ? `- ROAS: ${ctx.current.roas}x` : ''}
${ctx.current.cpl !== undefined ? `- CPL médio: R$ ${ctx.current.cpl.toFixed(2)}` : ''}

${ctx.previous ? `MÉTRICAS DO PERÍODO ANTERIOR:
${ctx.previous.spend !== undefined ? `- Gasto: R$ ${ctx.previous.spend.toFixed(2)}` : ''}
${ctx.previous.leads !== undefined ? `- Leads: ${ctx.previous.leads}` : ''}
${ctx.previous.ctr !== undefined ? `- CTR: ${ctx.previous.ctr}%` : ''}
${ctx.previous.roas !== undefined ? `- ROAS: ${ctx.previous.roas}x` : ''}` : ''}

Responda APENAS com um JSON válido neste formato (sem markdown):
{
  "summary": "Texto do sumário aqui...",
  "insights": [
    { "type": "positive|negative|neutral|alert", "metric": "nome da métrica", "message": "mensagem curta", "delta": número_opcional }
  ]
}
`;

@Injectable()
export class ReportAiService {
  private readonly logger = new Logger(ReportAiService.name);
  private readonly genAI: GoogleGenerativeAI | null;
  private readonly modelName = 'gemini-1.5-flash';

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    this.genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY não configurada — análise de IA desativada.');
    }
  }

  async generateReportAnalysis(ctx: ReportMetricsContext): Promise<ReportAiResult | null> {
    if (!this.genAI) return null;

    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      const result = await model.generateContent(ANALYSIS_PROMPT(ctx));
      const text = result.response.text().trim();

      // Remove blocos de código markdown se o modelo os incluir
      const jsonText = text.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '').trim();
      const parsed = JSON.parse(jsonText) as ReportAiResult;

      return {
        summary: parsed.summary ?? '',
        insights: Array.isArray(parsed.insights) ? parsed.insights : [],
      };
    } catch (err) {
      this.logger.error(`Falha ao gerar análise IA: ${err}`);
      return null;
    }
  }

  /** Detecta anomalias comparando atual vs anterior (sem chamar Gemini) */
  detectAnomalies(ctx: ReportMetricsContext): AiInsight[] {
    const insights: AiInsight[] = [];
    const { current, previous } = ctx;
    if (!previous) return insights;

    const check = (
      metric: string,
      curr?: number,
      prev?: number,
      negativeThreshold = -0.2,
      positiveThreshold = 0.2,
    ) => {
      if (curr == null || prev == null || prev === 0) return;
      const delta = (curr - prev) / prev;
      if (delta <= negativeThreshold) {
        insights.push({
          type: delta <= -0.3 ? 'alert' : 'negative',
          metric,
          message: `Queda de ${Math.abs(Math.round(delta * 100))}% em relação ao período anterior`,
          delta: Math.round(delta * 100),
        });
      } else if (delta >= positiveThreshold) {
        insights.push({
          type: 'positive',
          metric,
          message: `Alta de ${Math.round(delta * 100)}% em relação ao período anterior`,
          delta: Math.round(delta * 100),
        });
      }
    };

    check('Leads', current.leads, previous.leads);
    check('Gasto', current.spend, previous.spend, -0.3, 0.3);
    check('CTR', current.ctr, previous.ctr);
    check('ROAS', current.roas, previous.roas);

    return insights;
  }
}
