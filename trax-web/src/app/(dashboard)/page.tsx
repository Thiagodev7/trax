import { Users, FileBarChart2, MousePointerClick, TrendingUp } from 'lucide-react'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { DashboardCharts } from '@/components/dashboard/dashboard-overview'
import { apiRequest } from '@/lib/api-client'
import { headers } from 'next/headers'

export const metadata = {
  title: 'Dashboard',
}

export default async function DashboardPage() {
  const host = (await headers()).get('host') ?? ''

  // Carrega dados reais do servidor (fail silently com fallback)
  let clients: any[] = []
  let reports: any[] = []

  try {
    const clientsData = await apiRequest<any>('/clients?limit=50', { domain: host })
    clients = Array.isArray(clientsData) ? clientsData : (clientsData?.data ?? [])
  } catch {
    // API offline ou sem dados — continua com mock
  }

  try {
    const reportsData = await apiRequest<any>('/reports?limit=50', { domain: host })
    reports = Array.isArray(reportsData) ? reportsData : (reportsData?.data ?? [])
  } catch {
    // API offline ou sem dados — continua com mock
  }

  const totalClients = clients.length
  const activeClients = clients.filter((c) => c.isActive).length
  const totalReports = reports.length
  const publishedReports = reports.filter((r) => r.status === 'PUBLISHED').length
  const publishRate = totalReports > 0 ? Math.round((publishedReports / totalReports) * 100) : 0

  // Ordena por createdAt desc
  const recentClients = [...clients].sort(
    (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  )
  const recentReports = [...reports].sort(
    (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
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
          value={totalClients || 25}
          delta={12.5}
          icon={<Users className="w-5 h-5" />}
          subtitle={activeClients > 0 ? `${activeClients} ativos` : undefined}
          delay={0.1}
        />
        <KpiCard
          title="Relatórios Gerados"
          value={totalReports || 124}
          delta={24.2}
          icon={<FileBarChart2 className="w-5 h-5" />}
          subtitle={publishedReports > 0 ? `${publishedReports} publicados` : undefined}
          delay={0.2}
        />
        <KpiCard
          title="Cliques Mensais"
          value="1.2M"
          delta={8.1}
          icon={<MousePointerClick className="w-5 h-5" />}
          subtitle="Dado simulado"
          delay={0.3}
        />
        <KpiCard
          title="Taxa de Publicação"
          value={publishRate > 0 ? `${publishRate}%` : '67%'}
          delta={5.8}
          icon={<TrendingUp className="w-5 h-5" />}
          subtitle="Rascunhos vs publicados"
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
