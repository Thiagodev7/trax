import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('shimmer rounded-[var(--radius-md)]', className)}
      {...props}
    />
  )
}

export { Skeleton }
