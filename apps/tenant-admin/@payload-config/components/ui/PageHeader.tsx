'use client'

import * as React from 'react'
import { LucideIcon, Plus } from 'lucide-react'
import { Button } from './button'

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
  icon: _icon,
  iconBgColor: _iconBgColor,
  iconColor: _iconColor,
  showAddButton = false,
  addButtonText = 'Nuevo',
  onAdd,
  actions,
  filters,
  badge: _badge,
  withCard = true,
  className = '',
}: PageHeaderProps) {
  const content = (
    <>
      {/* Row 1: Title and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {actions}
          {showAddButton && onAdd && (
            <Button onClick={onAdd} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              {addButtonText}
            </Button>
          )}
        </div>
      </div>

      {/* Row 2: Filters (optional) */}
      {filters && (
        <div className="flex items-center gap-3 flex-wrap mt-3 pt-3 border-t border-border">
          {filters}
        </div>
      )}
    </>
  )

  if (withCard) {
    return (
      <div className={`py-4 mb-2 ${className}`}>
        {content}
      </div>
    )
  }

  return (
    <div className={`py-4 mb-2 ${className}`}>
      {content}
    </div>
  )
}
