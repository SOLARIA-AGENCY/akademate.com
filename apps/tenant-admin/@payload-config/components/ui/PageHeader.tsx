'use client'

import * as React from 'react'
import { LucideIcon, Plus } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent } from './card'
import { cn } from '@payload-config/lib/utils'

interface PageHeaderProps {
  /** Page title */
  title: string
  /** Page description/subtitle */
  description?: string
  /** Icon component from lucide-react */
  icon?: LucideIcon
  /** Optional icon background class */
  iconBgColor?: string
  /** Optional icon color class */
  iconColor?: string
  /** Show "New" button */
  showAddButton?: boolean
  /** Text for add button (default: "Nuevo") */
  addButtonText?: string
  /** Callback when add button is clicked */
  onAdd?: () => void
  /** Additional actions (rendered in header row) */
  actions?: React.ReactNode
  /** Filter controls (rendered in second row) */
  filters?: React.ReactNode
  /** Badge or count to display next to title */
  badge?: React.ReactNode
  /** Whether to use card wrapper (default: true) */
  withCard?: boolean
  /** Additional className for outer wrapper */
  className?: string
}

export function PageHeader({
  title,
  description,
  badge,
  icon: HeaderIcon,
  iconColor = 'text-muted-foreground',
  iconBgColor = 'bg-muted',
  showAddButton = false,
  addButtonText = 'Nuevo',
  onAdd,
  actions,
  filters,
  withCard = true,
  className = '',
}: PageHeaderProps) {
  const content = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {HeaderIcon ? (
            <span className={cn('mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', iconBgColor, iconColor)}>
              <HeaderIcon className="h-4 w-4" aria-hidden="true" />
            </span>
          ) : null}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">
                {title}
              </h1>
              {badge}
            </div>
            {description ? (
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500 font-medium">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        <div
          data-slot="page-header-actions"
          className="flex min-w-0 flex-nowrap items-center justify-end gap-2"
        >
          {actions}
          {showAddButton && onAdd && (
            <Button onClick={onAdd} size="sm" data-oid=":ke29tb">
              <Plus className="mr-2 h-4 w-4" data-oid=":-fb6j5" />
              {addButtonText}
            </Button>
          )}
        </div>
      </div>

      {filters && (
        <div className="flex flex-wrap items-center gap-3 border-t border-border/70 pt-4" data-oid="on_hyte">
          {filters}
        </div>
      )}
    </div>
  )

  if (withCard) {
    return (
      <Card className={cn('mb-2 border-border/80 shadow-sm', className)} data-oid="ecwgyxr">
        <CardContent className="p-5 sm:p-6">{content}</CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('mb-2 py-4', className)} data-oid="mtp78ig">
      {content}
    </div>
  )
}
