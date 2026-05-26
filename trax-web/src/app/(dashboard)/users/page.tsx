import { headers } from 'next/headers'
import { apiRequest } from '@/lib/api-client'
import { UsersTable } from '@/components/users/users-table'

export const metadata = { title: 'Equipe — Trax' }

export default async function UsersPage() {
  const host = (await headers()).get('host') ?? ''

  let users: any[] = []
  let clients: any[] = []

  try {
    users = await apiRequest<any[]>('/users', { domain: host })
  } catch { /* silent */ }

  try {
    const res = await apiRequest<any>('/clients?limit=100', { domain: host })
    clients = Array.isArray(res) ? res : (res?.data ?? [])
  } catch { /* silent */ }

  return (
    <div className="space-y-6">
      <UsersTable users={users} clients={clients} />
    </div>
  )
}
