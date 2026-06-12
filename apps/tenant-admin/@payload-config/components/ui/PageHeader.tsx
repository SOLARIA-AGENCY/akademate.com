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
  showAddButton = false,
  addButtonText = 'Nuevo',
  onAdd,
  actions,
  filters,
  withCard = true,
  className = '',
}: PageHeaderProps) {
  const content = (
    <div className="flex flex-col gap-4" data-oid="nq9arpo">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl" data-oid=".ik_qyi">
              {title}
            </h1>
          </div>
        </div>

        <div
          className="flex w-full flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end"
          data-oid="1n2t8tr"
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
