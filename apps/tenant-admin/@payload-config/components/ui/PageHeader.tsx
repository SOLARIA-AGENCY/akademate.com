'use client'

import * as React from 'react'
import { LucideIcon, Plus } from 'lucide-react'
import { Button } from './button'

interface PageHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  iconBgColor?: string
  iconColor?: string
  showAddButton?: boolean
  addButtonText?: string
  onAdd?: () => void
  actions?: React.ReactNode
  filters?: React.ReactNode
  badge?: React.ReactNode
  withCard?: boolean
  className?: string
}

export function PageHeader({
  title,
  showAddButton = false,
  addButtonText = 'Nuevo',
  onAdd,
  actions,
  filters,
  className = '',
}: PageHeaderProps) {
  return (
    <header data-testid="page-header" className={`pb-2 ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        <div className="flex w-full flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end">
          {actions}
          {showAddButton && onAdd && (
            <Button onClick={onAdd} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              {addButtonText}
            </Button>
          )}
        </div>
      </div>
      {filters && (
        <div className="mt-3 flex flex-wrap items-center justify-start gap-3 text-left">
          {filters}
        </div>
      )}
    </header>
  )
}
