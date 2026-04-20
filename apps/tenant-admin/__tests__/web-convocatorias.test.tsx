import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import WebConvocatoriasPage from '@/app/(app)/(dashboard)/web/convocatorias/page'

// Helper to mock fetch responses
function mockFetchResponse(data: unknown, ok = true) {
  ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
    new Response(JSON.stringify(data), {
      status: ok ? 200 : 500,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

const sampleConvocatorias = {
  data: [
    {
      id: '1',
      codigo: 'SC-2026-002',
      cursoNombre: 'Desarrollo Web',
      cursoTipo: 'ciclo',
      campusNombre: 'Sede Central',
      profesor: { full_name: 'Juan Garcia' },
      fechaInicio: '2026-09-01',
      fechaFin: '2027-06-30',
      plazasTotales: 30,
      plazasOcupadas: 12,
      estado: 'enrollment_open',
      modalidad: 'presencial',
    },
    {
      id: '2',
      codigo: 'SC-2026-003',
      cursoNombre: 'Marketing Digital',
      cursoTipo: 'curso',
      campusNombre: 'Sede Norte',
      profesor: 'Ana Lopez',
      fechaInicio: '2026-10-15',
      fechaFin: '2027-03-15',
      plazasTotales: 25,
      plazasOcupadas: 0,
      estado: 'draft',
      modalidad: 'online',
    },
  ],
}

const sampleMetaCampaigns = {
  docs: [
    {
      campaign: {
        id: '6966251962240',
        name: 'SOLARIA AGENCY - Desarrollo Web - SC-2026-002',
        status: 'active',
        destination_url: 'https://cepformacion.akademate.com/convocatorias/SC-2026-002',
      },
    },
  ],
}

describe('WebConvocatoriasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page title with "Convocatorias"', async () => {
    mockFetchResponse({ data: [] })
    render(<WebConvocatoriasPage />)

    await waitFor(() => {
      expect(screen.getByTestId('page-header-title')).toHaveTextContent('Convocatorias')
    })
  })

  it('shows loading state initially', () => {
    // Make fetch hang to keep loading state
    ;(global.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(new Promise(() => {}))
    render(<WebConvocatoriasPage />)

    expect(screen.getByText(/Cargando convocatorias/)).toBeInTheDocument()
  })

  it('shows empty state when no convocatorias', async () => {
    mockFetchResponse({ data: [] })
    render(<WebConvocatoriasPage />)

    await waitFor(() => {
      expect(screen.getByText('No hay convocatorias')).toBeInTheDocument()
    })
    expect(screen.getByText(/Crea la primera convocatoria/)).toBeInTheDocument()
    expect(screen.getByText('Nueva Convocatoria')).toBeInTheDocument()
  })

  it('shows table with convocatorias after loading', async () => {
    mockFetchResponse(sampleConvocatorias)
    render(<WebConvocatoriasPage />)

    await waitFor(() => {
      expect(screen.getAllByText('Desarrollo Web').length).toBeGreaterThan(0)
    })
    expect(screen.getAllByText('Marketing Digital').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Sede Central').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Sede Norte').length).toBeGreaterThan(0)
  })

  it('shows estado badges', async () => {
    mockFetchResponse(sampleConvocatorias)
    render(<WebConvocatoriasPage />)

    await waitFor(() => {
      expect(screen.getAllByText('Abierta').length).toBeGreaterThan(0)
    })
    expect(screen.getAllByText('Borrador').length).toBeGreaterThan(0)
  })

  it('shows toggle switch for each convocatoria', async () => {
    mockFetchResponse(sampleConvocatorias)
    render(<WebConvocatoriasPage />)

    await waitFor(() => {
      expect(screen.getAllByText('Desarrollo Web').length).toBeGreaterThan(0)
    })

    const switches = screen.getAllByRole('switch', { name: /Publicar/i })
    expect(switches.length).toBeGreaterThanOrEqual(2)

    const desarrolloSwitch = screen.getAllByRole('switch', {
      name: /Publicar Desarrollo Web/i,
    })[0]
    const marketingSwitch = screen.getAllByRole('switch', {
      name: /Publicar Marketing Digital/i,
    })[0]

    expect(desarrolloSwitch).toBeChecked()
    expect(marketingSwitch).not.toBeChecked()
  })

  it('shows error state when fetch fails', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response('', { status: 500 }),
    )
    render(<WebConvocatoriasPage />)

    await waitFor(() => {
      expect(screen.getByText(/No se pudieron cargar las convocatorias/)).toBeInTheDocument()
    })
  })

  it('shows total and published badges', async () => {
    mockFetchResponse(sampleConvocatorias)
    render(<WebConvocatoriasPage />)

    await waitFor(() => {
      expect(screen.getByText('2 total')).toBeInTheDocument()
    })
    expect(screen.getByText('1 publicadas')).toBeInTheDocument()
  })

  it('resolves active campaign badge from destination_url linkage', async () => {
    mockFetchResponse(sampleConvocatorias)
    mockFetchResponse(sampleMetaCampaigns)
    render(<WebConvocatoriasPage />)

    await waitFor(() => {
      expect(
        screen
          .getAllByTestId('campaign-badge')
          .some((badge) => badge.textContent?.includes('active#6966251962240')),
      ).toBe(true)
    })
    expect(screen.getAllByText('SOLARIA AGENCY - Desarrollo Web - SC-2026-002').length).toBeGreaterThan(0)
  })
})
