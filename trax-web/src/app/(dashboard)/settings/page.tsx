import { BrandingForm } from '@/components/settings/branding-form'
import { apiRequest } from '@/lib/api-client'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export const metadata = {
  title: 'Configurações de Branding | Trax',
}

export default async function SettingsPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  // Fetch current branding config
  let brandingData = null
  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ')
    const host = (await headers()).get('host') ?? ''
    
    const response = await apiRequest<any>('/agency/branding', {
      domain: host,
      headers: {
        Cookie: allCookies
      }
    })
    
    brandingData = response
  } catch (error) {
    console.error('Failed to fetch agency branding:', error)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-foreground)] tracking-tight">
          Configurações White-Label
        </h2>
        <p className="text-[var(--color-muted-foreground)] mt-1">
          Personalize a identidade visual e o domínio da sua agência para todos os relatórios.
        </p>
      </div>

      {brandingData ? (
        <BrandingForm initialData={brandingData} />
      ) : (
        <div className="card p-12 text-center border-[var(--color-border)]">
          <p className="text-[var(--color-muted-foreground)]">Não foi possível carregar as configurações no momento.</p>
        </div>
      )}
    </div>
  )
}
