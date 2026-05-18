'use client'

import * as React from 'react'
import { Badge } from '@payload-config/components/ui/badge'
import { cn } from '@payload-config/lib/utils'

interface ResultsSummaryBarProps {
  count: number
  entity: string
  extra?: string
  className?: string
}

export function ResultsSummaryBar({
  count,
  entity,
  extra,
  className = '',
}: ResultsSummaryBarProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md border bg-muted/50 px-4 py-2 text-sm text-muted-foreground',
        className
      )}
      data-oid=".o3.p:c"
    >
      <Badge variant="secondary" className="tabular-nums">
        {count}
      </Badge>
      <span className="min-w-0 truncate" data-oid="d7qfzm.">
        {entity}
        {extra ? <span className="text-muted-foreground"> · {extra}</span> : null}
      </span>
    </div>
  )
}
