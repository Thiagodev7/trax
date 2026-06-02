/**
 * RD Station Marketing — Data Sync Service
 *
 * Sincroniza leads/oportunidades para DailyMetric, similar ao Nectar CRM.
 * Docs: https://developers.rdstation.com/reference/
 */
import { Injectable } from '@nestjs/common';

interface RdsCredentials {
  accessToken: string;
  refreshToken: string;
}

interface RdsContact {
  uuid: string;
  name: string;
  email: string;
  created_at: string;
  last_conversion?: { created_at: string };
  tags?: string[];
  lifecycle_stage?: string;  // 'Lead', 'Qualified Lead', 'Customer', 'Churned'
  conversion_identifier?: string;
}

interface RdsConversion {
  created_at: string;
  contact: { uuid: string; email: string };
  event_type: string;
}

const RDS_API = 'https://api.rd.services';

@Injectable()
export class RdStationService {
  private async rdsGet<T>(creds: RdsCredentials, path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${RDS_API}${path}`);
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${creds.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`RD Station API error: ${(err as any)?.error?.message ?? res.statusText}`);
    }
    return res.json() as Promise<T>;
  }

  /** Busca leads criados em um intervalo de datas */
  async fetchLeads(creds: RdsCredentials, startDate: string, endDate: string): Promise<{
    total: number;
    newLeads: number;
    qualifiedLeads: number;
    customers: number;
    conversionsByDay: Record<string, number>;
  }> {
    // GET /platform/contacts com filtro por data
    const data = await this.rdsGet<{ contacts: RdsContact[]; total: number }>(
      creds,
      '/platform/contacts',
      {
        page_size: '200',
        order: 'created_at',
        direction: 'desc',
        // API suporta created_at[gte] e created_at[lte] como query params
        'created_at[gte]': startDate,
        'created_at[lte]': endDate,
      },
    );

    const contacts = data.contacts ?? [];
    const conversionsByDay: Record<string, number> = {};

    let newLeads = 0;
    let qualifiedLeads = 0;
    let customers = 0;

    for (const contact of contacts) {
      const day = contact.created_at?.slice(0, 10);
      if (day) conversionsByDay[day] = (conversionsByDay[day] ?? 0) + 1;

      const stage = (contact.lifecycle_stage ?? '').toLowerCase();
      if (stage.includes('qualified')) qualifiedLeads++;
      else if (stage.includes('customer')) customers++;
      else newLeads++;
    }

    return {
      total: data.total ?? contacts.length,
      newLeads,
      qualifiedLeads,
      customers,
      conversionsByDay,
    };
  }

  /** Busca conversões recentes (eventos de formulário) */
  async fetchConversions(creds: RdsCredentials, startDate: string, endDate: string): Promise<RdsConversion[]> {
    const data = await this.rdsGet<{ events: RdsConversion[] }>(
      creds,
      '/platform/events',
      {
        event_type: 'CONVERSION',
        page_size: '200',
        'created_at[gte]': startDate,
        'created_at[lte]': endDate,
      },
    );
    return data.events ?? [];
  }

  /** Testa conexão — retorna nome da conta */
  async testConnection(creds: RdsCredentials): Promise<{ valid: boolean; name?: string }> {
    try {
      const data = await this.rdsGet<{ name?: string; email?: string }>(creds, '/platform/account');
      return { valid: true, name: data.name };
    } catch {
      return { valid: false };
    }
  }

  /**
   * Sincroniza leads para DailyMetric (chamado pelo SyncIntegrationUseCase).
   * Retorna um snapshot diário para armazenar em metrics.
   */
  async syncLeads(creds: RdsCredentials, startDate: string, endDate: string): Promise<{
    metrics: Record<string, { leads: number; qualifiedLeads: number; customers: number }>;
  }> {
    const { conversionsByDay, qualifiedLeads, customers } = await this.fetchLeads(creds, startDate, endDate);

    const metrics: Record<string, { leads: number; qualifiedLeads: number; customers: number }> = {};
    for (const [day, leads] of Object.entries(conversionsByDay)) {
      metrics[day] = { leads, qualifiedLeads, customers };
    }

    return { metrics };
  }
}
