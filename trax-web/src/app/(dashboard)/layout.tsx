import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { resolveTenant } from '@/lib/tenant'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const host = (await headers()).get('host') ?? ''
  const tenant = await resolveTenant(host)

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg)]">
      <Sidebar tenant={tenant} userRole={((session.user as any)?.role as string) ?? 'VIEWER'} />
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
