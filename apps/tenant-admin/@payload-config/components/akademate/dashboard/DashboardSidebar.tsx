'use client'

import { Badge } from '@payload-config/components/ui/badge'
import { Separator } from '@payload-config/components/ui/separator'
import { cn } from '@payload-config/lib/utils'

export function DashboardSidebarGroup({
  label,
  collapsed,
  className,
}: {
  label: string
  collapsed?: boolean
  className?: string
}) {
  return (
    <li className={cn('overflow-hidden pb-1 pt-4', className)}>
      {collapsed ? (
        <div className="flex justify-center" title={label} aria-label={label}>
          <Separator className="w-6 bg-primary/45" />
        </div>
      ) : (
        <span className="block whitespace-nowrap px-3 text-[10px] font-medium uppercase tracking-[0.14em] text-sidebar-foreground-muted">
          {label}
        </span>
      )}
    </li>
  )
}

export function DashboardSidebarUpcomingBadge({ className }: { className?: string }) {
  return (
    <Badge tone="neutral" className={cn('h-5 px-2 text-[10px]', className)}>
      Draft
    </Badge>
  )
}
