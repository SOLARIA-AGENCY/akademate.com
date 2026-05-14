import type * as React from 'react'
import { Badge } from '@payload-config/components/ui/badge'
import { cn } from '@payload-config/lib/utils'

export type PublicBadgeTone = 'primary' | 'success' | 'warning' | 'info' | 'neutral'

const publicBadgeToneClass: Record<PublicBadgeTone, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  warning: 'bg-orange-500 text-white hover:bg-orange-600',
  info: 'bg-blue-600 text-white hover:bg-blue-700',
  neutral: 'bg-slate-950 text-white hover:bg-slate-900',
}

export function PublicMediaBadge({
  children,
  tone = 'primary',
  className,
}: {
  children: React.ReactNode
  tone?: PublicBadgeTone
  className?: string
}) {
  return (
    <Badge className={cn('rounded-full shadow-sm', publicBadgeToneClass[tone], className)}>
      {children}
    </Badge>
  )
}
