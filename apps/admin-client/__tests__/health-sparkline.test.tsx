import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { HealthSparkline } from '@/components/health-sparkline'

describe('HealthSparkline', () => {
  it('renders an SVG element', () => {
    const data = [{ latency: 10 }, { latency: 20 }, { latency: 15 }]
    const { container } = render(<HealthSparkline data={data} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('renders polyline with data points when data has 2+ items', () => {
    const data = [{ latency: 10 }, { latency: 20 }, { latency: 30 }]
    const { container } = render(<HealthSparkline data={data} />)
    const polyline = container.querySelector('polyline')
    expect(polyline).toBeInTheDocument()
    expect(polyline).toHaveAttribute('points')
    // Points should contain comma-separated coordinate pairs
    const points = polyline!.getAttribute('points')!
    expect(points.split(' ').length).toBe(3)
  })

  it('renders fallback dashed line with less than 2 data points', () => {
    const data = [{ latency: 10 }]
    const { container } = render(<HealthSparkline data={data} />)
    const line = container.querySelector('line')
    expect(line).toBeInTheDocument()
    expect(line).toHaveAttribute('stroke-dasharray', '2,2')

    // Should NOT have a polyline
    const polyline = container.querySelector('polyline')
    expect(polyline).not.toBeInTheDocument()
  })

  it('renders fallback dashed line with empty data array', () => {
    const { container } = render(<HealthSparkline data={[]} />)
    const line = container.querySelector('line')
    expect(line).toBeInTheDocument()
    expect(line).toHaveAttribute('stroke-dasharray', '2,2')
  })

  it('applies default color (#22c55e) to polyline stroke', () => {
    const data = [{ latency: 10 }, { latency: 20 }]
    const { container } = render(<HealthSparkline data={data} />)
    const polyline = container.querySelector('polyline')
    expect(polyline).toHaveAttribute('stroke', '#22c55e')
  })

  it('applies custom color to polyline stroke', () => {
    const data = [{ latency: 10 }, { latency: 20 }]
    const { container } = render(
      <HealthSparkline data={data} color="#ff0000" />
    )
    const polyline = container.querySelector('polyline')
    expect(polyline).toHaveAttribute('stroke', '#ff0000')
  })

  it('applies custom color to fallback line stroke', () => {
    const data = [{ latency: 10 }]
    const { container } = render(
      <HealthSparkline data={data} color="#ff0000" />
    )
    const line = container.querySelector('line')
    expect(line).toHaveAttribute('stroke', '#ff0000')
  })

  it('applies default width (60) and height (24)', () => {
    const data = [{ latency: 10 }, { latency: 20 }]
    const { container } = render(<HealthSparkline data={data} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '60')
    expect(svg).toHaveAttribute('height', '24')
  })

  it('applies custom width and height', () => {
    const data = [{ latency: 10 }, { latency: 20 }]
    const { container } = render(
      <HealthSparkline data={data} width={120} height={48} />
    )
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '120')
    expect(svg).toHaveAttribute('height', '48')
  })

  it('applies custom width and height to fallback SVG', () => {
    const data: { latency: number }[] = []
    const { container } = render(
      <HealthSparkline data={data} width={100} height={32} />
    )
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '100')
    expect(svg).toHaveAttribute('height', '32')
  })

  it('renders fallback line centered vertically', () => {
    const data: { latency: number }[] = []
    const { container } = render(
      <HealthSparkline data={data} height={40} />
    )
    const line = container.querySelector('line')
    expect(line).toHaveAttribute('y1', '20') // height / 2
    expect(line).toHaveAttribute('y2', '20')
  })

  it('polyline has correct stroke rendering attributes', () => {
    const data = [{ latency: 10 }, { latency: 20 }]
    const { container } = render(<HealthSparkline data={data} />)
    const polyline = container.querySelector('polyline')
    expect(polyline).toHaveAttribute('fill', 'none')
    expect(polyline).toHaveAttribute('stroke-width', '1.5')
    expect(polyline).toHaveAttribute('stroke-linecap', 'round')
    expect(polyline).toHaveAttribute('stroke-linejoin', 'round')
  })

  it('handles data with identical values (flat line)', () => {
    const data = [{ latency: 50 }, { latency: 50 }, { latency: 50 }]
    const { container } = render(<HealthSparkline data={data} />)
    const polyline = container.querySelector('polyline')
    expect(polyline).toBeInTheDocument()
    // All y values should be the same when latency is identical
    const points = polyline!.getAttribute('points')!
    const yValues = points.split(' ').map((p) => parseFloat(p.split(',')[1]))
    expect(new Set(yValues).size).toBe(1)
  })
})
