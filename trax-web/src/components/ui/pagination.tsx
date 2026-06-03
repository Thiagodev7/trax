import Link from 'next/link'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  /** Rota sem query string, ex: `/clients` */
  basePath: string
  /** Parâmetros de query preservados entre páginas (`page` é definido automaticamente) */
  searchParams?: Record<string, string | undefined>
}

function buildPageUrl(
  basePath: string,
  pageNum: number,
  searchParams?: Record<string, string | undefined>,
): string {
  const qs = new URLSearchParams()
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) qs.set(key, value)
    }
  }
  qs.set('page', String(pageNum))
  return `${basePath}?${qs.toString()}`
}

function getPageRange(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | 'ellipsis')[] = [1]

  if (current > 3) pages.push('ellipsis')

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 2) pages.push('ellipsis')
  pages.push(total)

  return pages
}

export function Pagination({ page, totalPages, basePath, searchParams }: PaginationProps) {
  if (totalPages <= 1) return null

  const path = basePath?.trim() || '/'
  const pages = getPageRange(page, totalPages)
  const href = (p: number) => buildPageUrl(path, p, searchParams)

  return (
    <nav className="flex items-center justify-center gap-1 py-4" aria-label="Paginação">
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[var(--color-foreground)] bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface)] hover:border-[var(--color-primary)] transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </Link>
      ) : (
        <span className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[var(--color-muted)] bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg opacity-50 cursor-not-allowed">
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </span>
      )}

      <div className="flex items-center gap-1">
        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <span
              key={`ellipsis-${i}`}
              className="flex items-center justify-center w-9 h-9 text-[var(--color-muted)]"
            >
              <MoreHorizontal className="w-4 h-4" />
            </span>
          ) : (
            <Link
              key={p}
              href={href(p)}
              className={`flex items-center justify-center w-9 h-9 text-sm font-medium rounded-lg transition-all ${
                p === page
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'text-[var(--color-foreground)] bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
              }`}
            >
              {p}
            </Link>
          ),
        )}
      </div>

      {page < totalPages ? (
        <Link
          href={href(page + 1)}
          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[var(--color-foreground)] bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface)] hover:border-[var(--color-primary)] transition-all"
        >
          Próxima
          <ChevronRight className="w-4 h-4" />
        </Link>
      ) : (
        <span className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[var(--color-muted)] bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg opacity-50 cursor-not-allowed">
          Próxima
          <ChevronRight className="w-4 h-4" />
        </span>
      )}
    </nav>
  )
}
