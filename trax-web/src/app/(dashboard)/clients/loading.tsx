import { Skeleton } from '@/components/ui/skeleton'

export default function ClientsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Table card */}
      <div className="card overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between gap-3">
          <Skeleton className="h-9 w-64 rounded-[var(--radius-md)]" />
          <Skeleton className="h-9 w-36 rounded-[var(--radius-md)]" />
        </div>

        {/* Table header */}
        <div className="grid grid-cols-5 gap-4 px-4 py-3 border-b border-[var(--color-border)]">
          {['Cliente', 'E-mail', 'Relatórios', 'Status', ''].map((col) => (
            <Skeleton key={col} className="h-3 w-full max-w-[100px]" />
          ))}
        </div>

        {/* Rows */}
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-5 gap-4 px-4 py-4 border-b border-[var(--color-border)] last:border-0 items-center"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-5 w-10 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-7 w-7 rounded-md ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
