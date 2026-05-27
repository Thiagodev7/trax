import Link from 'next/link'
import {
  Building2,
  Users,
  FileText,
  Activity,
  ExternalLink,
  Search,
  Plus,
  AlertTriangle,
} from 'lucide-react'
import {
  adminListAgencies,
  PLAN_LABELS,
  PLAN_COLORS,
  tenantUrl,
} from '@/lib/admin-api'

const PLANS = ['TRIAL', 'STARTER', 'PRO', 'AGENCY', 'ENTERPRISE']

export default async function AgenciesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; plan?: string; isActive?: string }>
}) {
  const params = await searchParams
  const page = Number(params.page ?? 1)
  const search = params.search ?? ''
  const plan = params.plan ?? ''
  const isActive =
    params.isActive === 'true' ? true : params.isActive === 'false' ? false : undefined

  const result = await adminListAgencies({
    page,
    search: search || undefined,
    plan: plan || undefined,
    isActive,
  })

  function buildUrl(overrides: Record<string, string | undefined>) {
    const qs = new URLSearchParams()
    const merged = { page: String(page), search, plan, isActive: params.isActive, ...overrides }
    Object.entries(merged).forEach(([k, v]) => {
      if (v) qs.set(k, v)
    })
    if (overrides.page === '1' || (!overrides.page && page === 1)) qs.delete('page')
    return `/admin-panel/agencies?${qs.toString()}`
  }

  const now = new Date()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Agências</h1>
          <p className="text-sm text-white/40 mt-1">
            {result ? `${result.total} agências cadastradas na plataforma` : 'Gerenciar todas as agências'}
          </p>
        </div>
        <Link
          href="/admin-panel/agencies/new"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/20 w-fit"
        >
          <Plus className="w-4 h-4" />
          Nova agência
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <form>
            <input
              name="search"
              defaultValue={search}
              placeholder="Buscar por nome ou slug..."
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/50"
            />
            {plan && <input type="hidden" name="plan" value={plan} />}
            {params.isActive && <input type="hidden" name="isActive" value={params.isActive} />}
          </form>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href={buildUrl({ plan: undefined, page: '1' })}
            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${!plan ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-300' : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70'}`}
          >
            Todos planos
          </Link>
          {PLANS.map((p) => (
            <Link
              key={p}
              href={buildUrl({ plan: p, page: '1' })}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${plan === p ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-300' : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70'}`}
            >
              {PLAN_LABELS[p]}
            </Link>
          ))}
        </div>
        <div className="flex gap-2">
          {[
            { label: 'Todas', value: undefined },
            { label: 'Ativas', value: 'true' },
            { label: 'Inativas', value: 'false' },
          ].map((f) => (
            <Link
              key={f.label}
              href={buildUrl({ isActive: f.value, page: '1' })}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                (f.value === undefined && !params.isActive) || params.isActive === f.value
                  ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-300'
                  : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70'
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                {['Agência', 'Plano', 'Clientes', 'Usuários', 'Relatórios', 'Status', 'Criada em', ''].map((h) => (
                  <th key={h || 'actions'} className="px-6 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {result?.data && result.data.length > 0 ? (
                result.data.map((agency) => {
                  const trialExpired =
                    agency.trialEndsAt &&
                    agency.plan === 'TRIAL' &&
                    new Date(agency.trialEndsAt) < now
                  return (
                    <tr key={agency.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm font-bold shrink-0">
                            {agency.name[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-white">{agency.name}</p>
                              {trialExpired && (
                                <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
                                  <AlertTriangle className="w-3 h-3" />
                                  Trial expirado
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-white/30 mt-0.5">{tenantUrl(agency.slug).replace('https://', '')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${PLAN_COLORS[agency.plan] ?? ''}`}>
                          {PLAN_LABELS[agency.plan] ?? agency.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-white/25" />
                          <span className="font-semibold text-white">{agency._count.clients}</span>
                          <span className="text-white/30">/ {agency.maxClients}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-white/25" />
                          <span className="font-semibold text-white">{agency._count.users}</span>
                          <span className="text-white/30">/ {agency.maxUsers}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-white/25" />
                          <span className="font-semibold text-white">{agency._count.reports}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${agency.isActive ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${agency.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          {agency.isActive ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white/30 text-xs">
                        {new Date(agency.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link href={`/admin-panel/agencies/${agency.id}`} className="text-xs font-medium text-indigo-400 hover:text-indigo-300">
                            Gerenciar
                          </Link>
                          <a href={tenantUrl(agency.slug)} target="_blank" rel="noopener noreferrer" className="text-white/20 hover:text-white/50">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <Building2 className="w-10 h-10 text-white/10 mx-auto mb-3" />
                    <p className="text-sm text-white/30">
                      {search || plan || params.isActive ? 'Nenhuma agência encontrada' : 'Nenhuma agência cadastrada ainda'}
                    </p>
                    {!search && !plan && !params.isActive && (
                      <Link href="/admin-panel/agencies/new" className="inline-block mt-4 text-sm text-indigo-400 hover:text-indigo-300">
                        Criar primeira agência →
                      </Link>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {result && result.total > result.limit && (
          <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-between">
            <p className="text-xs text-white/30">
              Mostrando {(page - 1) * result.limit + 1}–{Math.min(page * result.limit, result.total)} de {result.total}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={buildUrl({ page: String(page - 1) })} className="px-3 py-1.5 text-xs font-medium text-white/50 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10">
                  Anterior
                </Link>
              )}
              {page * result.limit < result.total && (
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
