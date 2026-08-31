'use client'

import { PolarGrid, RadialBar, RadialBarChart } from 'recharts'
import { ChartContainer, type ChartConfig } from '@payload-config/components/ui/chart'
import { Card, CardContent } from '@payload-config/components/ui/card'

const chartConfig = {
  progress: {
    label: 'Progreso',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig

export function ProgressRadialCard({
  percent,
  deltaLabel,
}: {
  percent: number
  deltaLabel?: string | null
}) {
  const value = Math.max(0, Math.min(100, percent))
  const data = [{ name: 'progress', progress: value, fill: 'var(--color-progress)' }]

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <ChartContainer config={chartConfig} className="h-24 w-24">
          <RadialBarChart
            data={data}
            innerRadius={28}
            outerRadius={42}
            startAngle={90}
            endAngle={-270}
          >
            <PolarGrid gridType="circle" radialLines={false} stroke="none" />
            <RadialBar dataKey="progress" background cornerRadius={8} />
          </RadialBarChart>
        </ChartContainer>
        <div>
          <p className="text-2xl font-semibold text-slate-900">{value}%</p>
          <p className="text-sm text-slate-500">Progreso global</p>
          {deltaLabel ? <p className="mt-1 text-xs text-emerald-700">{deltaLabel}</p> : null}
        </div>
      </CardContent>
    </Card>
  )
}
