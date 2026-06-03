import Link from 'next/link'
import {
  Building2,
  Users,
  FileText,
  Activity,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Plug,
  CreditCard,
} from 'lucide-react'
import { adminGetStats, adminGetHealth, PLAN_LABELS, PLAN_COLORS } from '@/lib/admin-api'
import { tenantHostname } from '@/lib/domains'

export default async function AdminDashboardPage() {
  const [stats, health] = await Promise.all([adminGetStats(), adminGetHealth()])

  const kpis = [
    {
      label: 'Total de Agências',
      value: stats?.totalAgencies ?? '—',
      sub: `${stats?.activeAgencies ?? 0} ativas · ${stats?.inactiveAgencies ?? 0} inativas`,
      icon: Building2,
      color: 'from-indigo-500 to-violet-600',
    },
    {
      label: 'Usuários na Plataforma',
      value: stats?.totalUsers ?? '—',
      sub: `${stats?.activeUsers ?? 0} ativos`,
      icon: Users,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      label: 'Empresas Gerenciadas',
      value: stats?.totalCompanies ?? '—',
      sub: 'em todas as agências',
      icon: Activity,
      color: 'from-violet-500 to-purple-600',
    },
    {
      label: 'Relatórios Criados',
      value: stats?.totalReports ?? '—',
      sub: 'histórico total',
      icon: FileText,
      color: 'from-purple-500 to-pink-600',
    },
  ]

  const alertKpis = stats
    ? [
        { label: 'Trials expirando (7d)', value: stats.trialsExpiringSoon, icon: Clock, warn: stats.trialsExpiringSoon > 0 },
        { label: 'Trials expirados', value: stats.expiredTrials, icon: AlertCircle, warn: stats.expiredTrials > 0 },
        { label: 'Sync errors (24h)', value: stats.failedSyncsLast24h, icon: XCircle, warn: stats.failedSyncsLast24h > 0 },
        { label: 'Com integrações', value: stats.agenciesWithIntegrations, icon: Plug, warn: false },
      ]
    : []

  const healthItems = health
    ? [
        { label: 'API Backend', ...health.api },
        { label: 'Banco de Dados', ...health.database },
        {
          label: `E-mail (${health.email.provider})`,
          status: health.email.configured ? ('ok' as const) : ('unconfigured' as const),
        },
      ]
    : []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Dashboard</h1>
        <p className="text-sm text-white/40 mt-1">Visão geral de toda a plataforma Trax</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 hover:border-white/15 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">{kpi.label}</p>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-3xl font-black text-white">{kpi.value}</p>
              <p className="text-xs text-white/30 mt-1">{kpi.sub}</p>
            </div>
          )
        })}
      </div>

      {alertKpis.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {alertKpis.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                className={`rounded-2xl p-5 border ${item.warn ? 'bg-amber-500/5 border-amber-500/20' : 'bg-white/[0.03] border-white/[0.07]'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${item.warn ? 'text-amber-400' : 'text-white/30'}`} />
                  <p className="text-xs font-semibold text-white/40">{item.label}</p>
                </div>
                <p className={`text-2xl font-black ${item.warn ? 'text-amber-300' : 'text-white'}`}>{item.value}</p>
              </div>
            )
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-white/40" />
            <h2 className="text-sm font-bold text-white">Distribuição por Plano</h2>
          </div>
          {stats?.agenciesByPlan && Object.keys(stats.agenciesByPlan).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.agenciesByPlan).map(([plan, count]) => {
                const total = stats.totalAgencies || 1
                const pct = Math.round((count / total) * 100)
                return (
                  <div key={plan}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${PLAN_COLORS[plan] ?? 'text-white/50 bg-white/5 border-white/10'}`}>
                        {PLAN_LABELS[plan] ?? plan}
                      </span>
                      <span className="text-sm font-bold text-white">
                        {count} <span className="text-white/30 font-normal text-xs">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-white/30 text-center py-8">Nenhuma agência ainda</p>
          )}
        </div>

        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-white/40" />
              <h2 className="text-sm font-bold text-white">Top Agências por Empresas</h2>
            </div>
            <Link href="/admin-panel/agencies" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
              Ver todas →
            </Link>
          </div>
          {stats?.topAgenciesByCompanies && stats.topAgenciesByCompanies.length > 0 ? (
            <div className="space-y-3">
              {stats.topAgenciesByCompanies.map((agency) => (
                <Link
                  key={agency.id}
                  href={`/admin-panel/agencies/${agency.id}`}
                  className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/[0.04] hover:border-white/10 transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{agency.name}</p>
                    <p className="text-xs text-white/30">{tenantHostname(agency.slug)}</p>
                  </div>
                  <span className="text-sm font-bold text-indigo-400">{agency.companyCount} empresas</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/30 text-center py-8">Nenhuma agência cadastrada</p>
          )}
        </div>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
        <h2 className="text-sm font-bold text-white mb-4">Status do Sistema</h2>
        {healthItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {healthItems.map((service) => {
              const isOk = service.status === 'ok'
              const isUnconfigured = service.status === 'unconfigured'
              const Icon = isOk ? CheckCircle2 : isUnconfigured ? AlertCircle : XCircle
              return (
                <div
                  key={service.label}
                  className={`flex items-center gap-3 p-4 rounded-xl border ${
                    isOk
                      ? 'bg-emerald-500/5 border-emerald-500/15'
                      : isUnconfigured
                        ? 'bg-amber-500/5 border-amber-500/15'
                        : 'bg-red-500/5 border-red-500/15'
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isOk ? 'text-emerald-400' : isUnconfigured ? 'text-amber-400' : 'text-red-400'}`} />
                  <div>
                    <p className="text-sm font-semibold text-white">{service.label}</p>
                    <p className={`text-xs font-medium ${isOk ? 'text-emerald-400' : isUnconfigured ? 'text-amber-400' : 'text-red-400'}`}>
                      {isOk ? 'Operacional' : isUnconfigured ? 'Não configurado' : 'Erro'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-white/30">Não foi possível verificar o status</p>
        )}
        {health?.checkedAt && (
          <p className="text-xs text-white/20 mt-3">Verificado em {new Date(health.checkedAt).toLocaleString('pt-BR')}</p>
        )}
      </div>

      {stats?.recentAgencies && stats.recentAgencies.length > 0 && (
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white mb-4">Agências Recentes</h2>
          <div className="space-y-3">
            {stats.recentAgencies.map((agency) => (
              <Link
                key={agency.id}
                href={`/admin-panel/agencies/${agency.id}`}
                className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/[0.04] hover:border-white/10 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{agency.name}</p>
                  <p className="text-xs text-white/30">{tenantHostname(agency.slug)}</p>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${PLAN_COLORS[agency.plan] ?? ''}`}>
                  {PLAN_LABELS[agency.plan] ?? agency.plan}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {stats && stats.agenciesWithStripeCustomer > 0 && (
        <div className="flex items-center gap-3 text-sm text-white/40 bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3">
          <CreditCard className="w-4 h-4" />
          {stats.agenciesWithStripeCustomer} agência(s) com Stripe Customer ID cadastrado
        </div>
      )}
    </div>
  )
}
