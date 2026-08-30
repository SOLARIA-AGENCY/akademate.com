import * as React from 'react'
import { Badge } from './badge'
import { cn } from '@payload-config/lib/utils'

export const LISTING_PILL_CLASS = 'rounded-full border px-2.5 py-0.5 text-xs font-medium'

export const LISTING_PILL_TONES = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200',
  danger: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200',
  info: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200',
  neutral: 'border-border bg-muted text-muted-foreground',
  physical: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200',
  virtual: 'border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-200',
} as const

export type ListingPillTone = keyof typeof LISTING_PILL_TONES

export function StatusDotBadge({
  tone,
  children,
  className,
}: {
  tone: ListingPillTone
  children: React.ReactNode
  className?: string
}) {
  return (
    <Badge variant="outline" className={cn(LISTING_PILL_CLASS, LISTING_PILL_TONES[tone], className)}>
      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {children}
    </Badge>
  )
}
