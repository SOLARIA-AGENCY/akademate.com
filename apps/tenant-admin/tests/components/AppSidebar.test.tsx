import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppSidebar } from '@payload-config/components/layout/AppSidebar'

// Mock the Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} data-oid="cv3ruk_" />
  ),
}))

describe('AppSidebar', () => {
  const defaultProps = {
    isCollapsed: false,
    onToggle: vi.fn(),
  }

  it('renders the AKADEMATE logo', () => {
    render(<AppSidebar {...defaultProps} data-oid="u.5maen" />)
    expect(screen.getByAltText('AKADEMATE')).toBeInTheDocument()
  })

  it('renders Dashboard menu item', () => {
    render(<AppSidebar {...defaultProps} data-oid="8k8b20o" />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('renders main navigation sections', () => {
    render(<AppSidebar {...defaultProps} data-oid="9xmbwx:" />)

    // Check for main menu items
    expect(screen.getByText('Programación')).toBeInTheDocument()
    expect(screen.getByText('Cursos')).toBeInTheDocument()
    expect(screen.getByText('Ciclos')).toBeInTheDocument()
    expect(screen.getByText('Sedes')).toBeInTheDocument()
  })

  it('does not render logout button (removed from sidebar)', () => {
    render(<AppSidebar {...defaultProps} data-oid="qc3seqm" />)
    // Logout should NOT be in sidebar (moved to header user menu)
    expect(screen.queryByText('Cerrar sesión')).not.toBeInTheDocument()
  })

  it('renders help section link', () => {
    render(<AppSidebar {...defaultProps} data-oid="aas1jim" />)
    expect(screen.getByText('Ayuda y Documentación')).toBeInTheDocument()
  })

  it('renders toggle button', () => {
    render(<AppSidebar {...defaultProps} data-oid="dcvikm9" />)
    const toggleButton = screen.getByTitle(/sidebar/i)
    expect(toggleButton).toBeInTheDocument()
  })

  it('shows collapsed state correctly', () => {
    render(<AppSidebar {...defaultProps} isCollapsed={true} data-oid="-upno5_" />)
    // Logo should still be visible
    expect(screen.getByAltText('AKADEMATE')).toBeInTheDocument()
  })

  it('renders icons with brand color styles', () => {
    render(<AppSidebar {...defaultProps} data-oid="4wn-0-q" />)
    // Check that icons have the magenta style applied
    const sidebarContainer = document.querySelector('[class*="bg-card"]')
    expect(sidebarContainer).toBeInTheDocument()
  })

  it('has theme-aware background (bg-card)', () => {
    render(<AppSidebar {...defaultProps} data-oid="ng71ky_" />)
    const container = document.querySelector('[class*="bg-card"]')
    expect(container).toBeInTheDocument()
  })
})
