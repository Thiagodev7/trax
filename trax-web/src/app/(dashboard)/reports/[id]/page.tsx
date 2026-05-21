import { apiRequest } from '@/lib/api-client'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { ReportViewer } from '@/components/reports/report-viewer'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return { title: 'Relatório | Trax' }
}

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const host = (await headers()).get('host') ?? ''

  let report = null
  try {
    report = await apiRequest<any>(`/reports/${id}`, { domain: host })
  } catch {
    notFound()
  }

  return <ReportViewer report={report} />
}
