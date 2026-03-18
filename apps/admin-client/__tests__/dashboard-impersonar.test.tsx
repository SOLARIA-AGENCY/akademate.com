import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ImpersonarPage from '@/app/dashboard/impersonar/page'

const mockTenants = [
  {
    id: '1',
    name: 'CEP Comunicación',
    slug: 'cepcomunicacion',
    domain: 'cepformacion.akademate.com',
    active: true,
    contactEmail: 'admin@cepcomunicacion.com',
    limits: { maxUsers: 100, maxCourses: 50 },
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Academia Test',
    slug: 'academia-test',
    domain: null,
    active: false,
    contactEmail: 'test@academia.com',
    limits: { maxUsers: 10, maxCourses: 5 },
    createdAt: '2026-02-20T12:00:00Z',
  },
]

function setupFetchMock(tenants = mockTenants) {
  ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    json: () => Promise.resolve({ docs: tenants }),
  })
}

describe('ImpersonarPage', () => {
  beforeEach(() => {
    setupFetchMock()
  })

  it('renders page title "Impersonar Tenant"', async () => {
    render(<ImpersonarPage />)
    expect(screen.getByText('Impersonar Tenant')).toBeInTheDocument()
  })

  it('renders page description', async () => {
    render(<ImpersonarPage />)
    expect(
      screen.getByText('Accede al dashboard de un tenant como super-administrador')
    ).toBeInTheDocument()
  })

  it('shows warning banner about elevated privileges', async () => {
    render(<ImpersonarPage />)
    expect(screen.getByText('Acceso con privilegios elevados')).toBeInTheDocument()
    expect(
      screen.getByText(/Al impersonar un tenant, tendrás acceso completo/)
    ).toBeInTheDocument()
  })

  it('shows search input', async () => {
    render(<ImpersonarPage />)
    expect(
      screen.getByPlaceholderText('Buscar por nombre, slug o email del admin...')
    ).toBeInTheDocument()
  })

  it('shows view toggle buttons', async () => {
    render(<ImpersonarPage />)
    expect(screen.getByTitle('Vista de lista')).toBeInTheDocument()
    expect(screen.getByTitle('Vista de tarjetas')).toBeInTheDocument()
  })

  it('defaults to list view', async () => {
    render(<ImpersonarPage />)

    await waitFor(() => {
      // In list view, the table header columns should be visible
      expect(screen.getByText('Tenant')).toBeInTheDocument()
      expect(screen.getByText('Acciones')).toBeInTheDocument()
    })
  })

  it('shows table with correct column headers in list view', async () => {
    render(<ImpersonarPage />)

    await waitFor(() => {
      expect(screen.getByText('Tenant')).toBeInTheDocument()
      expect(screen.getByText('Dominio')).toBeInTheDocument()
      expect(screen.getByText('Estado')).toBeInTheDocument()
      expect(screen.getByText('Acciones')).toBeInTheDocument()
    })
  })

  it('shows tenant data in the table', async () => {
    render(<ImpersonarPage />)

    await waitFor(() => {
      expect(screen.getByText('CEP Comunicación')).toBeInTheDocument()
      expect(screen.getByText('cepcomunicacion')).toBeInTheDocument()
      expect(screen.getByText('Academia Test')).toBeInTheDocument()
      expect(screen.getByText('academia-test')).toBeInTheDocument()
    })
  })

  it('shows Dashboard and Payload action buttons for each tenant', async () => {
    render(<ImpersonarPage />)

    await waitFor(() => {
      const dashboardButtons = screen.getAllByText('Dashboard')
      const payloadButtons = screen.getAllByText('Payload')
      expect(dashboardButtons).toHaveLength(2)
      expect(payloadButtons).toHaveLength(2)
    })
  })

  it('shows active/inactive status badges', async () => {
    render(<ImpersonarPage />)

    await waitFor(() => {
      expect(screen.getByText('Activo')).toBeInTheDocument()
      expect(screen.getByText('Inactivo')).toBeInTheDocument()
    })
  })

  it('shows tenant count', async () => {
    render(<ImpersonarPage />)

    await waitFor(() => {
      expect(screen.getByText('2 tenants')).toBeInTheDocument()
    })
  })

  it('switches to card view when cards toggle is clicked', async () => {
    const user = userEvent.setup()
    render(<ImpersonarPage />)

    await waitFor(() => {
      expect(screen.getByText('CEP Comunicación')).toBeInTheDocument()
    })

    const cardsToggle = screen.getByTitle('Vista de tarjetas')
    await user.click(cardsToggle)

    // In card view, we see "Dashboard CMS" instead of just "Dashboard"
    await waitFor(() => {
      expect(screen.getAllByText('Dashboard CMS')).toHaveLength(2)
      expect(screen.getAllByText(/Payload Admin/)).toHaveLength(2)
    })
  })

  it('filters tenants by search term', async () => {
    const user = userEvent.setup()
    render(<ImpersonarPage />)

    await waitFor(() => {
      expect(screen.getByText('CEP Comunicación')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(
      'Buscar por nombre, slug o email del admin...'
    )
    await user.type(searchInput, 'CEP')

    await waitFor(() => {
      expect(screen.getByText('CEP Comunicación')).toBeInTheDocument()
      expect(screen.queryByText('Academia Test')).not.toBeInTheDocument()
    })

    expect(screen.getByText('1 tenant')).toBeInTheDocument()
  })

  it('shows confirmation modal when Dashboard button is clicked', async () => {
    const user = userEvent.setup()
    render(<ImpersonarPage />)

    await waitFor(() => {
      expect(screen.getAllByText('Dashboard')).toHaveLength(2)
    })

    const dashboardButtons = screen.getAllByText('Dashboard')
    await user.click(dashboardButtons[0])

    await waitFor(() => {
      expect(screen.getByText('Acceso Dashboard CMS')).toBeInTheDocument()
      expect(screen.getByText('Cancelar')).toBeInTheDocument()
      expect(screen.getByText('Abrir Dashboard')).toBeInTheDocument()
    })
  })

  it('shows confirmation modal when Payload button is clicked', async () => {
    const user = userEvent.setup()
    render(<ImpersonarPage />)

    await waitFor(() => {
      expect(screen.getAllByText('Payload')).toHaveLength(2)
    })

    const payloadButtons = screen.getAllByText('Payload')
    await user.click(payloadButtons[0])

    await waitFor(() => {
      expect(screen.getByText('Acceso Payload Admin (Base de Datos)')).toBeInTheDocument()
      expect(screen.getByText('Abrir Payload Admin')).toBeInTheDocument()
    })
  })

  it('closes modal when Cancelar is clicked', async () => {
    const user = userEvent.setup()
    render(<ImpersonarPage />)

    await waitFor(() => {
      expect(screen.getAllByText('Dashboard')).toHaveLength(2)
    })

    await user.click(screen.getAllByText('Dashboard')[0])

    await waitFor(() => {
      expect(screen.getByText('Cancelar')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Cancelar'))

    await waitFor(() => {
      expect(screen.queryByText('Acceso Dashboard CMS')).not.toBeInTheDocument()
    })
  })

  it('shows loading skeletons initially', () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {}) // never resolves
    )
    render(<ImpersonarPage />)
    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })

  it('shows empty message when no tenants exist', async () => {
    setupFetchMock([])
    render(<ImpersonarPage />)

    await waitFor(() => {
      expect(screen.getByText('No hay tenants registrados aún')).toBeInTheDocument()
    })
  })

  it('shows no-results message when search matches nothing', async () => {
    const user = userEvent.setup()
    render(<ImpersonarPage />)

    await waitFor(() => {
      expect(screen.getByText('CEP Comunicación')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(
      'Buscar por nombre, slug o email del admin...'
    )
    await user.type(searchInput, 'nonexistent-tenant-xyz')

    await waitFor(() => {
      expect(
        screen.getByText('No se encontraron tenants con ese criterio')
      ).toBeInTheDocument()
    })
  })

  it('calls fetch with correct URL on mount', async () => {
    render(<ImpersonarPage />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/ops/tenants?limit=100')
    })
  })
})
