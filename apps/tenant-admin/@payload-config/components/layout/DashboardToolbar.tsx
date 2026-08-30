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
      className={cn('flex flex-col gap-3 lg:flex-row lg:items-center', className)}
    >
      {search}
      <div className="ml-0 flex h-auto flex-wrap items-center gap-2 lg:ml-auto lg:h-10 lg:flex-nowrap">
        {filters}
      </div>
    </div>
  )
}
