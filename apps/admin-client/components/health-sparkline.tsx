'use client'

interface SparklinePoint {
  latency: number
}

interface HealthSparklineProps {
  data: SparklinePoint[]
  color?: string
  width?: number
  height?: number
}

/**
 * Tiny inline SVG sparkline chart for latency history.
 * Renders a polyline within 60x24 px (default).
 */
export function HealthSparkline({
  data,
  color = '#22c55e',
  width = 60,
  height = 24,
}: HealthSparklineProps) {
  if (!data || data.length < 2) {
    return (
      <svg width={width} height={height} className="opacity-30">
        <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke={color} strokeWidth={1} strokeDasharray="2,2" />
      </svg>
    )
  }

  const values = data.map((d) => d.latency)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const padding = 2

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width
      const y = padding + ((max - v) / range) * (height - padding * 2)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg width={width} height={height} className="inline-block align-middle">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
