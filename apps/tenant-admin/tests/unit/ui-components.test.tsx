import * as React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../utils/test-utils'
import { Users } from 'lucide-react'

// Import via alias → resolves to mock components
import { EmptyState } from '@payload-config/components/ui/EmptyState'
import { ResultsSummaryBar } from '@payload-config/components/ui/ResultsSummaryBar'
import { Badge } from '@payload-config/components/ui/badge'

// ─── EmptyState ──────────────────────────────────────────────────────────────

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState icon={Users} title="Sin datos" description="No hay elementos que mostrar." />)
    expect(screen.getByTestId('empty-state-title')).toHaveTextContent('Sin datos')
    expect(screen.getByTestId('empty-state-description')).toHaveTextContent('No hay elementos que mostrar.')
  })

  it('renders without action button when action is omitted', () => {
    render(<EmptyState icon={Users} title="Vacío" description="Descripción." />)
    expect(screen.queryByTestId('empty-state-action')).toBeNull()
  })

  it('renders action button with correct label', () => {
    const onClick = vi.fn()
    render(
      <EmptyState
        icon={Users}
        title="Sin campañas"
        description="Crea tu primera campaña."
        action={{ label: 'Nueva campaña', onClick }}
      />
    )
    const btn = screen.getByTestId('empty-state-action')
    expect(btn).toHaveTextContent('Nueva campaña')
  })

  it('calls action.onClick when button is clicked', async () => {
    const onClick = vi.fn()
    render(
      <EmptyState
        icon={Users}
        title="T"
        description="D"
        action={{ label: 'Crear', onClick }}
      />
    )
    screen.getByTestId('empty-state-action').click()
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('applies custom className to wrapper', () => {
    const { container } = render(
      <EmptyState icon={Users} title="T" description="D" className="custom-class" />
    )
    expect(container.firstChild).toHaveClass('custom-class')
  })
})

// ─── ResultsSummaryBar ────────────────────────────────────────────────────────

describe('ResultsSummaryBar', () => {
  it('renders count and entity', () => {
    render(<ResultsSummaryBar count={12} entity="alumnos" />)
    expect(screen.getByTestId('results-count')).toHaveTextContent('12')
    expect(screen.getByTestId('results-entity')).toHaveTextContent('alumnos')
  })

  it('renders zero count correctly', () => {
    render(<ResultsSummaryBar count={0} entity="resultados" />)
    expect(screen.getByTestId('results-count')).toHaveTextContent('0')
  })

  it('renders extra when provided', () => {
    render(<ResultsSummaryBar count={5} entity="leads" extra="3 sin gestionar" />)
    expect(screen.getByTestId('results-extra')).toHaveTextContent('3 sin gestionar')
  })

  it('does not render extra section when omitted', () => {
    render(<ResultsSummaryBar count={5} entity="leads" />)
    expect(screen.queryByTestId('results-extra')).toBeNull()
  })

  it('applies custom className', () => {
    const { container } = render(
      <ResultsSummaryBar count={1} entity="item" className="mt-4" />
    )
    expect(container.firstChild).toHaveClass('mt-4')
  })
})

// ─── Badge (mock — semantic variant passthrough) ──────────────────────────────

describe('Badge mock — data-variant propagation', () => {
  const variants = [
    'default', 'secondary', 'destructive', 'outline',
    'success', 'warning', 'info', 'neutral',
  ] as const

  variants.forEach((variant) => {
    it(`variant="${variant}" is set as data-variant attribute`, () => {
      render(<Badge variant={variant}>Label</Badge>)
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveAttribute('data-variant', variant)
    })
  })

  it('renders children text', () => {
    render(<Badge>Activo</Badge>)
    expect(screen.getByTestId('badge')).toHaveTextContent('Activo')
  })

  it('forwards className', () => {
    render(<Badge className="custom">X</Badge>)
    expect(screen.getByTestId('badge')).toHaveClass('custom')
  })
})
