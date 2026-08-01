import * as React from 'react'

import { cn } from '../lib/cn'

const variants = {
  default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
} as const
const sizes = { default: 'h-10', sm: 'h-9 min-h-9 px-3 text-xs', lg: 'h-11 px-6', icon: 'h-10 w-10 px-0' } as const

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean
  variant?: keyof typeof variants
  size?: keyof typeof sizes
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild = false, children, className, size = 'default', variant = 'default', ...props }, ref) => {
    const classes = cn('inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50', variants[variant], sizes[size], className)
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<{ className?: string }>, { className: cn(classes, (children.props as { className?: string }).className) })
    }
    return <button ref={ref} className={classes} {...props}>{children}</button>
  },
)
Button.displayName = 'Button'

export function buttonVariants({ className, size = 'default', variant = 'default' }: { className?: string; size?: keyof typeof sizes; variant?: keyof typeof variants } = {}) {
  return cn('inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium', variants[variant], sizes[size], className)
}
