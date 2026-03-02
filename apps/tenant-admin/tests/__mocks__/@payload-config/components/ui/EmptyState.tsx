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
  <div data-testid="empty-state" className={className}>
    <h3 data-testid="empty-state-title">{title}</h3>
    <p data-testid="empty-state-description">{description}</p>
    {action && (
      <button data-testid="empty-state-action" onClick={action.onClick}>
        {action.label}
      </button>
    )}
  </div>
)
