'use client'

import * as React from 'react'
import { type LucideIcon } from 'lucide-react'
import { Button } from './button'

interface EmptyStateAction {
  label: string
  onClick: () => void
}

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: EmptyStateAction
  secondaryAction?: EmptyStateAction
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}
      data-oid="in5ikk1"
    >
      <div className="mb-4 rounded-full bg-muted p-4" data-oid="emvk6bz">
        <Icon className="h-8 w-8 text-muted-foreground" data-oid="3pr_74m" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground" data-oid="oj.1moz">
        {title}
      </h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground" data-oid="-i61487">
        {description}
      </p>
      {(action ?? secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <Button onClick={action.onClick} data-oid="nk6vt24">
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
