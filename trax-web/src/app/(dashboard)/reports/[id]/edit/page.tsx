import { apiRequest } from '@/lib/api-client'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { ReportBuilder } from '@/components/reports/report-builder'

export async function generateMetadata() {
  return { title: 'Editar Relatório | Trax' }
}

export default async function EditReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const host = (await headers()).get('host') ?? ''

  let report: any = null
  try {
    report = await apiRequest<any>(`/reports/${id}`, { domain: host })
  } catch {
    notFound()
  }

  let companyIntegrations: any[] = []
  try {
    companyIntegrations = await apiRequest<any[]>(
      `/companies/${report.company.id}/integrations`,
      { domain: host }
    )
  } catch {
    companyIntegrations = []
  }

  return <ReportBuilder report={report} companyIntegrations={companyIntegrations} />
}
