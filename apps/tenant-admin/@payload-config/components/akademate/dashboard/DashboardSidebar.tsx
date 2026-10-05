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
        <div className="flex justify-center">
          <Separator className="w-6 bg-sidebar-primary/60" />
        </div>
      ) : (
        <span className="block whitespace-nowrap px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/55">
          {label}
        </span>
      )}
    </li>
  )
}

export function DashboardSidebarUpcomingBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn('h-5 border-sidebar-border bg-white/10 px-2 text-[10px] font-semibold text-sidebar-foreground/75', className)}
    >
      Próx.
    </Badge>
  )
}
