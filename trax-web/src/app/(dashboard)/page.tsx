import { Users, FileBarChart2, TrendingUp, CheckCircle2 } from 'lucide-react'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { DashboardCharts } from '@/components/dashboard/dashboard-overview'
import { apiRequest } from '@/lib/api-client'
import { headers } from 'next/headers'
import { subMonths, format, isSameMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const metadata = {
  title: 'Dashboard',
}

export default async function DashboardPage() {
  const host = (await headers()).get('host') ?? ''

  let clients: any[] = []
  let reports: any[] = []

  try {
    const clientsData = await apiRequest<any>('/clients?limit=100', { domain: host })
    clients = Array.isArray(clientsData) ? clientsData : (clientsData?.data ?? [])
  } catch {
    /* API offline — exibe zeros */
  }

  try {
    const reportsData = await apiRequest<any>('/reports?limit=100', { domain: host })
    reports = Array.isArray(reportsData) ? reportsData : (reportsData?.data ?? [])
  } catch {
    /* API offline — exibe zeros */
  }

  const totalClients = clients.length
  const activeClients = clients.filter((c) => c.isActive).length
  const totalReports = reports.length
  const publishedReports = reports.filter((r) => r.status === 'PUBLISHED').length
  const publishRate = totalReports > 0 ? Math.round((publishedReports / totalReports) * 100) : 0

  // 1. Gerar dados do gráfico de Área (últimos 6 meses)
  const chartData = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const targetMonth = subMonths(now, i)
    const monthName = format(targetMonth, 'MMM', { locale: ptBR })
    
    const clientsInMonth = clients.filter(c => isSameMonth(new Date(c.createdAt), targetMonth)).length
    const reportsInMonth = reports.filter(r => isSameMonth(new Date(r.createdAt), targetMonth)).length

    chartData.push({
      mes: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      Relatórios: reportsInMonth,
      Clientes: clientsInMonth,
    })
  }

  // 2. Gerar dados do gráfico de Barras (Top Clientes)
  const barData = [...clients]
    .sort((a, b) => (b._count?.reports ?? 0) - (a._count?.reports ?? 0))
    .slice(0, 5)
    .map(c => ({
      name: c.name.split(' ')[0],
      relatórios: c._count?.reports ?? 0,
    }))

  // 3. Gerar Activity Feed (mesclando clientes e relatórios recentes)
  const activities = [
    ...clients.map(c => ({
      id: `client-${c.id}`,
      type: 'CLIENT' as const,
      title: 'Novo cliente cadastrado',
      subtitle: c.name,
      date: new Date(c.createdAt),
      link: `/clients/${c.id}`,
      status: c.isActive ? 'Ativo' : 'Inativo'
    })),
    ...reports.map(r => ({
      id: `report-${r.id}`,
      type: 'REPORT' as const,
      title: 'Relatório gerado',
      subtitle: r.title,
      date: new Date(r.createdAt),
      link: `/reports/${r.id}`,
      status: r.status === 'PUBLISHED' ? 'Publicado' : 'Rascunho'
    }))
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 8)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
        chartData={chartData}
        barData={barData}
        activities={activities}
      />
    </div>
  )
}
