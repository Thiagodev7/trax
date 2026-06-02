'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, ShieldCheck, User, FileText, Plug, LogIn, LogOut, Edit3,
  Trash2, Upload, RefreshCw, Filter, Activity,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AuditLog {
  id: string
  action: string
  entityType: string
  entityId: string | null
  entityName: string | null
  description: string
  actorType: 'AGENCY_USER' | 'SUPER_ADMIN' | 'SYSTEM'
  userId: string | null
  createdAt: string
  user: { id: string; name: string; email: string } | null
}

interface AuditLogTableProps {
  logs: AuditLog[]
  currentSearch: string
  currentAction: string
  currentEntityType: string
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  LOGIN: LogIn,
  LOGOUT: LogOut,
  CREATE: Edit3,
  UPDATE: Edit3,
  DELETE: Trash2,
  PUBLISH: Upload,
  SYNC: RefreshCw,
  INVITE: User,
  TEST: ShieldCheck,
}

const ACTION_COLORS: Record<string, string> = {
  LOGIN: 'text-emerald-500 bg-emerald-500/10',
  LOGOUT: 'text-slate-400 bg-slate-500/10',
  CREATE: 'text-blue-500 bg-blue-500/10',
  UPDATE: 'text-amber-500 bg-amber-500/10',
  DELETE: 'text-red-500 bg-red-500/10',
  PUBLISH: 'text-violet-500 bg-violet-500/10',
  SYNC: 'text-sky-500 bg-sky-500/10',
  INVITE: 'text-indigo-500 bg-indigo-500/10',
  TEST: 'text-teal-500 bg-teal-500/10',
}

const ENTITY_ICONS: Record<string, React.ElementType> = {
  AUTH: LogIn,
  USER: User,
  CLIENT: User,
  REPORT: FileText,
  INTEGRATION: Plug,
  AGENCY: ShieldCheck,
}

const ACTIONS = ['LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'SYNC', 'INVITE']
const ENTITY_TYPES = ['AUTH', 'USER', 'CLIENT', 'REPORT', 'INTEGRATION', 'AGENCY']

function ActorBadge({ actorType, user }: { actorType: string; user: AuditLog['user'] }) {
  if (actorType === 'SYSTEM') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-[var(--color-muted-foreground)] bg-[var(--color-surface-2)] border border-[var(--color-border)] px-2 py-0.5 rounded-full">
        <Activity className="w-3 h-3" />
        Sistema
      </span>
    )
  }
  if (actorType === 'SUPER_ADMIN') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
        <ShieldCheck className="w-3 h-3" />
        Super Admin
      </span>
    )
  }
  return (
    <span className="text-xs text-[var(--color-foreground-muted)]">
      {user?.name ?? 'Usuário removido'}
    </span>
  )
}

export function AuditLogTable({
  logs,
  currentSearch,
  currentAction,
  currentEntityType,
}: AuditLogTableProps) {
  const router = useRouter()
  const [search, setSearch] = useState(currentSearch)
  const [action, setAction] = useState(currentAction)
  const [entityType, setEntityType] = useState(currentEntityType)

  function applyFilters() {
    const qs = new URLSearchParams({ page: '1' })
    if (search) qs.set('search', search)
    if (action) qs.set('action', action)
    if (entityType) qs.set('entityType', entityType)
    router.push(`/audit-log?${qs.toString()}`)
  }

  function clearFilters() {
    setSearch('')
    setAction('')
    setEntityType('')
    router.push('/audit-log')
  }

  const hasFilters = search || action || entityType

  return (
    <div className="card overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-[var(--color-border)] flex flex-col sm:flex-row gap-3 bg-[var(--color-surface)]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            placeholder="Buscar por descrição ou entidade..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          />
        </div>

        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="py-2 px-3 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
        >
          <option value="">Todas as ações</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <select
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          className="py-2 px-3 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
        >
          <option value="">Todos os tipos</option>
          {ENTITY_TYPES.map((et) => (
            <option key={et} value={et}>{et}</option>
          ))}
        </select>

        <div className="flex gap-2">
          <button
            onClick={applyFilters}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] rounded-lg hover:opacity-90 transition-all"
          >
            <Filter className="w-4 h-4" />
            Filtrar
          </button>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm font-medium text-[var(--color-foreground)] bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface)] transition-all"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-[var(--color-muted-foreground)] uppercase bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
            <tr>
              <th className="px-4 py-3 font-medium text-left">Ação</th>
              <th className="px-4 py-3 font-medium text-left">Entidade</th>
              <th className="px-4 py-3 font-medium text-left">Descrição</th>
              <th className="px-4 py-3 font-medium text-left">Ator</th>
              <th className="px-4 py-3 font-medium text-left">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center">
                      <Activity className="w-6 h-6 text-[var(--color-muted)]" />
                    </div>
                    <p className="font-medium text-[var(--color-foreground)]">Nenhuma atividade registrada</p>
                    <p className="text-sm text-[var(--color-muted-foreground)]">
                      {hasFilters ? 'Tente ajustar os filtros' : 'As ações da sua agência aparecerão aqui'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const ActionIcon = ACTION_ICONS[log.action] ?? Activity
                const EntityIcon = ENTITY_ICONS[log.entityType] ?? Activity
                const actionColor = ACTION_COLORS[log.action] ?? 'text-[var(--color-muted)] bg-[var(--color-surface-2)]'

                return (
                  <tr key={log.id} className="hover:bg-[var(--color-surface-2)] transition-colors">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${actionColor}`}>
                        <ActionIcon className="w-3 h-3" />
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <EntityIcon className="w-4 h-4 text-[var(--color-muted-foreground)] shrink-0" />
                        <div>
                          <span className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wide">
                            {log.entityType}
                          </span>
                          {log.entityName && (
                            <p className="text-xs text-[var(--color-foreground)] mt-0.5 max-w-[140px] truncate">
                              {log.entityName}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-sm text-[var(--color-foreground)] truncate" title={log.description}>
                        {log.description}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <ActorBadge actorType={log.actorType} user={log.user} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-[var(--color-muted-foreground)]">
                        {format(new Date(log.createdAt), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {logs.length > 0 && (
        <div className="px-4 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-muted-foreground)]">
          {logs.length} atividade{logs.length !== 1 ? 's' : ''} nesta página
        </div>
      )}
    </div>
  )
}
