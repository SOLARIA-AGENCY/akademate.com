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

/**
 * Standardized page header component for all dashboard pages.
 *
 * Follows the Planner Visual design pattern:
 * - Card wrapper with shadow and border
 * - Two-row layout: Title/Actions + Filters
 * - Consistent spacing and typography
 *
 * @example
 * ```tsx
 * <PageHeader
 *   title="Planner Visual"
 *   description="Calendario semanal de aulas y horarios"
 *   icon={Calendar}
 *   showAddButton
 *   addButtonText="Nueva Clase"
 *   onAdd={() => router.push('/planner/nuevo')}
 *   actions={
 *     <>
 *       <Button variant="outline" size="sm">
 *         <Download className="mr-2 h-4 w-4" />
 *         Exportar
 *       </Button>
 *     </>
 *   }
 *   filters={
 *     <div className="flex items-center gap-4">
 *       <Select>...</Select>
 *       <ViewToggle>...</ViewToggle>
 *     </div>
 *   }
 * />
 * ```
 */
export function PageHeader({
  title,
  description,
  icon: Icon,
  showAddButton = false,
  addButtonText = 'Nuevo',
  onAdd,
  actions,
  filters,
  badge,
  withCard = true,
  className = '',
}: PageHeaderProps) {
  const content = (
    <>
      {/* Row 1: Title and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              {badge}
            </div>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {actions}
          {showAddButton && onAdd && (
            <Button onClick={onAdd}>
              <Plus className="mr-2 h-4 w-4" />
              {addButtonText}
            </Button>
          )}
        </div>
      </div>

      {/* Row 2: Filters (optional) */}
      {filters && (
        <div className="flex items-center gap-4 flex-wrap mt-4 pt-4 border-t border-border">
          {filters}
        </div>
      )}
    </>
  )

  if (withCard) {
    return (
      <div className={`bg-card rounded-lg shadow-sm p-4 mb-4 border border-border ${className}`}>
        {content}
      </div>
    )
  }

  return (
    <div className={`space-y-4 mb-6 ${className}`}>
      {content}
    </div>
  )
}
