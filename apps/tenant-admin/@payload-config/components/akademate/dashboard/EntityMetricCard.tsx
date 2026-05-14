'use client'

import * as React from 'react'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { cn } from '@payload-config/lib/utils'

export function EntityMetricCard({
  label,
  value,
  icon: Icon,
  helper,
  className,
}: {
  label: string
  value: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
  helper?: React.ReactNode
  className?: string
}) {
  return (
    <Card className={cn('shadow-sm', className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <span className="text-sm text-muted-foreground">{label}</span>
          {Icon ? <Icon className="size-4 shrink-0 text-primary" /> : null}
        </div>
        <div className="mt-2 text-2xl font-semibold leading-none text-foreground">{value}</div>
        {helper ? <p className="mt-2 text-xs text-muted-foreground">{helper}</p> : null}
      </CardContent>
    </Card>
  )
}
