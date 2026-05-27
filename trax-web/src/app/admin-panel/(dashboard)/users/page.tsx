import Link from 'next/link'
import { Search } from 'lucide-react'
import { UsersTable } from '@/components/admin/users-table'
import { adminListAgencies, adminListUsers } from '@/lib/admin-api'

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; agencyId?: string; role?: string; isActive?: string }>
}) {
  const params = await searchParams
  const page = Number(params.page ?? 1)
  const isActive =
    params.isActive === 'true' ? true : params.isActive === 'false' ? false : undefined

  const [usersResult, agenciesResult] = await Promise.all([
    adminListUsers({
      page,
      search: params.search,
      agencyId: params.agencyId,
      role: params.role,
      isActive,
    }),
    adminListAgencies({ limit: 100 }),
  ])

  function buildUrl(overrides: Record<string, string | undefined>) {
    const qs = new URLSearchParams()
    const merged = {
      page: String(page),
      search: params.search,
      agencyId: params.agencyId,
      role: params.role,
      isActive: params.isActive,
      ...overrides,
    }
    Object.entries(merged).forEach(([k, v]) => {
      if (v) qs.set(k, v)
    })
    return `/admin-panel/users?${qs.toString()}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Usuários</h1>
        <p className="text-sm text-white/40 mt-1">
          {usersResult ? `${usersResult.total} usuários em todas as agências` : 'Gerenciar usuários da plataforma'}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <form>
            <input
              name="search"
              defaultValue={params.search ?? ''}
              placeholder="Buscar por nome ou e-mail..."
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/50"
            />
          </form>
        </div>
        <form className="flex gap-2 flex-wrap">
          <select
            name="agencyId"
            defaultValue={params.agencyId ?? ''}
            className="bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white"
          >
            <option value="">Todas agências</option>
            {agenciesResult?.data.map((a) => (
              <option key={a.id} value={a.id} className="bg-[#1a1a2e]">
                {a.name}
              </option>
            ))}
          </select>
          <select
            name="isActive"
            defaultValue={params.isActive ?? ''}
            className="bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white"
          >
            <option value="">Todos status</option>
            <option value="true" className="bg-[#1a1a2e]">Ativos</option>
            <option value="false" className="bg-[#1a1a2e]">Inativos</option>
          </select>
          <button type="submit" className="px-4 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl">
            Filtrar
          </button>
        </form>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
        <UsersTable users={usersResult?.data ?? []} />

        {usersResult && usersResult.total > usersResult.limit && (
          <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-between">
            <p className="text-xs text-white/30">
              Mostrando {(page - 1) * usersResult.limit + 1}–{Math.min(page * usersResult.limit, usersResult.total)} de {usersResult.total}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={buildUrl({ page: String(page - 1) })} className="px-3 py-1.5 text-xs font-medium text-white/50 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10">
                  Anterior
                </Link>
              )}
              {page * usersResult.limit < usersResult.total && (
                <Link href={buildUrl({ page: String(page + 1) })} className="px-3 py-1.5 text-xs font-medium text-white/50 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10">
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
