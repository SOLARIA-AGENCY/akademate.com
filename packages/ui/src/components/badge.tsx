import * as React from 'react'

import { cn } from '../lib/cn'

const variants = {
  default: 'border-transparent bg-primary/10 text-primary',
  secondary: 'border-transparent bg-secondary text-secondary-foreground',
  outline: 'border-border text-foreground',
  success: 'border-transparent bg-success/10 text-success',
  warning: 'border-transparent bg-warning/15 text-foreground',
  destructive: 'border-transparent bg-destructive/10 text-destructive',
} as const

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof variants }

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium', variants[variant], className)} {...props} />
}
