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
      expect(screen.getByText('Desarrollo Web')).toBeInTheDocument()
    })
    expect(screen.getByText('Marketing Digital')).toBeInTheDocument()
    expect(screen.getByText('Sede Central')).toBeInTheDocument()
    expect(screen.getByText('Sede Norte')).toBeInTheDocument()
    expect(screen.getByText('Juan Garcia')).toBeInTheDocument()
    expect(screen.getByText('Ana Lopez')).toBeInTheDocument()
  })

  it('shows estado badges', async () => {
    mockFetchResponse(sampleConvocatorias)
    render(<WebConvocatoriasPage />)

    await waitFor(() => {
      expect(screen.getByText('Abierta')).toBeInTheDocument()
    })
    expect(screen.getByText('Borrador')).toBeInTheDocument()
  })

  it('shows toggle switch for each convocatoria', async () => {
    mockFetchResponse(sampleConvocatorias)
    render(<WebConvocatoriasPage />)

    await waitFor(() => {
      expect(screen.getByText('Desarrollo Web')).toBeInTheDocument()
    })

    const switches = screen.getAllByRole('switch')
    expect(switches.length).toBe(2)

    // First convocatoria (enrollment_open) should be checked
    expect(switches[0]).toBeChecked()
    // Second convocatoria (draft) should not be checked
    expect(switches[1]).not.toBeChecked()
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
})
