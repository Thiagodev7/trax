import { Skeleton } from '@/components/ui/skeleton'

function KpiCardSkeleton() {
  return (
    <div className="card p-6 flex flex-col justify-between gap-4">
      <div className="flex justify-between items-start">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-9 rounded-[var(--radius-md)]" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Operational KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 pt-2">
        <div className="h-px flex-1 bg-[var(--color-border)]" />
        <Skeleton className="h-4 w-48" />
        <div className="h-px flex-1 bg-[var(--color-border)]" />
      </div>

      {/* Metrics KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-48 w-full rounded-[var(--radius-md)]" />
        </div>
        <div className="card p-6 space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-48 w-full rounded-[var(--radius-md)]" />
        </div>
      </div>

      {/* Activity feed */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-[var(--color-border)]">
          <Skeleton className="h-4 w-36" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-4 px-5 py-4 border-b border-[var(--color-border)] last:border-0">
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-3 w-20 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
