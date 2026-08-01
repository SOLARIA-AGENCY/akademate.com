import * as React from 'react'

import { cn } from '../lib/cn'

const variants = {
  default: 'border-border bg-card text-card-foreground',
  destructive: 'border-destructive/30 bg-destructive/10 text-destructive',
  success: 'border-success/30 bg-success/10 text-success',
  warning: 'border-warning/40 bg-warning/10 text-foreground',
} as const

export type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: keyof typeof variants
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn('rounded-lg border p-4 text-sm shadow-sm', variants[variant], className)}
      {...props}
    />
  )
)
Alert.displayName = 'Alert'

export const AlertTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn('font-semibold tracking-tight', className)} {...props} />
))
AlertTitle.displayName = 'AlertTitle'

export const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('mt-1 text-current/80', className)} {...props} />
))
AlertDescription.displayName = 'AlertDescription'
