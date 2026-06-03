/**
 * Nectar CRM — Data Sync Service
 * API v1: https://app.nectarcrm.com.br/crm/api/1/
 */
import { Injectable, Logger } from '@nestjs/common';

export interface NectarCredentials {
  apiToken: string;
  baseUrl?: string;
}

interface NectarListMeta {
  total?: number;
  pagina?: number;
  totalPaginas?: number;
}

const API_VERSION = '/1';
const PAGE_SIZE = 100;
const MAX_PAGES = 20;

export function parseNectarDate(value: unknown): string | null {
  if (!value || typeof value !== 'string') return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    const br = value.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (br) return `${br[3]}-${br[2]}-${br[1]}`;
    return null;
  }
  return d.toISOString().slice(0, 10);
}

export function extractList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    for (const key of ['results', 'contatos', 'oportunidades', 'data', 'lista']) {
      if (Array.isArray(o[key])) return o[key] as T[];
    }
  }
  return [];
}

export interface NectarDailyRow {
  contacts: number;
  opportunities: number;
}

export interface NectarSyncResult {
  dailyBreakdown: Record<string, NectarDailyRow>;
  summary: Record<string, unknown>;
}

@Injectable()
export class NectarCrmService {
  private readonly logger = new Logger(NectarCrmService.name);

  private apiRoot(creds: NectarCredentials): string {
    return `${(creds.baseUrl ?? 'https://app.nectarcrm.com.br').replace(/\/$/, '')}/crm/api${API_VERSION}`;
  }

