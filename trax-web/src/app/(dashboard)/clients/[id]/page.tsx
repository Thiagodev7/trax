import { apiRequest } from '@/lib/api-client'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { ClientDetailView } from '@/components/clients/client-detail-view'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  try {
    const host = (await headers()).get('host') ?? ''
    const client = await apiRequest<any>(`/clients/${id}`, { domain: host })
    return { title: `${client.name} — Trax` }
  } catch {
    return { title: 'Cliente — Trax' }
  }
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params
  const host = (await headers()).get('host') ?? ''

  let client: any = null
  let integrations: any[] = []
  let reports: any[] = []

  try {
    client = await apiRequest<any>(`/clients/${id}`, { domain: host })
  } catch {
    notFound()
  }

  try {
    const intRes = await apiRequest<any>(`/clients/${id}/integrations`, { domain: host })
    integrations = Array.isArray(intRes) ? intRes : (intRes?.data ?? [])
  } catch { /* silent */ }

  try {
    const repRes = await apiRequest<any>(`/reports?clientId=${id}&limit=50`, { domain: host })
    reports = Array.isArray(repRes) ? repRes : (repRes?.data ?? [])
  } catch { /* silent */ }

  return (
    <ClientDetailView
      client={client}
      integrations={integrations}
      reports={reports}
    />
  )
}
