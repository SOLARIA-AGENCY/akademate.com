import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import NuevaConvocatoriaPage from '@/app/(app)/(dashboard)/programacion/nueva/page'

// Helper to mock sequential fetch calls for the 4 parallel requests
function mockAllFetches({
  cycles = [],
  courses = [],
  staff = [],
  campuses = [],
}: {
  cycles?: Array<{ id: string; name: string }>
  courses?: Array<{ id: string; title: string }>
  staff?: Array<{ id: string; first_name: string; last_name: string }>
  campuses?: Array<{ id: string; name: string }>
}) {
  const fetchMock = global.fetch as ReturnType<typeof vi.fn>

  // The component calls Promise.all with 4 fetches
  // Each .then(r => r.json()) chain resolves in order
  fetchMock.mockImplementation((url: string) => {
    if (url.includes('/api/cycles')) {
      return Promise.resolve(
        new Response(JSON.stringify({ docs: cycles }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    }
    if (url.includes('/api/courses')) {
      return Promise.resolve(
        new Response(JSON.stringify({ docs: courses }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    }
    if (url.includes('/api/staff')) {
      return Promise.resolve(
        new Response(JSON.stringify({ docs: staff }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    }
    if (url.includes('/api/campuses')) {
      return Promise.resolve(
        new Response(JSON.stringify({ docs: campuses }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    }
    // Fallback for any other fetch (e.g., config)
    return Promise.resolve(
      new Response(JSON.stringify({}), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  })
}

const sampleCampuses = [{ id: '1', name: 'Sede Central' }]
const sampleStaff = [{ id: '1', first_name: 'Juan', last_name: 'Garcia' }]
const sampleCycles = [{ id: '1', name: 'Desarrollo Web' }]
const sampleCourses = [{ id: '1', title: 'Marketing Digital' }]

describe('NuevaConvocatoriaPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state initially', () => {
    // Make fetch hang to keep loading state
    ;(global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {}),
    )
    render(<NuevaConvocatoriaPage />)

    expect(screen.getByText(/Cargando datos/)).toBeInTheDocument()
  })

  it('shows "Se necesita al menos una sede" when no campuses', async () => {
    mockAllFetches({
      cycles: sampleCycles,
      courses: sampleCourses,
      staff: sampleStaff,
      campuses: [],
    })
    render(<NuevaConvocatoriaPage />)

    await waitFor(() => {
      expect(screen.getByText(/Se necesita al menos una sede/)).toBeInTheDocument()
    })
  })

  it('shows "Se necesita al menos un profesor" when no staff but has campuses', async () => {
    mockAllFetches({
      cycles: sampleCycles,
      courses: sampleCourses,
      staff: [],
      campuses: sampleCampuses,
    })
    render(<NuevaConvocatoriaPage />)

    await waitFor(() => {
      expect(screen.getByText(/Se necesita al menos un profesor/)).toBeInTheDocument()
    })
  })

  it('shows form when both campuses and staff exist', async () => {
    mockAllFetches({
      cycles: sampleCycles,
      courses: sampleCourses,
      staff: sampleStaff,
      campuses: sampleCampuses,
    })
    render(<NuevaConvocatoriaPage />)

    await waitFor(() => {
      expect(screen.getByText('Ciclo / Curso *')).toBeInTheDocument()
    })
    expect(screen.getByText('Sede *')).toBeInTheDocument()
    expect(screen.getByText('Profesor *')).toBeInTheDocument()
  })

  it('renders ciclo/curso selector with items', async () => {
    mockAllFetches({
      cycles: sampleCycles,
      courses: sampleCourses,
      staff: sampleStaff,
      campuses: sampleCampuses,
    })
    render(<NuevaConvocatoriaPage />)

    await waitFor(() => {
      expect(screen.getByText('Seleccionar ciclo o curso')).toBeInTheDocument()
    })
    // The select content shows cycles and courses sections
    expect(screen.getByText('Ciclos')).toBeInTheDocument()
    expect(screen.getByText('Cursos')).toBeInTheDocument()
    expect(screen.getByText('Desarrollo Web')).toBeInTheDocument()
    expect(screen.getByText('Marketing Digital')).toBeInTheDocument()
  })

  it('renders sede and profesor selectors', async () => {
    mockAllFetches({
      cycles: sampleCycles,
      courses: sampleCourses,
      staff: sampleStaff,
      campuses: sampleCampuses,
    })
    render(<NuevaConvocatoriaPage />)

    await waitFor(() => {
      expect(screen.getByText('Seleccionar sede')).toBeInTheDocument()
    })
    expect(screen.getByText('Seleccionar profesor')).toBeInTheDocument()
    // Items should be rendered in the mock select
    expect(screen.getByText('Sede Central')).toBeInTheDocument()
    expect(screen.getByText('Juan Garcia')).toBeInTheDocument()
  })

  it('submit button is disabled when required fields are empty', async () => {
    mockAllFetches({
      cycles: sampleCycles,
      courses: sampleCourses,
      staff: sampleStaff,
      campuses: sampleCampuses,
    })
    render(<NuevaConvocatoriaPage />)

    await waitFor(() => {
      expect(screen.getByText('Ciclo / Curso *')).toBeInTheDocument()
    })

    const submitButton = screen.getByRole('button', { name: /Crear Convocatoria/ })
    expect(submitButton).toBeDisabled()
  })

  it('renders date fields for start and end dates', async () => {
    mockAllFetches({
      cycles: sampleCycles,
      courses: sampleCourses,
      staff: sampleStaff,
      campuses: sampleCampuses,
    })
    render(<NuevaConvocatoriaPage />)

    await waitFor(() => {
      expect(screen.getByLabelText(/Fecha inicio/)).toBeInTheDocument()
    })
    expect(screen.getByLabelText(/Fecha fin/)).toBeInTheDocument()
  })

  it('renders notas textarea', async () => {
    mockAllFetches({
      cycles: sampleCycles,
      courses: sampleCourses,
      staff: sampleStaff,
      campuses: sampleCampuses,
    })
    render(<NuevaConvocatoriaPage />)

    await waitFor(() => {
      expect(screen.getByLabelText(/Notas/)).toBeInTheDocument()
    })
  })
})
