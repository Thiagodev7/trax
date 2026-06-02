import { sharedReportRequest } from '@/lib/shared-report-request'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ExternalLink } from 'lucide-react'
import { ReportViewer } from '@/components/reports/report-viewer'
import type { ApiReport } from '@/types/api'

async function fetchReport(token: string, host: string): Promise<ApiReport | null> {
  try {
    return await sharedReportRequest<ApiReport>(`/reports/shared/${token}`, host)
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const host = (await headers()).get('host') ?? ''
  const report = await fetchReport(token, host)

  if (!report) return { title: 'Relatório não encontrado' }

  const clientName = report.client?.name ?? ''
  const title = clientName ? `${report.title} — ${clientName}` : report.title

  return {
    title,
    description: `Relatório de marketing${clientName ? ` de ${clientName}` : ''}`,
  }
}

export default async function SharedReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const host = (await headers()).get('host') ?? ''

  const report = await fetchReport(token, host)
  if (!report) return notFound()

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
        {/* report.status is always PUBLISHED here — backend enforces it in executeByShareToken */}
        <ReportViewer report={report as unknown as Parameters<typeof ReportViewer>[0]['report']} shareToken={token} />
      </main>

      <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[var(--color-muted-foreground)]">
          <div>
            Gerado em{' '}
            {format(
              new Date(report.publishedAt ?? report.createdAt),
              "dd/MM/yyyy 'às' HH:mm",
              { locale: ptBR },
            )}
          </div>
          <div className="flex items-center gap-2">
            Powered by
            <a
              href="https://traxsolucoes.com.br"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-[var(--color-primary)] hover:underline inline-flex items-center gap-1"
            >
              Trax <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
