'use client'

import * as React from 'react'
import { type LucideIcon } from 'lucide-react'
import { Button } from './button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from './empty'

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
    <Empty className={className} data-oid="in5ikk1">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon className="h-8 w-8 text-muted-foreground" data-oid="3pr_74m" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {(action ?? secondaryAction) && (
        <EmptyContent>
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
        </EmptyContent>
      )}
    </Empty>
  )
}
