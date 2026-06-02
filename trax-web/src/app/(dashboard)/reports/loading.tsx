import { Skeleton } from '@/components/ui/skeleton'

export default function ReportsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Table card */}
      <div className="card overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-[var(--color-border)] flex items-center gap-3 flex-wrap">
          <Skeleton className="h-9 w-64 rounded-[var(--radius-md)]" />
          <Skeleton className="h-9 w-28 rounded-[var(--radius-md)]" />
          <div className="ml-auto">
            <Skeleton className="h-9 w-40 rounded-[var(--radius-md)]" />
          </div>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-5 gap-4 px-4 py-3 border-b border-[var(--color-border)]">
          {['Relatório', 'Cliente', 'Período', 'Status', ''].map((col) => (
            <Skeleton key={col} className="h-3 w-full max-w-[100px]" />
          ))}
        </div>

        {/* Rows */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-5 gap-4 px-4 py-4 border-b border-[var(--color-border)] last:border-0 items-center"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="w-6 h-6 rounded shrink-0" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-7 w-7 rounded-md ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
