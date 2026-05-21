import { ClientForm } from '@/components/clients/client-form'
import { apiRequest } from '@/lib/api-client'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'

export const metadata = {
  title: 'Editar Cliente | Trax',
}

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const host = (await headers()).get('host') ?? ''

  let client = null
  try {
    client = await apiRequest<any>(`/clients/${id}`, { domain: host })
  } catch (error) {
    notFound()
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ClientForm
        initialData={{
          id: client.id,
          name: client.name,
          email: client.email,
          website: client.website,
          logoUrl: client.logoUrl,
        }}
        mode="edit"
      />
    </div>
  )
}
