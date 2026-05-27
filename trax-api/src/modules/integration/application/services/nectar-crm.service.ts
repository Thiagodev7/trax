import { Injectable } from '@nestjs/common';

interface NectarCredentials {
  apiToken: string;
  baseUrl?: string; // defaults to https://app.nectarcrm.com.br
}

@Injectable()
export class NectarCrmService {
  private baseUrl(creds: NectarCredentials) {
    return (creds.baseUrl ?? 'https://app.nectarcrm.com.br').replace(/\/$/, '');
  }

  private async nectarGet<T>(creds: NectarCredentials, path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl(creds)}/crm/api${path}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${creds.apiToken}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Nectar CRM API error: ${(err as any)?.message ?? res.statusText}`);
    }
    return res.json() as Promise<T>;
  }

  /** Fetch pipeline summary — contacts, wins, losses, revenue */
  async fetchLeadboard(creds: NectarCredentials): Promise<Record<string, unknown>> {
    const data = await this.nectarGet<{
      total_contatos?: number;
      oportunidades_abertas?: number;
      oportunidades_ganhas?: number;
      oportunidades_perdidas?: number;
      receita_total?: number;
      ticket_medio?: number;
      mrr?: number;
      historico_mensal?: Array<{
        mes: string;
        ganhas: number;
        perdidas: number;
        receita: number;
      }>;
      funil?: Array<{ etapa: string; quantidade: number; valor: number }>;
    }>(creds, '/negociacoes/resumo');

    return {
      totalContatos: data.total_contatos ?? 0,
      oportunidadesAbertas: data.oportunidades_abertas ?? 0,
      oportunidadesGanhas: data.oportunidades_ganhas ?? 0,
      oportunidadesPerdidas: data.oportunidades_perdidas ?? 0,
      qualificacao: data.oportunidades_abertas ?? 0,
      agendamento: 0,
      qualificada: 0,
      receitaTotal: data.receita_total ?? 0,
      ticketMedio: data.ticket_medio ?? 0,
      mrr: data.mrr ?? 0,
      historicoMensal: data.historico_mensal ?? [],
      funil: data.funil ?? [],
      byOrigin: {
        'Meta Ads': {
          contatos: data.total_contatos ?? 0,
          qualificacao: data.oportunidades_abertas ?? 0,
          vendidas: data.oportunidades_ganhas ?? 0,
          perdidas: data.oportunidades_perdidas ?? 0,
        },
      },
    };
  }

  /** Fetch contacts created in a date range */
  async fetchContacts(
    creds: NectarCredentials,
    since: string,
    until: string,
  ): Promise<Array<Record<string, unknown>>> {
    const data = await this.nectarGet<{ results: Array<Record<string, unknown>> }>(
      creds,
      '/contatos',
      { created_after: since, created_before: until, limit: '500' },
    );
    return data.results ?? [];
  }

  async testConnection(creds: NectarCredentials): Promise<{ valid: boolean; name?: string }> {
    try {
      await this.fetchLeadboard(creds);
      return { valid: true, name: 'Nectar CRM' };
    } catch {
      return { valid: false };
    }
  }
}
