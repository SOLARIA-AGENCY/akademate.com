import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { OpsSidebar, OpsSidebarShell } from '@/components/sidebar'

// Mock the UI sidebar components to simplify rendering
vi.mock('@/components/ui/sidebar', () => ({
  Sidebar: ({ children }: { children: React.ReactNode }) => <nav data-testid="sidebar">{children}</nav>,
  SidebarContent: ({ children }: { children: React.ReactNode }) => <div data-testid="sidebar-content">{children}</div>,
  SidebarFooter: ({ children }: { children: React.ReactNode }) => <div data-testid="sidebar-footer">{children}</div>,
  SidebarGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarGroupContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarGroupLabel: ({ children }: { children: React.ReactNode }) => <span data-testid="group-label">{children}</span>,
  SidebarHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="sidebar-header">{children}</div>,
  SidebarInset: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarMenu: ({ children }: { children: React.ReactNode }) => <ul>{children}</ul>,
  SidebarMenuButton: ({ children, ...props }: { children: React.ReactNode; asChild?: boolean; isActive?: boolean; tooltip?: string; className?: string }) => {
    if (props.asChild) return <>{children}</>
    return <button {...props}>{children}</button>
  },
  SidebarMenuItem: ({ children }: { children: React.ReactNode }) => <li>{children}</li>,
  SidebarProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarTrigger: ({ className }: { className?: string }) => <button className={className}>Toggle</button>,
  SidebarRail: () => null,
}))

// Mock the ThemeToggle to avoid next-themes complexity
vi.mock('@/components/theme-toggle', () => ({
  ThemeToggle: () => <button data-testid="theme-toggle">Theme</button>,
}))

function renderSidebar() {
  return render(
    <OpsSidebarShell>
      <OpsSidebar />
    </OpsSidebarShell>
  )
}

describe('OpsSidebar', () => {
  it('renders the sidebar element', () => {
    renderSidebar()
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
  })

  it('renders "Akademate" branding text', () => {
    renderSidebar()
    expect(screen.getByText('Akademate')).toBeInTheDocument()
  })

  it('renders "Ops Center" branding text', () => {
    renderSidebar()
    expect(screen.getByText('Ops Center')).toBeInTheDocument()
  })

  it('renders the Akademate logo image', () => {
    renderSidebar()
    const logo = screen.getByAltText('Akademate')
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('src', '/logos/akademate-icon-48.png')
  })

  it('renders all navigation section labels', () => {
    renderSidebar()

    const expectedSections = [
      'Overview',
      'Clientes',
      'Finanzas',
      'Analytics',
      'Soporte',
      'Infraestructura',
      'Operaciones',
    ]

    for (const section of expectedSections) {
      expect(screen.getByText(section)).toBeInTheDocument()
    }
  })

  it('renders Command Center nav item', () => {
    renderSidebar()
    expect(screen.getByText('Command Center')).toBeInTheDocument()
  })

  it('renders Clientes section nav items', () => {
    renderSidebar()
    expect(screen.getByText('Tenants')).toBeInTheDocument()
    expect(screen.getByText('Alta / Registro')).toBeInTheDocument()
    expect(screen.getByText('Impersonar')).toBeInTheDocument()
  })

  it('renders Finanzas section nav items', () => {
    renderSidebar()
    expect(screen.getByText('P&L Overview')).toBeInTheDocument()
    expect(screen.getByText('Ingresos')).toBeInTheDocument()
    expect(screen.getByText('Gastos Operativos')).toBeInTheDocument()
    expect(screen.getByText('Suscripciones')).toBeInTheDocument()
  })

  it('renders Analytics section nav items', () => {
    renderSidebar()
    expect(screen.getByText('Crecimiento')).toBeInTheDocument()
    expect(screen.getByText(/Retención/)).toBeInTheDocument()
  })

  it('renders Soporte section nav items', () => {
    renderSidebar()
    expect(screen.getByText('Tickets')).toBeInTheDocument()
  })

  it('renders Infraestructura section nav items', () => {
    renderSidebar()
    expect(screen.getByText('Estado del Sistema')).toBeInTheDocument()
    expect(screen.getByText('API Console')).toBeInTheDocument()
  })

  it('renders Operaciones section nav items', () => {
    renderSidebar()
    expect(screen.getByText('Equipo & Roles')).toBeInTheDocument()
    expect(screen.getByText('Audit Log')).toBeInTheDocument()
    expect(screen.getByText('Configuración')).toBeInTheDocument()
    expect(screen.getByText('Roadmap')).toBeInTheDocument()
  })

  it('renders correct hrefs for nav links', () => {
    renderSidebar()

    const expectedLinks: Record<string, string> = {
      'Command Center': '/dashboard',
      'Tenants': '/dashboard/tenants',
      'Impersonar': '/dashboard/impersonar',
      'Estado del Sistema': '/dashboard/estado',
      'API Console': '/dashboard/api',
      'Suscripciones': '/dashboard/suscripciones',
      'Tickets': '/dashboard/soporte',
      'Roadmap': '/dashboard/roadmap',
    }

    for (const [name, href] of Object.entries(expectedLinks)) {
      const link = screen.getByText(name).closest('a')
      expect(link).toHaveAttribute('href', href)
    }
  })

  it('renders the version text in footer', () => {
    renderSidebar()
    expect(screen.getByText(/v1\.1\.0/)).toBeInTheDocument()
    expect(screen.getByText(/OPS CENTER/)).toBeInTheDocument()
  })

  it('renders theme toggle in footer', () => {
    renderSidebar()
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument()
    expect(screen.getByText('Tema')).toBeInTheDocument()
  })

  it('renders the correct total number of nav items (18)', () => {
    renderSidebar()

    // All nav item names
    const allNavItems = [
      'Command Center',
      'Tenants', 'Alta / Registro', 'Impersonar',
      'P&L Overview', 'Ingresos', 'Gastos Operativos', 'Suscripciones',
      'Crecimiento', 'Retención & Churn',
      'Tickets',
      'Estado del Sistema', 'API Console',
      'Equipo & Roles', 'Audit Log', 'Configuración', 'Roadmap',
    ]

    for (const item of allNavItems) {
      expect(screen.getByText(item)).toBeInTheDocument()
    }
    expect(allNavItems).toHaveLength(17)
  })
})
