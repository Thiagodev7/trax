import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default:
          'border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
        secondary:
          'border-[var(--color-secondary)]/20 bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]',
        success:
          'border-emerald-500/20 bg-emerald-500/10 text-emerald-500',
        warning:
          'border-amber-500/20 bg-amber-500/10 text-amber-500',
        danger:
          'border-[var(--color-danger)]/20 bg-[var(--color-danger)]/10 text-[var(--color-danger)]',
        outline:
          'border-[var(--color-border)] bg-transparent text-[var(--color-foreground-muted)]',
        muted:
          'border-transparent bg-[var(--color-surface-2)] text-[var(--color-muted-foreground)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
