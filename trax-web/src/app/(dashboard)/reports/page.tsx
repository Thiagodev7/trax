import { ReportTable } from '@/components/reports/report-table'
import { apiRequest } from '@/lib/api-client'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export const metadata = {
  title: 'Relatórios | Trax',
}

export default async function ReportsPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  // Fetch reports on server-side
  let reports = []
  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ')
    const host = (await headers()).get('host') ?? ''

    const response = await apiRequest<any>('/reports', {
      domain: host,
      headers: {
        Cookie: allCookies
      }
    })

    reports = response.data
  } catch (error) {
    if ((error as any)?.message === 'NEXT_REDIRECT' || (error as any)?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('Failed to fetch reports:', error)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-foreground)] tracking-tight">
          Relatórios
        </h2>
        <p className="text-[var(--color-muted-foreground)] mt-1">
          Acompanhe e gerencie os relatórios gerados para os seus clientes.
        </p>
      </div>

      <ReportTable initialReports={reports} />
    </div>
  )
}