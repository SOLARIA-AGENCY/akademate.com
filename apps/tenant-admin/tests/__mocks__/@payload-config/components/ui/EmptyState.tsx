import React from 'react'

export const EmptyState = ({
  title,
  description,
  action,
  className,
}: {
  icon?: unknown
  title: string
  description: string
  action?: { label: string; onClick: () => void }
  className?: string
}) => (
  <div data-testid="empty-state" className={className} data-oid="iqrj:v8">
    <h3 data-testid="empty-state-title" data-oid="bdfyf4e">
      {title}
    </h3>
    <p data-testid="empty-state-description" data-oid="aiz7js1">
      {description}
    </p>
    {action && (
      <button data-testid="empty-state-action" onClick={action.onClick} data-oid="guhhhue">
        {action.label}
      </button>
    )}
  </div>
)
