import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode
  rightElement?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leftIcon, rightElement, ...props }, ref) => {
    if (leftIcon || rightElement) {
      return (
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 flex items-center pointer-events-none text-[var(--color-muted)]">
              {leftIcon}
            </span>
          )}
          <input
            type={type}
            className={cn(
              'flex h-9 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-2)] text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] transition-colors',
              'focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20',
              'disabled:cursor-not-allowed disabled:opacity-50',
              leftIcon ? 'pl-9' : 'pl-3',
              rightElement ? 'pr-10' : 'pr-3',
              'py-2',
              className,
            )}
            ref={ref}
            {...props}
          />
          {rightElement && (
            <span className="absolute right-3 flex items-center text-[var(--color-muted)]">
              {rightElement}
            </span>
          )}
        </div>
      )
    }

    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] transition-colors',
          'focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
