import { apiRequest } from '@/lib/api-client'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AuditLogTable } from '@/components/audit-log/audit-log-table'
import { Pagination } from '@/components/ui/pagination'

export const metadata = {
  title: 'Histórico de Atividades | Trax',
}

const PAGE_SIZE = 20

interface SearchParams {
  page?: string
  search?: string
  action?: string
  entityType?: string
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1))
  const search = params.search ?? ''
  const action = params.action ?? ''
  const entityType = params.entityType ?? ''

  const host = (await headers()).get('host') ?? ''

  let logs: any[] = []
  let total = 0

  try {
    const qs = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
      ...(search && { search }),
      ...(action && { action }),
      ...(entityType && { entityType }),
    })
    const response = await apiRequest<{ data: any[]; total: number }>(
      `/audit-logs?${qs.toString()}`,
      { domain: host },
    )
    logs = response?.data ?? []
    total = response?.total ?? logs.length
  } catch (error) {
    if ((error as any)?.digest?.startsWith('NEXT_REDIRECT')) throw error
    console.error('Failed to fetch audit logs:', error)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-foreground)] tracking-tight">
          Histórico de Atividades
        </h2>
        <p className="text-[var(--color-muted-foreground)] mt-1">
          Registro de todas as ações realizadas na sua agência.
        </p>
      </div>

      <AuditLogTable
        logs={logs}
        currentSearch={search}
        currentAction={action}
        currentEntityType={entityType}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/audit-log"
        searchParams={{ search, action, entityType }}
      />
    </div>
  )
}
