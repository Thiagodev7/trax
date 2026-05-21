import { Users, FileBarChart2, TrendingUp, CheckCircle2 } from 'lucide-react'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { DashboardCharts } from '@/components/dashboard/dashboard-overview'
import { apiRequest } from '@/lib/api-client'
import { headers } from 'next/headers'

export const metadata = {
  title: 'Dashboard',
}

export default async function DashboardPage() {
  const host = (await headers()).get('host') ?? ''

  let clients: any[] = []
  let reports: any[] = []

  try {
    const clientsData = await apiRequest<any>('/clients?limit=50', { domain: host })
    clients = Array.isArray(clientsData) ? clientsData : (clientsData?.data ?? [])
  } catch {
    /* API offline — exibe zeros */
  }

  try {
    const reportsData = await apiRequest<any>('/reports?limit=50', { domain: host })
    reports = Array.isArray(reportsData) ? reportsData : (reportsData?.data ?? [])
  } catch {
    /* API offline — exibe zeros */
  }

  const totalClients = clients.length
  const activeClients = clients.filter((c) => c.isActive).length
  const totalReports = reports.length
  const publishedReports = reports.filter((r) => r.status === 'PUBLISHED').length
  const publishRate = totalReports > 0 ? Math.round((publishedReports / totalReports) * 100) : 0

  const recentClients = [...clients].sort(
    (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
  )
  const recentReports = [...reports].sort(
    (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-foreground)] tracking-tight">
          Dashboard
        </h2>
        <p className="text-[var(--color-muted-foreground)] mt-1">
          Visão geral do desempenho da sua agência.
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Total de Clientes"
          value={totalClients}
          delta={totalClients > 0 ? undefined : undefined}
          icon={<Users className="w-5 h-5" />}
          subtitle={activeClients > 0 ? `${activeClients} ativo(s)` : 'Nenhum cliente ainda'}
          delay={0.1}
        />
        <KpiCard
          title="Relatórios Gerados"
          value={totalReports}
          icon={<FileBarChart2 className="w-5 h-5" />}
          subtitle={publishedReports > 0 ? `${publishedReports} publicado(s)` : 'Nenhum relatório ainda'}
          delay={0.2}
        />
        <KpiCard
          title="Clientes Ativos"
          value={activeClients}
          icon={<CheckCircle2 className="w-5 h-5" />}
          subtitle={totalClients > 0 ? `${totalClients} total` : 'Nenhum cliente ainda'}
          delay={0.3}
        />
        <KpiCard
          title="Taxa de Publicação"
          value={publishRate > 0 ? `${publishRate}%` : '—'}
          icon={<TrendingUp className="w-5 h-5" />}
          subtitle={totalReports > 0 ? `${publishedReports} de ${totalReports} publicados` : 'Sem dados ainda'}
          delay={0.4}
        />
      </div>

      {/* Charts e recentes */}
      <DashboardCharts
        recentClients={recentClients}
        recentReports={recentReports}
      />
    </div>
  )
}
