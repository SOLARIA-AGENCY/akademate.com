'use client'

import * as React from 'react'
import { cn } from '@payload-config/lib/utils'

export interface InfoRowProps {
  label: string
  value?: React.ReactNode
  children?: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
  alignValue?: 'right' | 'left'
  className?: string
}

export function InfoRow({
  label,
  value,
  children,
  icon: Icon,
  alignValue = 'right',
  className,
}: InfoRowProps) {
  return (
    <div className={cn('grid gap-1 text-sm sm:grid-cols-[128px_minmax(0,1fr)] sm:items-start sm:gap-4', className)}>
      <div className="flex items-start gap-2 font-semibold text-foreground">
        {Icon ? <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" /> : null}
        <span>{label}</span>
      </div>
      <div
        className={cn(
          'min-w-0 leading-relaxed text-muted-foreground',
          alignValue === 'right' ? 'sm:text-right' : 'sm:text-left'
        )}
      >
        {children ?? value}
      </div>
    </div>
  )
}

export interface InfoGridProps {
  items: Array<{
    label: string
    value: React.ReactNode
    icon?: React.ComponentType<{ className?: string }>
  }>
  columns?: 1 | 2
  className?: string
}

export function InfoGrid({ items, columns = 1, className }: InfoGridProps) {
  return (
    <div className={cn('grid gap-3 rounded-xl bg-muted/35 p-4', columns === 2 && 'lg:grid-cols-2', className)}>
      {items.map((item) => (
        <InfoRow key={item.label} {...item} />
      ))}
    </div>
  )
}
