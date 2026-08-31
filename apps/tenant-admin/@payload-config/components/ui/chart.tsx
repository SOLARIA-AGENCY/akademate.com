'use client'

import * as React from 'react'
import * as RechartsPrimitive from 'recharts'

import { cn } from '@payload-config/lib/utils'

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode
    icon?: React.ComponentType
    color?: string
  }
>

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error('useChart must be used within a ChartContainer')
  }
  return context
}

function configToCssVars(config: ChartConfig): React.CSSProperties {
  const vars: Record<string, string> = {}
  for (const [key, item] of Object.entries(config)) {
    if (item.color) {
      vars[`--color-${key}`] = item.color
    }
  }
  return vars as React.CSSProperties
}

function ChartContainer({
  id,
  className,
  children,
  config,
  style,
  ...props
}: React.ComponentProps<'div'> & {
  config: ChartConfig
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children']
}) {
  const uniqueId = React.useId()
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, '')}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        style={{ ...configToCssVars(config), ...style }}
        className={cn(
          'flex justify-center text-xs [&_.recharts-layer]:outline-none [&_.recharts-surface]:outline-none [&_.recharts-radial-bar-background-sector]:fill-muted',
          className
        )}
        {...props}
      >
        <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip
const ChartLegend = RechartsPrimitive.Legend

export { ChartContainer, ChartTooltip, ChartLegend, useChart }
