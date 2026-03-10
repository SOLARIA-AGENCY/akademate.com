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
  <div data-testid="page-header" data-oid="o2m1v9-">
    <h1 data-testid="page-header-title" data-oid="c0no54_">
      {title}
    </h1>
    {description && (
      <p data-testid="page-header-description" data-oid="akcefgv">
        {description}
      </p>
    )}
    {badge && (
      <div data-testid="page-header-badge" data-oid="_eag2_9">
        {badge}
      </div>
    )}
    {actions && (
      <div data-testid="page-header-actions" data-oid="9i57wbm">
        {actions}
      </div>
    )}
    {filters && (
      <div data-testid="page-header-filters" data-oid="8rc80uq">
        {filters}
      </div>
    )}
  </div>
)