  private async nectarGet<T>(
    creds: NectarCredentials,
    path: string,
    params?: Record<string, string>,
  ): Promise<T> {
    const url = new URL(`${this.apiRoot(creds)}${path}`);
    url.searchParams.set('api_token', creds.apiToken);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    const res = await fetch(url.toString(), {
      headers: {
        'Access-Token': creds.apiToken,
        Authorization: `Bearer ${creds.apiToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      this.logger.error(`Nectar ${res.status} ${path} → ${body.slice(0, 300)}`);
      throw new Error(`Nectar CRM API error ${res.status}: ${body.slice(0, 120) || res.statusText}`);
    }

    return res.json() as Promise<T>;
  }

  private async fetchAllPages<T>(
    creds: NectarCredentials,
    path: string,
    extraParams?: Record<string, string>,
  ): Promise<T[]> {
    const all: T[] = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
      const raw = await this.nectarGet<unknown>(creds, path, {
        page: String(page),
        displayLength: String(PAGE_SIZE),
        ...extraParams,
      });
      const batch = extractList<T>(raw);
      all.push(...batch);
      const meta = raw as NectarListMeta;
      if (batch.length < PAGE_SIZE) break;
      if (meta.totalPaginas != null && page >= meta.totalPaginas) break;
    }
    return all;
  }

  /** Lista contatos e filtra por data de criação no período */
  async fetchContactsInPeriod(
    creds: NectarCredentials,
    startDate: string,
    endDate: string,
  ): Promise<Array<Record<string, unknown>>> {
    const startTs = new Date(startDate).getTime();
    const endTs = new Date(endDate).getTime() + 86400_000;

    const all = await this.fetchAllPages<Record<string, unknown>>(creds, '/contatos');
    return all.filter((c) => {
      const day =
        parseNectarDate(c.dataCriacao) ??
        parseNectarDate(c.criadoEm) ??
        parseNectarDate(c.created_at);
      if (!day) return false;
      const ts = new Date(day).getTime();
      return ts >= startTs && ts <= endTs;
    });
  }

  /** Lista oportunidades (negócios) */
  async fetchOpportunities(creds: NectarCredentials): Promise<Array<Record<string, unknown>>> {
    return this.fetchAllPages<Record<string, unknown>>(creds, '/oportunidades');
  }

  private classifyOppStatus(opp: Record<string, unknown>): 'open' | 'won' | 'lost' {
    const status = String(opp.status ?? opp.statusOportunidade ?? opp.situacao ?? '').toLowerCase();
    const nome = String(opp.nomeStatus ?? opp.statusNome ?? '').toLowerCase();
    if (
      status.includes('ganh') ||
      status.includes('won') ||
      status === '1' ||
      nome.includes('ganh')
    ) {
      return 'won';
    }
    if (
      status.includes('perd') ||
      status.includes('lost') ||
      status === '2' ||
      nome.includes('perd')
    ) {
      return 'lost';
    }
    return 'open';
  }

  private parseRevenue(opp: Record<string, unknown>): number {
    const v = opp.valorTotal ?? opp.valor ?? opp.receita ?? opp.amount ?? 0;
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    return Number.isFinite(n) ? n : 0;
  }

  /** Agrega resumo CRM a partir de oportunidades + contatos */
  async buildSummary(
    creds: NectarCredentials,
    contactsInPeriod: Array<Record<string, unknown>>,
    opportunities: Array<Record<string, unknown>>,
  ): Promise<Record<string, unknown>> {
    let oportunidadesAbertas = 0;
    let oportunidadesGanhas = 0;
    let oportunidadesPerdidas = 0;
    let receitaTotal = 0;
    const funilMap = new Map<string, { quantidade: number; valor: number }>();
    const byOriginMap = new Map<string, { contatos: number; qualificacao: number; vendidas: number; perdidas: number }>();

    for (const opp of opportunities) {
      const kind = this.classifyOppStatus(opp);
      const valor = this.parseRevenue(opp);
      if (kind === 'won') {
        oportunidadesGanhas++;
        receitaTotal += valor;
      } else if (kind === 'lost') {
        oportunidadesPerdidas++;
      } else {
        oportunidadesAbertas++;
      }

      const etapa = String(opp.etapa ?? opp.nomeEtapa ?? opp.fase ?? 'Oportunidades').trim();
      const cur = funilMap.get(etapa) ?? { quantidade: 0, valor: 0 };
      cur.quantidade++;
      cur.valor += valor;
      funilMap.set(etapa, cur);

      const origem = String(opp.origem ?? opp.origemOportunidade ?? opp.utmSource ?? '').trim();
      if (origem) {
        const o = byOriginMap.get(origem) ?? { contatos: 0, qualificacao: 0, vendidas: 0, perdidas: 0 };
        if (kind === 'won') o.vendidas++;
        else if (kind === 'lost') o.perdidas++;
        else o.qualificacao++;
        byOriginMap.set(origem, o);
      }
    }

    for (const c of contactsInPeriod) {
      const origem = String(c.origem ?? c.utmSource ?? c.fonte ?? '').trim();
      if (origem) {
        const o = byOriginMap.get(origem) ?? { contatos: 0, qualificacao: 0, vendidas: 0, perdidas: 0 };
        o.contatos++;
        byOriginMap.set(origem, o);
      }
    }

    const funil = Array.from(funilMap.entries()).map(([etapa, v]) => ({
      etapa,
      quantidade: v.quantidade,
      valor: Math.round(v.valor * 100) / 100,
    }));

    const byOrigin: Record<string, unknown> = {};
    for (const [k, v] of byOriginMap.entries()) {
      byOrigin[k] = v;
    }

    const totalContatos = contactsInPeriod.length;
    const ticketMedio = oportunidadesGanhas > 0 ? receitaTotal / oportunidadesGanhas : 0;

    return {
      totalContatos,
      oportunidadesAbertas,
      oportunidadesGanhas,
      oportunidadesPerdidas,
      qualificacao: oportunidadesAbertas,
      agendamento: 0,
      qualificada: 0,
      receitaTotal: Math.round(receitaTotal * 100) / 100,
      ticketMedio: Math.round(ticketMedio * 100) / 100,
      mrr: 0,
      historicoMensal: [],
      funil,
      byOrigin,
    };
  }

  async syncData(
    creds: NectarCredentials,
    startDate: string,
    endDate: string,
  ): Promise<NectarSyncResult> {
    const contacts = await this.fetchContactsInPeriod(creds, startDate, endDate);
    let opportunities: Array<Record<string, unknown>> = [];
    try {
      opportunities = await this.fetchOpportunities(creds);
    } catch (err: unknown) {
      this.logger.warn(`Nectar oportunidades indisponível: ${err instanceof Error ? err.message : err}`);
    }

    const dailyBreakdown: Record<string, NectarDailyRow> = {};
    for (const c of contacts) {
      const day =
        parseNectarDate(c.dataCriacao) ??
        parseNectarDate(c.criadoEm) ??
        parseNectarDate(c.created_at);
      if (!day) continue;
      if (!dailyBreakdown[day]) dailyBreakdown[day] = { contacts: 0, opportunities: 0 };
      dailyBreakdown[day].contacts++;
    }

    const summary = await this.buildSummary(creds, contacts, opportunities);
    return { dailyBreakdown, summary };
  }

  /** @deprecated Use syncData — mantido para compatibilidade com testConnection legado */
  async fetchLeadboard(creds: NectarCredentials): Promise<Record<string, unknown>> {
    const end = new Date().toISOString().slice(0, 10);
    const start = new Date(Date.now() - 90 * 86400_000).toISOString().slice(0, 10);
    const { summary } = await this.syncData(creds, start, end);
    return summary;
  }

  async testConnection(creds: NectarCredentials): Promise<{ valid: boolean; name?: string }> {
    try {
      await this.nectarGet<unknown>(creds, '/contatos', { page: '1', displayLength: '1' });
      return { valid: true, name: 'Nectar CRM' };
    } catch {
      return { valid: false };
    }
  }
}
