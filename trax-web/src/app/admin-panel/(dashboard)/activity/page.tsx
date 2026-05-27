import Link from 'next/link'
import { ScrollText } from 'lucide-react'
import { ActivityLogsTable } from '@/components/admin/activity-logs-table'
import { adminListAgencies, adminListAuditLogs, ACTION_LABELS, ENTITY_LABELS } from '@/lib/admin-api'

const ACTIONS = Object.keys(ACTION_LABELS)
const ENTITIES = Object.keys(ENTITY_LABELS)

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    search?: string
    agencyId?: string
    action?: string
    entityType?: string
  }>
}) {
  const params = await searchParams
  const page = Number(params.page ?? 1)

  const [logsResult, agenciesResult] = await Promise.all([
    adminListAuditLogs({
      page,
      search: params.search,
      agencyId: params.agencyId,
      action: params.action,
      entityType: params.entityType,
    }),
    adminListAgencies({ limit: 100 }),
  ])

  function buildUrl(overrides: Record<string, string | undefined>) {
    const qs = new URLSearchParams()
    const merged = {
      page: String(page),
      search: params.search,
      agencyId: params.agencyId,
      action: params.action,
      entityType: params.entityType,
      ...overrides,
    }
    Object.entries(merged).forEach(([k, v]) => {
      if (v) qs.set(k, v)
    })
    return `/admin-panel/activity?${qs.toString()}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
          <ScrollText className="w-7 h-7 text-indigo-400" />
          Atividade
        </h1>
        <p className="text-sm text-white/40 mt-1">
          {logsResult
            ? `${logsResult.total} eventos registrados em todas as agências`
            : 'Logs de ações realizadas pelas agências'}
        </p>
      </div>

      <form className="flex flex-col lg:flex-row gap-3 flex-wrap">
        <input
          name="search"
          defaultValue={params.search ?? ''}
          placeholder="Buscar na descrição..."
          className="flex-1 min-w-[200px] bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/50"
        />
        <select
          name="agencyId"
          defaultValue={params.agencyId ?? ''}
          className="bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white min-w-[180px]"
        >
          <option value="">Todas agências</option>
          {agenciesResult?.data.map((a) => (
            <option key={a.id} value={a.id} className="bg-[#1a1a2e]">
              {a.name}
            </option>
          ))}
        </select>
        <select
          name="action"
          defaultValue={params.action ?? ''}
          className="bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white"
        >
          <option value="">Todas ações</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a} className="bg-[#1a1a2e]">
              {ACTION_LABELS[a]}
            </option>
          ))}
        </select>
        <select
          name="entityType"
          defaultValue={params.entityType ?? ''}
          className="bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white"
        >
          <option value="">Todos tipos</option>
          {ENTITIES.map((e) => (
            <option key={e} value={e} className="bg-[#1a1a2e]">
              {ENTITY_LABELS[e]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="px-5 py-2.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl"
        >
          Filtrar
        </button>
      </form>

      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
        <ActivityLogsTable logs={logsResult?.data ?? []} />

        {logsResult && logsResult.total > logsResult.limit && (
          <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-between">
            <p className="text-xs text-white/30">
              Mostrando {(page - 1) * logsResult.limit + 1}–
              {Math.min(page * logsResult.limit, logsResult.total)} de {logsResult.total}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={buildUrl({ page: String(page - 1) })}
                  className="px-3 py-1.5 text-xs font-medium text-white/50 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10"
                >
                  Anterior
                </Link>
              )}
              {page * logsResult.limit < logsResult.total && (
                <Link
                  href={buildUrl({ page: String(page + 1) })}
                  className="px-3 py-1.5 text-xs font-medium text-white/50 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10"
                >
                  Próxima
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
