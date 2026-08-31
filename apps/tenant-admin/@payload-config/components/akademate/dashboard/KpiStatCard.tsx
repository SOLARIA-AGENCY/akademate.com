'use client'

import * as React from 'react'
import Link from 'next/link'
import { type LucideIcon, TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { cn } from '@payload-config/lib/utils'

export function KpiStatCard({
  label,
  value,
  delta,
  deltaTone = 'neutral',
  comparisonLabel,
  helper,
  icon: Icon,
  href,
  className,
}: {
  label: string
  value: React.ReactNode
  delta?: React.ReactNode
  deltaTone?: 'success' | 'danger' | 'neutral'
  comparisonLabel?: string
  helper?: React.ReactNode
  icon?: LucideIcon
  href?: string
  className?: string
}) {
  const deltaClass =
    deltaTone === 'danger'
      ? 'text-red-600'
      : deltaTone === 'success'
        ? 'text-emerald-600'
        : 'text-muted-foreground'
  const inner = (
    <Card className={cn('h-full min-w-0', className)} data-slot="kpi-stat-card">
      <CardContent className="flex h-full flex-col p-5">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <p className="text-meta min-w-0 truncate text-[13px] leading-4 text-muted-foreground">{label}</p>
          {Icon ? <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" /> : null}
        </div>
        <div className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</div>
        {delta ? (
          <div className={cn('mt-2 inline-flex min-w-0 items-center gap-1 text-xs font-medium', deltaClass)}>
            {deltaTone === 'danger' ? (
              <TrendingDown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            ) : deltaTone === 'success' ? (
              <TrendingUp className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            ) : null}
            <span>{delta}</span>
            {comparisonLabel ? (
              <span className="text-micro truncate text-[10px] font-normal leading-none text-muted-foreground">
                {comparisonLabel}
              </span>
            ) : null}
          </div>
        ) : null}
        {helper ? <p className="mt-auto pt-2 text-xs text-muted-foreground">{helper}</p> : null}
      </CardContent>
    </Card>
  )

  if (!href) return inner
  return (
    <Link
      href={href}
      className="block h-full min-w-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {inner}
    </Link>
  )
}
