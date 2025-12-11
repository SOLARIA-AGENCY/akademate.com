import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PortalPage from '../app/page'

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  LayoutDashboard: () => <svg data-testid="icon-layout" />,
  Building2: () => <svg data-testid="icon-building" />,
  Database: () => <svg data-testid="icon-database" />,
  GraduationCap: () => <svg data-testid="icon-graduation" />,
  Terminal: () => <svg data-testid="icon-terminal" />,
  ExternalLink: () => <svg data-testid="icon-external" />,
  Code2: () => <svg data-testid="icon-code" />,
}))

describe('PortalPage', () => {
  it('renders the main title', () => {
    render(<PortalPage />)
    expect(screen.getByText('Akademate')).toBeInTheDocument()
  })

  it('renders the Development Portal badge', () => {
    render(<PortalPage />)
    expect(screen.getByText('Development Portal')).toBeInTheDocument()
  })

  it('renders the subtitle', () => {
    render(<PortalPage />)
    expect(screen.getByText('Centro de control para el ecosistema de desarrollo')).toBeInTheDocument()
  })

  it('renders all 5 dashboard cards', () => {
    render(<PortalPage />)

    expect(screen.getByText('Akademate Admin')).toBeInTheDocument()
    expect(screen.getByText('Tenant Admin')).toBeInTheDocument()
    expect(screen.getByText('Payload CMS')).toBeInTheDocument()
    expect(screen.getByText('Campus Virtual')).toBeInTheDocument()
    expect(screen.getByText('SOLARIA DFO')).toBeInTheDocument()
  })

  it('renders section titles', () => {
    render(<PortalPage />)

    expect(screen.getByText('Portales del Sistema')).toBeInTheDocument()
    expect(screen.getByText('Herramientas de Desarrollo')).toBeInTheDocument()
  })

  it('renders correct port badges for each dashboard', () => {
    render(<PortalPage />)

    expect(screen.getByText('localhost:3004')).toBeInTheDocument()
    expect(screen.getByText('localhost:3009')).toBeInTheDocument()
    expect(screen.getByText('localhost:3003')).toBeInTheDocument()
    expect(screen.getByText('localhost:3005')).toBeInTheDocument()
    expect(screen.getByText('localhost:3030')).toBeInTheDocument()
  })

  it('renders dashboard descriptions', () => {
    render(<PortalPage />)

    expect(screen.getByText(/Dashboard multitenant SaaS/)).toBeInTheDocument()
    expect(screen.getByText(/Dashboard del cliente/)).toBeInTheDocument()
    expect(screen.getByText(/Backoffice y base de datos/)).toBeInTheDocument()
    expect(screen.getByText(/Portal del alumno/)).toBeInTheDocument()
    expect(screen.getByText(/Digital Field Operations/)).toBeInTheDocument()
  })

  it('renders links with correct hrefs', () => {
    render(<PortalPage />)

    const links = screen.getAllByRole('link')
    const hrefs = links.map(link => link.getAttribute('href'))

    expect(hrefs).toContain('http://localhost:3004/dashboard')
    expect(hrefs).toContain('http://localhost:3009')
    expect(hrefs).toContain('http://localhost:3003/admin')
    expect(hrefs).toContain('http://localhost:3005')
    expect(hrefs).toContain('http://localhost:3030')
  })

  it('renders links with target="_blank" for external opening', () => {
    render(<PortalPage />)

    const links = screen.getAllByRole('link').filter(link =>
      link.getAttribute('href')?.includes('localhost:')
    )
    links.forEach(link => {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })

  it('renders the footer with technology stack badges', () => {
    render(<PortalPage />)

    expect(screen.getByText('Next.js 15')).toBeInTheDocument()
    expect(screen.getByText('Payload 3')).toBeInTheDocument()
    expect(screen.getByText('Tailwind 4')).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByText('PNPM Workspaces')).toBeInTheDocument()
  })

  it('renders Stack Tecnológico section title', () => {
    render(<PortalPage />)
    expect(screen.getByText('Stack Tecnológico')).toBeInTheDocument()
  })

  it('renders Solaria Agency branding in footer', () => {
    render(<PortalPage />)
    expect(screen.getByText('Solaria Agency')).toBeInTheDocument()
  })

  it('renders Akademate Development Environment text', () => {
    render(<PortalPage />)
    expect(screen.getByText('Akademate Development Environment')).toBeInTheDocument()
  })

  it('renders status indicators for each dashboard', () => {
    render(<PortalPage />)

    // Check for Online/Unknown status text
    expect(screen.getAllByText('Online').length).toBe(4)
    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })

  it('renders Abrir text for each card', () => {
    render(<PortalPage />)
    expect(screen.getAllByText('Abrir').length).toBe(5)
  })
})
