import { Users, FileBarChart2, TrendingUp, CheckCircle2, DollarSign, Target, MousePointerClick, BarChart2, Plug } from 'lucide-react'
import Link from 'next/link'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { DashboardCharts } from '@/components/dashboard/dashboard-overview'
import { apiRequest } from '@/lib/api-client'
import { headers } from 'next/headers'
import { subMonths, format, isSameMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ApiCompany, ApiReport, PaginatedResponse } from '@/types/api'

export const metadata = {
  title: 'Dashboard',
}

interface MetricsSummary {
  currentMonth: {
    totalSpend: number
    totalLeads: number
    totalImpressions: number
    totalClicks: number
    avgCtr: number
    avgRoas: number
    avgCpl: number
  }
  previousMonth: {
    totalSpend: number
    totalLeads: number
    avgCtr: number
    avgRoas: number
  }
  deltas: {
    spend: number | null
    leads: number | null
    ctr: number | null
    roas: number | null
  }
  monthlyEvolution: Array<{ month: string; spend: number; leads: number }>
  hasData: boolean
  connectedIntegrations: number
}

function formatCurrency(value: number): string {
  if (value >= 1000) return `R$\u00a0${(value / 1000).toFixed(1)}k`
  return `R$\u00a0${value.toFixed(0)}`
}

