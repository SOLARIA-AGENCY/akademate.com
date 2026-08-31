import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KpiStatCard } from '../KpiStatCard'

describe('KpiStatCard', () => {
  it('renders a positive delta in green with an up icon', () => {
    const { container } = render(
      <KpiStatCard
        label="Alumnos activos"
        value="1.284"
        delta="+12,4%"
        deltaTone="success"
        comparisonLabel="vs. semana pasada"
        href="/dashboard/alumnos"
      />,
    )

    expect(screen.getByText('Alumnos activos')).toBeInTheDocument()
    expect(screen.getByText('+12,4%')).toBeInTheDocument()
    expect(screen.getByText('vs. semana pasada')).toBeInTheDocument()
    expect(container.innerHTML).toContain('text-emerald-600')
    expect(container.querySelector('svg.lucide-trending-up')).toBeTruthy()
  })

  it('renders a negative delta in red with a down icon', () => {
    const { container } = render(
      <KpiStatCard
        label="Leads del mes"
        value="12"
        delta="-100%"
        deltaTone="danger"
        comparisonLabel="vs. semana pasada"
      />,
    )

    expect(screen.getByText('-100%')).toBeInTheDocument()
    expect(screen.getByText('vs. semana pasada')).toBeInTheDocument()
    expect(container.innerHTML).toContain('text-red-600')
    expect(container.querySelector('svg.lucide-trending-down')).toBeTruthy()
  })
})
