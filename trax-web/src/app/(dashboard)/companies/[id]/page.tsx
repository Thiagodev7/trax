import { apiRequest } from '@/lib/api-client'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { CompanyDetailView } from '@/components/companies/company-detail-view'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  try {
    const host = (await headers()).get('host') ?? ''
    const client = await apiRequest<any>(`/companies/${id}`, { domain: host })
    return { title: `${client.name} — Trax` }
  } catch {
    return { title: 'Cliente — Trax' }
  }
}

export default async function CompanyDetailPage({ params }: Props) {
  const { id } = await params
  const host = (await headers()).get('host') ?? ''

  let client: any = null
  let integrations: any[] = []
  let reports: any[] = []

  try {
    client = await apiRequest<any>(`/companies/${id}`, { domain: host })
  } catch {
    notFound()
  }

  try {
    const intRes = await apiRequest<any>(`/companies/${id}/integrations`, { domain: host })
    integrations = Array.isArray(intRes) ? intRes : (intRes?.data ?? [])
  } catch { /* silent */ }

  try {
    const repRes = await apiRequest<any>(`/reports?companyId=${id}&limit=50`, { domain: host })
    reports = Array.isArray(repRes) ? repRes : (repRes?.data ?? [])
  } catch { /* silent */ }

  return (
    <CompanyDetailView
      client={client}
      integrations={integrations}
      reports={reports}
    />
  )
}
