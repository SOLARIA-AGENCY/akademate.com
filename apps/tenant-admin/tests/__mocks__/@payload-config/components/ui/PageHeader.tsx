import React from 'react'

export const PageHeader = ({
  title,
  description,
  actions,
  filters,
  badge,
}: {
  title: string
  description?: string
  icon?: unknown
  actions?: React.ReactNode
  filters?: React.ReactNode
  badge?: React.ReactNode
  showAddButton?: boolean
  addButtonText?: string
  onAdd?: () => void
  withCard?: boolean
  className?: string
}) => (
  <div data-testid="page-header">
    <h1 data-testid="page-header-title">{title}</h1>
    {description && <p data-testid="page-header-description">{description}</p>}
    {badge && <div data-testid="page-header-badge">{badge}</div>}
    {actions && <div data-testid="page-header-actions">{actions}</div>}
    {filters && <div data-testid="page-header-filters">{filters}</div>}
  </div>
)
