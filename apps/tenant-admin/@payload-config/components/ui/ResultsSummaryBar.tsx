'use client'

import * as React from 'react'

interface ResultsSummaryBarProps {
  count: number
  entity: string
  extra?: string
  className?: string
}

export function ResultsSummaryBar({ count, entity, extra, className = '' }: ResultsSummaryBarProps) {
  return (
    <div className={`flex items-center gap-2 bg-muted rounded-md px-4 py-2 text-sm text-muted-foreground ${className}`}>
      <span>
        <span className="font-medium text-foreground">{count}</span>{' '}
        {entity}
        {extra && (
          <>
            {' · '}
            {extra}
          </>
        )}
      </span>
    </div>
  )
}
