import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90 active:opacity-80 shadow-sm',
        secondary:
          'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] hover:opacity-90 active:opacity-80 shadow-sm',
        outline:
          'border border-[var(--color-border)] bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] active:bg-[var(--color-surface-2)]',
        ghost:
          'bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] active:bg-[var(--color-surface-2)]',
        danger:
          'bg-[var(--color-danger)] text-[var(--color-danger-foreground)] hover:opacity-90 active:opacity-80 shadow-sm',
        link:
          'text-[var(--color-primary)] underline-offset-4 hover:underline h-auto p-0',
      },
      size: {
        sm: 'h-8 rounded-[var(--radius-sm)] px-3 text-xs',
        md: 'h-9 rounded-[var(--radius-md)] px-4',
        lg: 'h-11 rounded-[var(--radius-md)] px-6 text-base',
        icon: 'h-9 w-9 rounded-[var(--radius-md)]',
        'icon-sm': 'h-7 w-7 rounded-[var(--radius-sm)]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
