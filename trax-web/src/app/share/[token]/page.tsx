import { apiRequest } from '@/lib/api-client'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FileText, Calendar, Building2, ExternalLink } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  return { title: 'Relatório | Trax' }
}

export default async function SharedReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const host = (await headers()).get('host') ?? ''

  let report = null
  try {
    const response = await apiRequest<any>(`/reports/shared/${token}`, {
      domain: host
    })
    report = response
  } catch (error: any) {
    if (error.response?.status === 404 || error.response?.status === 410) {
      notFound()
    }
    console.error('Failed to fetch shared report:', error)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-background)]">
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Erro ao carregar relatório</h1>
        <p className="text-[var(--color-muted-foreground)] mt-2">Por favor, tente novamente mais tarde.</p>
      </div>
    )
  }

  if (!report) return notFound()

  // Layout Json Mock Render (Simulando widgets do layoutJson)
  const widgets = report.layoutJson?.widgets || []

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col">
      {/* Header Público com Branding da Agência / Cliente */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          {report.client.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={report.client.logoUrl} alt={report.client.name} className="h-10 w-auto rounded border border-[var(--color-border)]" />
          ) : (
            <div className="h-10 w-10 rounded bg-[var(--color-surface-2)] flex items-center justify-center border border-[var(--color-border)] text-[var(--color-primary)] font-bold text-lg">
              {report.client.name[0]}
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold text-[var(--color-foreground)] leading-tight">
              {report.title}
            </h1>
            <div className="text-sm text-[var(--color-muted-foreground)] flex items-center gap-2 mt-0.5">
              <Building2 className="w-3.5 h-3.5" />
              {report.client.name}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm font-medium text-[var(--color-muted-foreground)] bg-[var(--color-surface-2)] px-4 py-2 rounded-full border border-[var(--color-border)]">
          <Calendar className="w-4 h-4 text-[var(--color-primary)]" />
          {format(new Date(report.periodStart), "dd 'de' MMMM", { locale: ptBR })} - {format(new Date(report.periodEnd), "dd 'de' MMMM, yyyy", { locale: ptBR })}
        </div>
      </header>

      {/* Conteúdo do Relatório */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="mb-8">
          <p className="text-[var(--color-foreground)] text-lg">{report.description}</p>
        </div>

        {/* Dashboard Grid de Widgets (Simulado) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {widgets.map((widget: any, idx: number) => {
            if (widget.type === 'kpi') {
              const isPositive = widget.delta > 0
              return (
                <div key={idx} className="card p-6 border-[var(--color-border)] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <FileText className="w-16 h-16 text-[var(--color-primary)]" />
                  </div>
                  <h3 className="text-sm font-medium text-[var(--color-muted-foreground)] relative z-10">{widget.label}</h3>
                  <div className="text-3xl font-bold text-[var(--color-foreground)] mt-2 relative z-10">
                    {widget.value.toLocaleString()}
                  </div>
                  {widget.delta !== undefined && (
                    <div className={`text-sm font-medium mt-2 flex items-center gap-1 relative z-10 ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {isPositive ? '↑' : '↓'} {Math.abs(widget.delta)}%
                    </div>
                  )}
                </div>
              )
            }
            if (widget.type === 'chart_line') {
              return (
                <div key={idx} className="card p-6 border-[var(--color-border)] col-span-1 md:col-span-2 lg:col-span-4 min-h-[300px] flex flex-col">
                  <h3 className="text-sm font-medium text-[var(--color-muted-foreground)] mb-4">{widget.label}</h3>
                  <div className="flex-1 border-2 border-dashed border-[var(--color-border)] rounded-lg flex items-center justify-center bg-[var(--color-surface-2)]">
                    <span className="text-[var(--color-muted-foreground)]">Gráfico Simulado ({widget.metric})</span>
                  </div>
                </div>
              )
            }
            return null
          })}
        </div>

        {widgets.length === 0 && (
          <div className="card p-12 border-[var(--color-border)] flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-[var(--color-muted)]" />
            </div>
            <h3 className="text-lg font-bold text-[var(--color-foreground)]">Nenhum dado para exibir</h3>
            <p className="text-[var(--color-muted-foreground)] max-w-md mt-2">
              Este relatório ainda não possui widgets configurados ou os dados estão sendo processados.
            </p>
          </div>
        )}
      </main>

      {/* Footer Público */}
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] py-6 mt-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[var(--color-muted-foreground)]">
          <div>
            Gerado em {format(new Date(report.publishedAt || report.createdAt), "dd/MM/yyyy 'às' HH:mm")}
          </div>
          <div className="flex items-center gap-2">
            Powered by
            <a href="https://trax.app" target="_blank" rel="noreferrer" className="font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1">
              Trax <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
