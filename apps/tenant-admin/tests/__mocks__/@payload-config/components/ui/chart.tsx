import React from 'react'

export function ChartContainer({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
  config?: unknown
}) {
  return (
    <div data-testid="chart" className={className}>
      {children}
    </div>
  )
}

export type ChartConfig = Record<string, { label?: React.ReactNode; color?: string }>
