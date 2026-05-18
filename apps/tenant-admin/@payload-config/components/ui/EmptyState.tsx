'use client'

import * as React from 'react'
import { type LucideIcon } from 'lucide-react'
import { Button } from './button'
import { EmptyPanel } from '@payload-config/components/akademate/dashboard'

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
    <EmptyPanel
      title={title}
      description={description}
      className={className}
      icon={
        <div className="rounded-full bg-muted p-3">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
      }
      action={
        action || secondaryAction ? (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {action && <Button onClick={action.onClick}>{action.label}</Button>}
            {secondaryAction && (
              <Button variant="outline" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )}
          </div>
        ) : null
      }
    />
  )
}
