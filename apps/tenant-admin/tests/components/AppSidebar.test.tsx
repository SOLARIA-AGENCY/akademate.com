import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock dependencies BEFORE importing the component
vi.mock('@/app/providers/tenant-branding', () => ({
  useTenantBranding: () => ({
    branding: {
      academyName: 'Test Academy',
      logos: { principal: '', oscuro: '', claro: '', favicon: '' },
      theme: {
        primary: '#0066CC',
        secondary: '#1A56D6',
        accent: '#1A56D6',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      tenantId: 'test-tenant',
    },
    loading: false,
  }),
}))

vi.mock('swr', () => ({
  default: () => ({ data: undefined, error: undefined, isLoading: false }),
}))

vi.mock('@/types', () => ({
  // MenuItem type is only used for TypeScript, but we need the module to resolve
}))

// Import the REAL component using a relative path to bypass the mock alias
import { AppSidebar } from '../../@payload-config/components/layout/AppSidebar'

describe('AppSidebar', () => {
  const defaultProps = {
    isCollapsed: false,
    onToggle: vi.fn(),
  }

  // ── Existing tests (preserved) ──────────────────────────────────────

  it('renders the AKADEMATE logo', () => {
    render(<AppSidebar {...defaultProps} />)
    expect(screen.getByAltText('Akademate')).toBeInTheDocument()
  })

  it('renders Dashboard menu item', () => {
    render(<AppSidebar {...defaultProps} />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('renders main navigation sections', () => {
    render(<AppSidebar {...defaultProps} />)
    expect(screen.getByText('Programación')).toBeInTheDocument()
    expect(screen.getByText('Cursos')).toBeInTheDocument()
    expect(screen.getByText('Ciclos')).toBeInTheDocument()
    expect(screen.getByText('Sedes')).toBeInTheDocument()
  })

  it('does not render logout button (removed from sidebar)', () => {
    render(<AppSidebar {...defaultProps} />)
    expect(screen.queryByText('Cerrar sesión')).not.toBeInTheDocument()
  })

  it('renders help section link', () => {
    render(<AppSidebar {...defaultProps} />)
    expect(screen.getByText('Ayuda y Documentación')).toBeInTheDocument()
  })

  it('renders toggle button', () => {
    render(<AppSidebar {...defaultProps} />)
    const toggleButton = screen.getByTitle(/sidebar/i)
    expect(toggleButton).toBeInTheDocument()
  })

  it('shows collapsed state correctly', () => {
    render(<AppSidebar {...defaultProps} isCollapsed={true} />)
    expect(screen.getByAltText('Akademate')).toBeInTheDocument()
  })

  it('renders icons with brand color styles', () => {
    render(<AppSidebar {...defaultProps} />)
    const sidebarContainer = document.querySelector('[class*="bg-card"]')
    expect(sidebarContainer).toBeInTheDocument()
  })

  it('has theme-aware background (bg-card)', () => {
    render(<AppSidebar {...defaultProps} />)
    const container = document.querySelector('[class*="bg-card"]')
    expect(container).toBeInTheDocument()
  })

  // ── New tests for recent sidebar changes ────────────────────────────

  describe('Administración section', () => {
    it('renders "Administración" section with Usuarios, Roles, Suscripción, Actividad items', () => {
      render(<AppSidebar {...defaultProps} />)

      // The parent menu item
      expect(screen.getByText('Administración')).toBeInTheDocument()

      // Sub-items are in the DOM (inside a collapsed accordion with max-h-0)
      expect(screen.getByText('Usuarios')).toBeInTheDocument()
      expect(screen.getByText('Roles y Permisos')).toBeInTheDocument()
      expect(screen.getByText('Suscripción')).toBeInTheDocument()
      expect(screen.getByText('Registro de Actividad')).toBeInTheDocument()
    })
  })

  describe('Configuración as direct link', () => {
    it('renders "Configuración" as a direct link (not an expandable submenu)', () => {
      render(<AppSidebar {...defaultProps} />)

      const configLink = screen.getByText('Configuración').closest('a')
      expect(configLink).toBeInTheDocument()
      // It should be a link (<a>), not a button (expandable submenus use <button>)
      expect(configLink?.tagName).toBe('A')
    })

    it('Configuración link points to /configuracion', () => {
      render(<AppSidebar {...defaultProps} />)

      const configLink = screen.getByText('Configuración').closest('a')
      expect(configLink).toHaveAttribute('href', '/configuracion')
    })
  })

  describe('removed items are not rendered', () => {
    it('does NOT render "Design System" item', () => {
      render(<AppSidebar {...defaultProps} />)
      expect(screen.queryByText('Design System')).not.toBeInTheDocument()
    })

    it('does NOT render "Impersonar Usuario" item', () => {
      render(<AppSidebar {...defaultProps} />)
      expect(screen.queryByText('Impersonar Usuario')).not.toBeInTheDocument()
    })

    it('does NOT render "Áreas de Estudio" item', () => {
      render(<AppSidebar {...defaultProps} />)
      expect(screen.queryByText('Áreas de Estudio')).not.toBeInTheDocument()
    })

    it('does NOT render "Mockup Dashboard" item', () => {
      render(<AppSidebar {...defaultProps} />)
      expect(screen.queryByText('Mockup Dashboard')).not.toBeInTheDocument()
    })
  })
})
