'use client'

import * as React from 'react'
import { Badge } from '@payload-config/components/ui/badge'
import { cn } from '@payload-config/lib/utils'

type StatusTone = 'draft' | 'published' | 'active' | 'paused' | 'archived' | 'danger' | 'neutral'

const toneClass: Record<StatusTone, string> = {
  draft: 'bg-slate-100 text-slate-700 hover:bg-slate-100',
  published: 'bg-emerald-600 text-white hover:bg-emerald-700',
  active: 'bg-emerald-600 text-white hover:bg-emerald-700',
  paused: 'bg-amber-500 text-white hover:bg-amber-600',
  archived: 'bg-slate-700 text-white hover:bg-slate-800',
  danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  neutral: 'bg-muted text-muted-foreground hover:bg-muted',
}

export function StatusBadge({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode
  tone?: StatusTone
  className?: string
}) {
  return <Badge className={cn('rounded-full shadow-sm', toneClass[tone], className)}>{children}</Badge>
}
