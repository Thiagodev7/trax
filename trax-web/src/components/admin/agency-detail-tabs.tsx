'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { AgencyEditForm } from './agency-edit-form'
import { DeleteAgencyDialog } from './delete-agency-dialog'
import {
  AgencyDetail,
  AdminUser,
  AgencyClient,
  AgencyIntegration,
  AuditLogEntry,
  PLAN_LABELS,
  ROLE_LABELS,
  tenantUrl,
} from '@/lib/admin-api'
import { ActivityLogsTable } from './activity-logs-table'

const TABS = [
  { id: 'general', label: 'Geral' },
  { id: 'users', label: 'Usuários' },
  { id: 'clients', label: 'Clientes' },
  { id: 'integrations', label: 'Integrações' },
  { id: 'activity', label: 'Atividade' },
] as const

type TabId = (typeof TABS)[number]['id']

export function AgencyDetailTabs({
  agency,
  users,
  clients,
  integrations,
  auditLogs,
}: {
  agency: AgencyDetail
  users: AdminUser[]
  clients: AgencyClient[]
  integrations: AgencyIntegration[]
  auditLogs: AuditLogEntry[]
}) {
  const [tab, setTab] = useState<TabId>('general')

  return (
    <div className="space-y-6">
      <div className="flex gap-1 bg-white/[0.03] border border-white/[0.07] rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === t.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'text-white/40 hover:text-white/70',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <div className="space-y-6">
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
            <h2 className="text-sm font-bold text-white mb-5">Editar agência</h2>
            <AgencyEditForm agency={agency} />
          </div>

          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
            <h2 className="text-sm font-bold text-white mb-5">Informações</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              {[
                { label: 'ID', value: agency.id },
                { label: 'Portal', value: tenantUrl(agency.slug) },
                { label: 'Stripe Customer', value: agency.stripeCustomerId ?? '—' },
                { label: 'Stripe Subscription', value: agency.stripeSubscriptionId ?? '—' },
                { label: 'Plano', value: PLAN_LABELS[agency.plan] ?? agency.plan },
                { label: 'Atualizada em', value: new Date(agency.updatedAt).toLocaleString('pt-BR') },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="text-xs text-white/30 mb-1">{item.label}</dt>
                  <dd className="font-medium text-white/70 break-all">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {agency.recentIntegrationErrors.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/15 rounded-2xl p-6">
              <h2 className="text-sm font-bold text-red-300 mb-4">Erros recentes de integração</h2>
              <div className="space-y-3">
                {agency.recentIntegrationErrors.map((err) => (
                  <div key={err.id} className="text-sm border-b border-red-500/10 pb-3 last:border-0 last:pb-0">
                    <p className="font-medium text-white/80">
                      {err.provider} — {err.client.name}
                    </p>
                    <p className="text-white/40 text-xs mt-1">{err.lastErrorMsg ?? 'Erro desconhecido'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <DeleteAgencyDialog agencyId={agency.id} agencyName={agency.name} />
          </div>
        </div>
      )}

      {tab === 'users' && (
        <DataTable
          empty="Nenhum usuário nesta agência"
          headers={['Nome', 'E-mail', 'Role', 'Status', 'Último login']}
          rows={users.map((u) => [
            u.name,
            u.email,
            ROLE_LABELS[u.role] ?? u.role,
            u.isActive ? 'Ativo' : 'Inativo',
            u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('pt-BR') : '—',
          ])}
        />
      )}

      {tab === 'clients' && (
        <DataTable
          empty="Nenhum cliente nesta agência"
          headers={['Nome', 'E-mail', 'Integrações', 'Relatórios', 'Status']}
          rows={clients.map((c) => [
            c.name,
            c.email ?? '—',
            String(c._count.integrations),
            String(c._count.reports),
            c.isActive ? 'Ativo' : 'Inativo',
          ])}
        />
      )}

      {tab === 'integrations' && (
        <DataTable
          empty="Nenhuma integração nesta agência"
          headers={['Provider', 'Cliente', 'Status', 'Último sync', 'Erro']}
          rows={integrations.map((i) => [
            i.provider,
            i.client.name,
            i.status,
            i.lastSyncAt ? new Date(i.lastSyncAt).toLocaleString('pt-BR') : '—',
            i.lastErrorMsg ? i.lastErrorMsg.slice(0, 60) + (i.lastErrorMsg.length > 60 ? '…' : '') : '—',
          ])}
        />
      )}

      {tab === 'activity' && (
        <ActivityLogsTable logs={auditLogs} showAgency={false} />
      )}
    </div>
  )
}

function DataTable({
  headers,
  rows,
  empty,
}: {
  headers: string[]
  rows: string[][]
  empty: string
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-white/30 text-center py-12">{empty}</p>
  }

  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
              {headers.map((h) => (
                <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-white/[0.02]">
                {row.map((cell, j) => (
                  <td key={j} className="px-6 py-3 text-white/70">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
