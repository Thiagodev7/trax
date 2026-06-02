import { headers } from 'next/headers'
import { apiRequest } from '@/lib/api-client'
import { UsersTable } from '@/components/users/users-table'
import type { ApiUser, ApiClient, AgencyPlanInfo } from '@/types/api'

export const metadata = { title: 'Equipe — Trax' }

export default async function UsersPage() {
  const host = (await headers()).get('host') ?? ''

  let users: ApiUser[] = []
  let clients: ApiClient[] = []
  let plan: AgencyPlanInfo | null = null

  const [usersResult, clientsResult, planResult] = await Promise.allSettled([
    apiRequest<ApiUser[]>('/users', { domain: host }),
    apiRequest<ApiClient[] | { data: ApiClient[] }>('/clients?limit=100', { domain: host }),
    apiRequest<AgencyPlanInfo>('/agency/plan', { domain: host }),
  ])

  if (usersResult.status === 'fulfilled') users = usersResult.value
  if (clientsResult.status === 'fulfilled') {
    const res = clientsResult.value
    clients = Array.isArray(res) ? res : (res?.data ?? [])
  }
  if (planResult.status === 'fulfilled') plan = planResult.value

  return (
    <div className="space-y-6">
      <UsersTable users={users} clients={clients} plan={plan} />
    </div>
  )
}
