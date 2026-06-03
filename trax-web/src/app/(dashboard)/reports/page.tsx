import { ReportTable } from '@/components/reports/report-table'
import { Pagination } from '@/components/ui/pagination'
import { apiRequest } from '@/lib/api-client'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { PaginatedResponse } from '@/types/api'

export const metadata = {
  title: 'Relatórios | Trax',
}

const PAGE_SIZE = 20

interface SearchParams {
  page?: string
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const { page: pageStr } = await searchParams
  const page = Math.max(1, Number(pageStr ?? 1))

  let reports: any[] = []
  let total = 0

  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ')
    const host = (await headers()).get('host') ?? ''

    const response = await apiRequest<PaginatedResponse<any>>(
      `/reports?page=${page}&limit=${PAGE_SIZE}`,
      { domain: host, headers: { Cookie: allCookies } },
    )
    reports = response?.data ?? []
    total = response?.meta?.total ?? reports.length
  } catch (error) {
    if ((error as any)?.digest?.startsWith('NEXT_REDIRECT')) throw error
    console.error('Failed to fetch reports:', error)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

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

      <Pagination page={page} totalPages={totalPages} basePath="/reports" />
    </div>
  )
}
