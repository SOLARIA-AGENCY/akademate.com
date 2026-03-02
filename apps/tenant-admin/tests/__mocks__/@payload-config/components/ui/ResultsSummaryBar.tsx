import React from 'react'

export const ResultsSummaryBar = ({
  count,
  entity,
  extra,
  className,
}: {
  count: number
  entity: string
  extra?: string
  className?: string
}) => (
  <div data-testid="results-summary-bar" className={className}>
    <span data-testid="results-count">{count}</span>
    <span data-testid="results-entity">{' '}{entity}</span>
    {extra && <span data-testid="results-extra">{' · '}{extra}</span>}
  </div>
)
