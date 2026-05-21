import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { resolveTenant } from '@/lib/tenant'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Topbar } from '@/components/layout/topbar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const host = (await headers()).get('host') ?? ''
  const tenant = await resolveTenant(host)

  const userRole = ((session.user as any)?.role as string) ?? 'VIEWER'
  const isTopbar = tenant.branding.portalLayout === 'topbar'

  if (isTopbar) {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-[var(--color-bg)]">
        <Topbar session={session} tenant={tenant} userRole={userRole} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg)]">
      <Sidebar tenant={tenant} userRole={userRole} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header session={session} tenant={tenant} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
