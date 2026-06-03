import { CompanyTable } from '@/components/companies/company-table'
import { Pagination } from '@/components/ui/pagination'
import { apiRequest } from '@/lib/api-client'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { PaginatedResponse } from '@/types/api'

export const metadata = {
  title: 'Empresas | Trax',
}

const PAGE_SIZE = 20

interface SearchParams {
  page?: string
}

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const { page: pageStr } = await searchParams
  const page = Math.max(1, Number(pageStr ?? 1))

  let companies: any[] = []
  let total = 0

  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ')
    const host = (await headers()).get('host') ?? ''

    const response = await apiRequest<PaginatedResponse<any>>(
      `/companies?page=${page}&limit=${PAGE_SIZE}`,
      { domain: host, headers: { Cookie: allCookies } },
    )
    companies = response?.data ?? []
    total = response?.meta?.total ?? companies.length
  } catch (error) {
    if ((error as any)?.digest?.startsWith('NEXT_REDIRECT')) throw error
    console.error('Failed to fetch companies:', error)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-foreground)] tracking-tight">
          Minhas Empresas
        </h2>
        <p className="text-[var(--color-muted-foreground)] mt-1">
          Gerencie as empresas da sua agência e seus respectivos relatórios.
        </p>
      </div>

      <CompanyTable initialCompanies={companies} />

      <Pagination page={page} totalPages={totalPages} basePath="/companies" />
    </div>
  )
}
