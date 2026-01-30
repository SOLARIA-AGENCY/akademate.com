import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PortalPage from '../app/page'

describe('PortalPage', () => {
  it('renders the main title', () => {
    render(<PortalPage />)
    expect(screen.getByText('Akademate')).toBeInTheDocument()
  })

  it('renders Portal de acceso heading', () => {
    render(<PortalPage />)
    expect(screen.getByText('Portal de acceso')).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    render(<PortalPage />)
    expect(screen.getByText('Inicio')).toBeInTheDocument()
    expect(screen.getByText('Sobre')).toBeInTheDocument()
    expect(screen.getByText('Contacto')).toBeInTheDocument()
    expect(screen.getByText('Login')).toBeInTheDocument()
  })

  it('renders academy selection section', () => {
    render(<PortalPage />)
    expect(screen.getByText('Selecciona tu academia')).toBeInTheDocument()
  })

  it('renders all 3 tenant cards', () => {
    render(<PortalPage />)
    expect(screen.getByText('CEFP Akademate')).toBeInTheDocument()
    expect(screen.getByText('Solaria Academy')).toBeInTheDocument()
    expect(screen.getByText('Nova School')).toBeInTheDocument()
  })

  it('renders tenant type labels', () => {
    render(<PortalPage />)
    expect(screen.getByText('Tipo: FP')).toBeInTheDocument()
    expect(screen.getByText('Tipo: Bootcamp')).toBeInTheDocument()
    expect(screen.getByText('Tipo: Corporate')).toBeInTheDocument()
  })

  it('renders quick access section', () => {
    render(<PortalPage />)
    expect(screen.getByText('Accesos rápidos')).toBeInTheDocument()
  })

  it('renders quick access links', () => {
    render(<PortalPage />)
    expect(screen.getByText('Campus alumno')).toBeInTheDocument()
    expect(screen.getByText('Admin academia')).toBeInTheDocument()
    expect(screen.getByText('Login centralizado')).toBeInTheDocument()
  })

  it('renders footer with copyright', () => {
    render(<PortalPage />)
    expect(screen.getByTestId('footer')).toBeInTheDocument()
    expect(screen.getByTestId('copyright')).toBeInTheDocument()
  })

  it('has navigation with data-testid', () => {
    render(<PortalPage />)
    expect(screen.getByTestId('navigation')).toBeInTheDocument()
  })

  it('has logo with data-testid', () => {
    render(<PortalPage />)
    expect(screen.getByTestId('logo')).toBeInTheDocument()
  })

  it('renders tenant selector button', () => {
    render(<PortalPage />)
    expect(screen.getByTestId('tenant-selector')).toBeInTheDocument()
  })

  it('renders academy list section', () => {
    render(<PortalPage />)
    expect(screen.getByText('Academias disponibles')).toBeInTheDocument()
    expect(screen.getByTestId('academy-list')).toBeInTheDocument()
  })

  it('renders 3 tenant cards with correct data-testid', () => {
    render(<PortalPage />)
    const tenantCards = screen.getAllByTestId('tenant-card')
    expect(tenantCards).toHaveLength(3)
  })
})
