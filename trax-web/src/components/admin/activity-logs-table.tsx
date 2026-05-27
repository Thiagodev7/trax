import Link from 'next/link'
import {
  ACTION_LABELS,
  ACTOR_LABELS,
  AuditLogEntry,
  ENTITY_LABELS,
} from '@/lib/admin-api'

export function ActivityLogsTable({
  logs,
  showAgency = true,
}: {
  logs: AuditLogEntry[]
  showAgency?: boolean
}) {
  if (logs.length === 0) {
    return (
      <p className="text-sm text-white/30 text-center py-16">
        Nenhuma atividade registrada ainda
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.06] bg-white/[0.02]">
            {[
              'Data',
              ...(showAgency ? ['Agência'] : []),
              'Ação',
              'Tipo',
              'Descrição',
              'Autor',
              'IP',
            ].map((h) => (
              <th
                key={h}
                className="px-6 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-white/[0.02]">
              <td className="px-6 py-4 text-white/40 text-xs whitespace-nowrap">
                {new Date(log.createdAt).toLocaleString('pt-BR')}
              </td>
              {showAgency && (
                <td className="px-6 py-4">
                  {log.agency ? (
                    <Link
                      href={`/admin-panel/agencies/${log.agency.id}`}
                      className="text-indigo-400 hover:text-indigo-300 text-sm"
                    >
                      {log.agency.name}
                    </Link>
                  ) : (
                    <span className="text-white/30 text-xs italic">Agência removida</span>
                  )}
                </td>
              )}
              <td className="px-6 py-4">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full border text-indigo-300 bg-indigo-500/10 border-indigo-500/20">
                  {ACTION_LABELS[log.action] ?? log.action}
                </span>
              </td>
              <td className="px-6 py-4 text-white/50 text-xs">
                {ENTITY_LABELS[log.entityType] ?? log.entityType}
              </td>
              <td className="px-6 py-4 text-white/70 max-w-xs">
                <p className="truncate" title={log.description}>
                  {log.description}
                </p>
                {log.entityName && (
                  <p className="text-xs text-white/30 mt-0.5 truncate">{log.entityName}</p>
                )}
              </td>
              <td className="px-6 py-4 text-white/50 text-xs">
                {log.user ? (
                  <span>{log.user.name}</span>
                ) : (
                  <span>{ACTOR_LABELS[log.actorType] ?? log.actorType}</span>
                )}
              </td>
              <td className="px-6 py-4 text-white/30 text-xs font-mono">
                {log.ipAddress ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
