import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Users } from 'lucide-react'
import { AddCard, ChecklistPanel, IntegrationCard, MetricCard } from '../ReferenceCards'

describe('ReferenceCards', () => {
  it('renders a metric card with label, value and optional href', () => {
    render(<MetricCard label="Alumnos" value={12} icon={Users} href="/dashboard/alumnos" />)
    expect(screen.getByText('Alumnos')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/dashboard/alumnos')
  })

  it('renders an integration card with a tone badge, not hardcoded colors', () => {
    const { container } = render(
      <IntegrationCard name="Stripe" status="Conectado" statusTone="success" />
    )
    expect(screen.getByText('Stripe')).toBeInTheDocument()
    expect(screen.getByText('Conectado')).toBeInTheDocument()
    expect(container.innerHTML).not.toMatch(/bg-emerald-/)
  })

  it('renders an add card as a dashed placeholder', () => {
    render(<AddCard label="Añadir conexión" href="/finanzas" />)
    expect(screen.getByText('Añadir conexión')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/finanzas')
  })

  it('renders checklist statuses as Completo / En curso / Pendiente', () => {
    render(
      <ChecklistPanel
        title="Arranque"
        steps={[
          { label: 'Instalar módulo', status: 'done' },
          { label: 'Conectar proveedor', status: 'current' },
          { label: 'Activar escritura', status: 'pending' },
        ]}
      />
    )
    expect(screen.getByText('Arranque')).toBeInTheDocument()
    expect(screen.getByText('Completo')).toBeInTheDocument()
    expect(screen.getByText('En curso')).toBeInTheDocument()
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
  })
})
