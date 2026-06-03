import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Users,
  FileText,
  Activity,
  ArrowLeft,
  ExternalLink,
  Globe,
  Calendar,
  Plug,
} from 'lucide-react'
import { AgencyDetailTabs } from '@/components/admin/agency-detail-tabs'
import {
  adminGetAgency,
  adminGetAgencyUsers,
  adminGetAgencyCompanies,
  adminGetAgencyIntegrations,
  adminGetAgencyAuditLogs,
  PLAN_LABELS,
  PLAN_COLORS,
  tenantUrl,
} from '@/lib/admin-api'

export default async function AgencyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [agency, usersResult, companies, integrations, auditLogsResult] = await Promise.all([
    adminGetAgency(id),
    adminGetAgencyUsers(id),
    adminGetAgencyCompanies(id),
    adminGetAgencyIntegrations(id),
    adminGetAgencyAuditLogs(id),
  ])

  if (!agency) notFound()

  const stats = [
    { label: 'Empresas', value: agency._count?.companies ?? 0, max: agency.maxCompanies, icon: Activity },
    { label: 'Usuários', value: agency._count?.users ?? 0, max: agency.maxUsers, icon: Users },
    { label: 'Relatórios', value: agency._count?.reports ?? 0, max: null, icon: FileText },
    { label: 'Integrações', value: agency._count?.integrations ?? 0, max: null, icon: Plug },
  ]

  return (
    <div className="space-y-6">
      <Link href="/admin-panel/agencies" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Voltar para agências
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-2xl font-black">
            {agency.name[0].toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-black text-white">{agency.name}</h1>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${PLAN_COLORS[agency.plan] ?? ''}`}>
                {PLAN_LABELS[agency.plan] ?? agency.plan}
              </span>
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${agency.isActive ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${agency.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                {agency.isActive ? 'Ativa' : 'Inativa'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-white/40 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                {tenantUrl(agency.slug).replace('https://', '')}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Criada em {new Date(agency.createdAt).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        <a
          href={tenantUrl(agency.slug)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2.5 rounded-xl transition-all hover:bg-indigo-500/15 shrink-0"
        >
          <ExternalLink className="w-4 h-4" />
          Abrir painel
        </a>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-white/30" />
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">{stat.label}</p>
              </div>
              <p className="text-3xl font-black text-white">{stat.value}</p>
              {stat.max !== null && <p className="text-xs text-white/30 mt-1">limite: {stat.max}</p>}
            </div>
          )
        })}
      </div>

      <AgencyDetailTabs
        agency={agency}
        users={usersResult?.data ?? []}
        companies={companies ?? []}
        integrations={integrations ?? []}
        auditLogs={auditLogsResult?.data ?? []}
      />
    </div>
  )
}
