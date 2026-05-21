import { ClientTable } from '@/components/clients/client-table'
import { apiRequest } from '@/lib/api-client'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export const metadata = {
  title: 'Clientes | Trax',
}

export default async function ClientsPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  // Faz fetch no lado do servidor para SEO e velocidade
  let clients = []
  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ')
    const host = (await headers()).get('host') ?? ''
    
    const response = await apiRequest<any>('/clients', {
      domain: host,
      headers: {
        Cookie: allCookies
      }
    })
    
    clients = response
  } catch (error) {
    console.error('Failed to fetch clients:', error)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-foreground)] tracking-tight">
          Meus Clientes
        </h2>
        <p className="text-[var(--color-muted-foreground)] mt-1">
          Gerencie os clientes da sua agência e seus respectivos relatórios.
        </p>
      </div>

      <ClientTable initialClients={clients} />
    </div>
  )
}