export default async function DashboardPage() {
  const host = (await headers()).get('host') ?? ''

  const [companiesRes, reportsRes, metricsRes] = await Promise.allSettled([
    apiRequest<PaginatedResponse<ApiCompany> | ApiCompany[]>('/companies?limit=100', { domain: host }),
    apiRequest<PaginatedResponse<ApiReport> | ApiReport[]>('/reports?limit=100', { domain: host }),
    apiRequest<MetricsSummary>('/metrics/summary', { domain: host }),
  ])

  const companies: ApiCompany[] = companiesRes.status === 'fulfilled'
    ? Array.isArray(companiesRes.value) ? companiesRes.value : (companiesRes.value?.data ?? [])
    : []

  const reports: ApiReport[] = reportsRes.status === 'fulfilled'
    ? Array.isArray(reportsRes.value) ? reportsRes.value : (reportsRes.value?.data ?? [])
    : []

  const metricsSummary: MetricsSummary | null = metricsRes.status === 'fulfilled'
    ? metricsRes.value
    : null

  const totalCompanies = companies.length
  const activeCompanies = companies.filter((c) => c.isActive).length
  const totalReports = reports.length
  const publishedReports = reports.filter((r) => r.status === 'PUBLISHED').length
  const publishRate = totalReports > 0 ? Math.round((publishedReports / totalReports) * 100) : 0

  const now = new Date()

  // Use real monthly evolution from integrations when available; otherwise fall back to operational counts
  const chartData = []
  for (let i = 5; i >= 0; i--) {
    const targetMonth = subMonths(now, i)
    const monthName = format(targetMonth, 'MMM', { locale: ptBR })
    const label = monthName.charAt(0).toUpperCase() + monthName.slice(1)

    const evolutionPoint = metricsSummary?.monthlyEvolution?.find((p) => p.month === label)

    if (evolutionPoint && (evolutionPoint.spend > 0 || evolutionPoint.leads > 0)) {
      chartData.push({
        mes: label,
        Relatórios: evolutionPoint.leads,
        Empresas: Math.round(evolutionPoint.spend / 1000),
      })
    } else {
      const companiesInMonth = companies.filter((c) => isSameMonth(new Date(c.createdAt), targetMonth)).length
      const reportsInMonth = reports.filter((r) => isSameMonth(new Date(r.createdAt), targetMonth)).length
      chartData.push({ mes: label, Relatórios: reportsInMonth, Empresas: companiesInMonth })
    }
  }

  const barData = [...companies]
    .sort((a, b) => (b._count?.reports ?? 0) - (a._count?.reports ?? 0))
    .slice(0, 5)
    .map((c) => ({
      name: c.name.split(' ')[0],
      relatórios: c._count?.reports ?? 0,
    }))

  const activities = [
    ...companies.map((c) => ({
      id: `company-${c.id}`,
      type: 'COMPANY' as const,
      title: 'Nova empresa cadastrada',
      subtitle: c.name,
      date: new Date(c.createdAt),
      link: `/companies/${c.id}`,
      status: c.isActive ? 'Ativo' : 'Inativo',
    })),
    ...reports.map((r) => ({
      id: `report-${r.id}`,
      type: 'REPORT' as const,
      title: 'Relatório gerado',
      subtitle: r.title,
      date: new Date(r.createdAt),
      link: `/reports/${r.id}`,
      status: r.status === 'PUBLISHED' ? 'Publicado' : 'Rascunho',
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 8)

  const hasMetrics = metricsSummary?.hasData === true
  const deltas = metricsSummary?.deltas
  const curr = metricsSummary?.currentMonth

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

      {/* Operational KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Total de Empresas"
          value={totalCompanies}
          icon={<Users className="w-5 h-5" />}
          subtitle={activeCompanies > 0 ? `${activeCompanies} ativa(s)` : 'Nenhuma empresa ainda'}
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
          title="Empresas Ativas"
          value={activeCompanies}
          icon={<CheckCircle2 className="w-5 h-5" />}
          subtitle={totalCompanies > 0 ? `${totalCompanies} total` : 'Nenhuma empresa ainda'}
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

      {/* Ad Metrics KPIs */}
      {hasMetrics ? (
        <>
          <div className="flex items-center gap-3 pt-2">
            <div className="h-px flex-1 bg-[var(--color-border)]" />
            <span className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-widest px-2">
              Métricas de mídia — mês atual
            </span>
            <div className="h-px flex-1 bg-[var(--color-border)]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard
              title="Gasto Total"
              value={curr ? formatCurrency(curr.totalSpend) : '—'}
              delta={deltas?.spend ?? undefined}
              icon={<DollarSign className="w-5 h-5" />}
              subtitle="Investimento em mídia paga"
              delay={0.5}
            />
            <KpiCard
              title="Leads Gerados"
              value={curr?.totalLeads ?? '—'}
              delta={deltas?.leads ?? undefined}
              icon={<Target className="w-5 h-5" />}
              subtitle={curr && curr.avgCpl > 0 ? `CPL médio ${formatCurrency(curr.avgCpl)}` : 'Este mês'}
              delay={0.6}
            />
            <KpiCard
              title="CTR Médio"
              value={curr && curr.avgCtr > 0 ? `${curr.avgCtr}%` : '—'}
              delta={deltas?.ctr ?? undefined}
              icon={<MousePointerClick className="w-5 h-5" />}
              subtitle={curr && curr.totalClicks > 0 ? `${curr.totalClicks.toLocaleString('pt-BR')} cliques` : 'Taxa de cliques'}
              delay={0.7}
            />
            <KpiCard
              title="ROAS"
              value={curr && curr.avgRoas > 0 ? `${curr.avgRoas}×` : '—'}
              delta={deltas?.roas ?? undefined}
              icon={<BarChart2 className="w-5 h-5" />}
              subtitle="Retorno sobre investimento"
              delay={0.8}
            />
          </div>
        </>
      ) : (
        <div className="flex items-center gap-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
          <div className="p-3 rounded-xl bg-[var(--color-surface-2)] text-[var(--color-primary)] shrink-0">
            <Plug className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--color-foreground)]">
              Conecte integrações para ver métricas de mídia
            </p>
            <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
              Vincule Meta Ads, Google Ads e outras plataformas nas suas empresas para ver CTR, ROAS, gasto e leads aqui.
            </p>
          </div>
          <Link
            href="/companies"
            className="shrink-0 text-xs font-semibold text-[var(--color-primary)] hover:underline"
          >
            Ir para empresas →
          </Link>
        </div>
      )}

      <DashboardCharts
        chartData={chartData}
        barData={barData}
        activities={activities}
      />
    </div>
  )
}
