import { headers } from 'next/headers'
import { apiRequest } from '@/lib/api-client'
import { UsersTable } from '@/components/users/users-table'
import type { ApiUser, ApiCompany, AgencyPlanInfo } from '@/types/api'

export const metadata = { title: 'Equipe — Trax' }

export default async function UsersPage() {
  const host = (await headers()).get('host') ?? ''

  let users: ApiUser[] = []
  let companies: ApiCompany[] = []
  let plan: AgencyPlanInfo | null = null

  const [usersResult, companiesResult, planResult] = await Promise.allSettled([
    apiRequest<ApiUser[]>('/users', { domain: host }),
    apiRequest<ApiCompany[] | { data: ApiCompany[] }>('/companies?limit=100', { domain: host }),
    apiRequest<AgencyPlanInfo>('/agency/plan', { domain: host }),
  ])

  if (usersResult.status === 'fulfilled') users = usersResult.value
  if (companiesResult.status === 'fulfilled') {
    const res = companiesResult.value
    companies = Array.isArray(res) ? res : (res?.data ?? [])
  }
  if (planResult.status === 'fulfilled') plan = planResult.value

  return (
    <div className="space-y-6">
      <UsersTable users={users} companies={companies} plan={plan} />
    </div>
  )
}
