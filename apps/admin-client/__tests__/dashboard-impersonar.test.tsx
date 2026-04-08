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
    ok: true,
    json: () => Promise.resolve({ docs: tenants }),
  })
}

async function renderReady() {
  render(<ImpersonarPage />)
  await screen.findByText('2 tenants')
}

describe('ImpersonarPage', () => {
  beforeEach(() => {
    setupFetchMock()
  })

  it('renders page title "Impersonar Tenant"', async () => {
    await renderReady()
    expect(screen.getByText('Impersonar Tenant')).toBeInTheDocument()
  })

  it('renders page description', async () => {
    await renderReady()
    expect(
      screen.getByText('Acceso auditado a dashboard y admin de tenant')
    ).toBeInTheDocument()
  })

  it('shows warning banner about elevated privileges', async () => {
    await renderReady()
    expect(screen.getByText('Acceso con privilegios elevados')).toBeInTheDocument()
    expect(
      screen.getByText('Todas las acciones quedan auditadas por tenant, URL de destino y operador.')
    ).toBeInTheDocument()
  })

  it('shows search input', async () => {
    await renderReady()
    expect(
      screen.getByPlaceholderText('Buscar por nombre, slug o email del admin...')
    ).toBeInTheDocument()
  })

  it('shows view toggle buttons', async () => {
    await renderReady()
    expect(screen.getByRole('button', { name: 'Lista' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tarjetas' })).toBeInTheDocument()
  })

  it('defaults to list view', async () => {
    await renderReady()
    expect(screen.getByText('Tenant')).toBeInTheDocument()
    expect(screen.getByText('Acciones')).toBeInTheDocument()
  })

  it('shows table with correct column headers in list view', async () => {
    await renderReady()
    expect(screen.getByText('Tenant')).toBeInTheDocument()
    expect(screen.getByText('Dominio')).toBeInTheDocument()
    expect(screen.getByText('Estado')).toBeInTheDocument()
    expect(screen.getByText('Acciones')).toBeInTheDocument()
  })

  it('shows tenant data in the table', async () => {
    await renderReady()
    expect(screen.getByText('CEP Comunicación')).toBeInTheDocument()
    expect(screen.getByText('cepcomunicacion')).toBeInTheDocument()
    expect(screen.getByText('Academia Test')).toBeInTheDocument()
    expect(screen.getByText('academia-test')).toBeInTheDocument()
  })

  it('shows Dashboard and Payload action buttons for each tenant', async () => {
    await renderReady()
    const dashboardButtons = screen.getAllByText('Dashboard')
    const payloadButtons = screen.getAllByText('Payload')
    expect(dashboardButtons).toHaveLength(2)
    expect(payloadButtons).toHaveLength(2)
  })

  it('shows active/inactive status badges', async () => {
    await renderReady()
    expect(screen.getByText('Activo')).toBeInTheDocument()
    expect(screen.getByText('Inactivo')).toBeInTheDocument()
  })

  it('shows tenant count', async () => {
    await renderReady()
    expect(screen.getByText('2 tenants')).toBeInTheDocument()
  })

  it('switches to card view when cards toggle is clicked', async () => {
    const user = userEvent.setup()
    await renderReady()
    const cardsToggle = screen.getByRole('button', { name: 'Tarjetas' })
    await user.click(cardsToggle)

    await waitFor(() => {
      expect(screen.queryByText('Tenant')).not.toBeInTheDocument()
      expect(screen.getAllByText('Dashboard')).toHaveLength(2)
      expect(screen.getAllByText('Payload')).toHaveLength(2)
    })
  })

  it('filters tenants by search term', async () => {
    const user = userEvent.setup()
    await renderReady()

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
    await renderReady()

    const dashboardButtons = screen.getAllByText('Dashboard')
    await user.click(dashboardButtons[0])

    await waitFor(() => {
      expect(screen.getByText('Destino previsto')).toBeInTheDocument()
      expect(screen.getByText('Motivo (opcional)')).toBeInTheDocument()
      expect(screen.getByText('Cancelar')).toBeInTheDocument()
      expect(screen.getByText('Abrir Dashboard')).toBeInTheDocument()
    })
  })

  it('shows confirmation modal when Payload button is clicked', async () => {
    const user = userEvent.setup()
    await renderReady()

    const payloadButtons = screen.getAllByText('Payload')
    await user.click(payloadButtons[0])

    await waitFor(() => {
      expect(screen.getByText('Destino previsto')).toBeInTheDocument()
      expect(screen.getByText('Abrir Payload Admin')).toBeInTheDocument()
      expect(screen.getByText('https://cepformacion.akademate.com/admin')).toBeInTheDocument()
    })
  })

  it('closes modal when Cancelar is clicked', async () => {
    const user = userEvent.setup()
    await renderReady()

    await user.click(screen.getAllByText('Dashboard')[0])

    await waitFor(() => {
      expect(screen.getByText('Cancelar')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Cancelar'))

    await waitFor(() => {
      expect(screen.queryByText('Abrir Dashboard')).not.toBeInTheDocument()
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
