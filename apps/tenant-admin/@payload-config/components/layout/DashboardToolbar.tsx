'use client'

import * as React from 'react'
import { cn } from '@payload-config/lib/utils'

export function DashboardToolbar({
  search,
  filters,
  className,
}: {
  search?: React.ReactNode
  filters?: React.ReactNode
  className?: string
}) {
  return (
    <div
      data-slot="dashboard-toolbar"
      className={cn('flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center', className)}
    >
      <div className="min-w-0 flex-1">{search}</div>
      <div className="flex min-w-0 flex-wrap items-center gap-2 xl:ml-auto">
        {filters}
      </div>
    </div>
  )
}
