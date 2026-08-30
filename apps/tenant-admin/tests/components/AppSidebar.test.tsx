import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SidebarProvider } from '../../@payload-config/components/ui/sidebar'

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
        sidebar: '#0F2440',
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
}))

import { AppSidebar, SIDEBAR_SUBNAV_ICON_CLASS } from '../../@payload-config/components/layout/AppSidebar'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function renderSidebar(collapsed = false) {
  return render(
    <SidebarProvider defaultOpen={!collapsed}>
      <AppSidebar />
    </SidebarProvider>
  )
}

describe('AppSidebar', () => {
  it('renders the academy logo from TenantBranding', () => {
    renderSidebar()
    expect(screen.getByAltText('Test Academy')).toBeInTheDocument()
  })

  it('renders Dashboard menu item', () => {
    renderSidebar()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('renders main navigation sections', () => {
    renderSidebar()
    expect(screen.getByText('Programación')).toBeInTheDocument()
    expect(screen.getAllByText('Cursos').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Ciclos').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Sedes').length).toBeGreaterThan(0)
  })

  it('does not render logout button (removed from sidebar)', () => {
    renderSidebar()
    expect(screen.queryByText('Cerrar sesión')).not.toBeInTheDocument()
  })

  it('renders help section link', () => {
    renderSidebar()
    expect(screen.getByText('Ayuda y Documentación')).toBeInTheDocument()
  })

  it('does not keep a collapse toggle inside the rail', () => {
    renderSidebar()
    expect(screen.queryByTitle(/sidebar/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Colapsar menu')).not.toBeInTheDocument()
  })

  it('shows collapsed state correctly', () => {
    renderSidebar(true)
    expect(screen.getByAltText('Test Academy')).toBeInTheDocument()
  })

  it('has theme-aware background (bg-transparent over tenant --sidebar)', () => {
    renderSidebar()
    const container = document.querySelector('[class*="bg-transparent"]')
    expect(container).toBeInTheDocument()
  })

  it('uses h-4 w-4 for subnav icons', () => {
    expect(SIDEBAR_SUBNAV_ICON_CLASS).toBe('h-4 w-4')
  })

  describe('Administración section', () => {
    it('renders "Administración" section with Usuarios, Roles, Suscripción, Actividad items', () => {
      renderSidebar()
      expect(screen.getByText('Administración')).toBeInTheDocument()
      expect(screen.getByText('Usuarios')).toBeInTheDocument()
      expect(screen.getByText('Roles y Permisos')).toBeInTheDocument()
      expect(screen.getByText('Suscripción')).toBeInTheDocument()
      expect(screen.getByText('Registro de Actividad')).toBeInTheDocument()
    })
  })

  describe('Configuración as direct link', () => {
    it('renders "Configuración" as a direct link (not an expandable submenu)', () => {
      renderSidebar()
      const configLink = screen.getByText('Configuración').closest('a')
      expect(configLink).toBeInTheDocument()
      expect(configLink?.tagName).toBe('A')
    })

    it('Configuración link points to /configuracion', () => {
      renderSidebar()
      const configLink = screen.getByText('Configuración').closest('a')
      expect(configLink).toHaveAttribute('href', '/configuracion')
    })
  })

  describe('Matriculacion and Accesos submenus', () => {
    it('renders Nueva matrícula and Recepción items', () => {
      renderSidebar()
      expect(screen.getByText('Nueva matrícula')).toBeInTheDocument()
      expect(screen.getByText('Recepción')).toBeInTheDocument()
      expect(screen.getByText('Planes y tarifas')).toBeInTheDocument()
    })
  })

  describe('removed items are not rendered', () => {
    it('does NOT render "Design System" item', () => {
      renderSidebar()
      expect(screen.queryByText('Design System')).not.toBeInTheDocument()
    })

    it('does NOT render "Impersonar Usuario" item', () => {
      renderSidebar()
      expect(screen.queryByText('Impersonar Usuario')).not.toBeInTheDocument()
    })

    it('does NOT render "Áreas de Estudio" item', () => {
      renderSidebar()
      expect(screen.queryByText('Áreas de Estudio')).not.toBeInTheDocument()
    })

    it('does NOT render "Mockup Dashboard" item', () => {
      renderSidebar()
      expect(screen.queryByText('Mockup Dashboard')).not.toBeInTheDocument()
    })
  })

  describe('Matriculacion and Accesos', () => {
    it('renders Nueva matrícula and Recepción items', () => {
      renderSidebar()
      expect(screen.getByText('Nueva matrícula')).toBeInTheDocument()
      expect(screen.getByText('Recepción')).toBeInTheDocument()
      expect(screen.getByText('Planes y tarifas')).toBeInTheDocument()
    })
  })
})

describe('official sidebar contract', () => {
  it('collapsed class includes overflow-x-hidden and 80px icon width', () => {
    const source = readFileSync(
      resolve(__dirname, '../../@payload-config/components/ui/sidebar.tsx'),
      'utf8'
    )
    expect(source).toContain("SIDEBAR_WIDTH_ICON = '80px'")
    expect(source).toContain("SIDEBAR_WIDTH = '240px'")
    expect(source).toContain('overflow-x-hidden')
    expect(source).toContain('data-slot="sidebar-collapse-toggle"')
    expect(source).toContain('PanelLeft')
  })
})
