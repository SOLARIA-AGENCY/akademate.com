'use client'

import * as React from 'react'
import { Badge, type BadgeTone } from '@payload-config/components/ui/badge'
import { cn } from '@payload-config/lib/utils'

type StatusTone = 'draft' | 'published' | 'active' | 'paused' | 'archived' | 'danger' | 'neutral'

const toneMap: Record<StatusTone, BadgeTone> = {
  draft: 'neutral',
  published: 'success',
  active: 'success',
  paused: 'warning',
  archived: 'neutral',
  danger: 'danger',
  neutral: 'neutral',
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
  return (
    <Badge tone={toneMap[tone]} className={cn(className)}>
      {children}
    </Badge>
  )
}
