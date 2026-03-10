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
  <div data-testid="results-summary-bar" className={className} data-oid="9o6h.n-">
    <span data-testid="results-count" data-oid="_px0kbu">
      {count}
    </span>
    <span data-testid="results-entity" data-oid="zbs6kn2">
      {' '}
      {entity}
    </span>
    {extra && (
      <span data-testid="results-extra" data-oid="9945p5x">
        {' · '}
        {extra}
      </span>
    )}
  </div>
)
