import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import NuevaConvocatoriaPage from '@/app/(app)/(dashboard)/programacion/nueva/page'

// Helper to mock initial catalog calls plus the independent staff reload.
function mockAllFetches({
  cycles = [],
  courses = [],
  staff = [],
  campuses = [],
}: {
  cycles?: Array<{ id: string; name: string }>
  courses?: Array<{ id: string; title: string; area_formativa?: number | { id: number; nombre?: string } }>
  staff?: Array<{ id: string; first_name?: string; last_name?: string; firstName?: string; lastName?: string; fullName?: string }>
  campuses?: Array<{ id: string; name: string }>
}) {
  const fetchMock = global.fetch as ReturnType<typeof vi.fn>

  fetchMock.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    if (url.includes('/api/staff') && init?.method === 'POST') {
      return Promise.resolve(
        new Response(JSON.stringify({
          success: true,
          data: {
            id: '99',
            firstName: 'Nueva',
            lastName: 'Docente',
            qualifiedAreas: [{ id: 7, nombre: 'Sanitaria y Clínica' }],
          },
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    }
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
const sampleCourses = [{ id: '1', title: 'Marketing Digital', area_formativa: { id: 7, nombre: 'Sanitaria y Clínica' } }]

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

  it('allows proceeding when no staff but has campuses', async () => {
    mockAllFetches({
      cycles: sampleCycles,
      courses: sampleCourses,
      staff: [],
      campuses: sampleCampuses,
    })
    render(<NuevaConvocatoriaPage />)

    await waitFor(() => {
      expect(screen.getByText('Curso / ciclo *')).toBeInTheDocument()
    })
    expect(screen.getByTitle('Crear nuevo profesor')).toBeInTheDocument()
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
      expect(screen.getByText('Curso / ciclo *')).toBeInTheDocument()
    })
    expect(screen.getByText('Sede *')).toBeInTheDocument()
    expect(screen.getByText('Profesor')).toBeInTheDocument()
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
      expect(screen.getByText('Marketing Digital')).toBeInTheDocument()
    })
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
      expect(screen.getByText('Curso / ciclo *')).toBeInTheDocument()
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

  it('keeps active teachers visible after selecting a course area so the selector can explain why each one is unavailable', async () => {
    mockAllFetches({
      cycles: sampleCycles,
      courses: sampleCourses,
      staff: sampleStaff,
      campuses: sampleCampuses,
    })
    render(<NuevaConvocatoriaPage />)

    await waitFor(() => {
      expect(screen.getByText('Curso / ciclo *')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText('Tipo de formación *'), { target: { value: 'privados' } })
    fireEvent.change(screen.getByLabelText('Área'), { target: { value: '7' } })
    fireEvent.change(screen.getByLabelText('Curso / ciclo *'), { target: { value: 'course:1' } })

    await new Promise((resolve) => setTimeout(resolve, 20))
    const staffCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
      ([url]) => String(url).includes('/api/staff?'),
    )

    expect(staffCalls).toEqual([
      [
        '/api/staff?type=profesor&status=active&limit=100',
        expect.objectContaining({ cache: 'no-store' }),
      ],
    ])
  })

  it('creates inline teachers with the selected course qualified area', async () => {
    mockAllFetches({
      cycles: sampleCycles,
      courses: sampleCourses,
      staff: [],
      campuses: sampleCampuses,
    })
    render(<NuevaConvocatoriaPage />)

    await waitFor(() => {
      expect(screen.getByText('Curso / ciclo *')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText('Tipo de formación *'), { target: { value: 'privados' } })
    fireEvent.change(screen.getByLabelText('Área'), { target: { value: '7' } })
    fireEvent.change(screen.getByLabelText('Curso / ciclo *'), { target: { value: 'course:1' } })
    fireEvent.click(screen.getByTitle('Crear nuevo profesor'))

    await waitFor(() => {
      expect(screen.getByText(/Se creará habilitado para el área/)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: 'Nueva' } })
    fireEvent.change(screen.getByLabelText(/Apellidos/), { target: { value: 'Docente' } })
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'nueva@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /^Crear Profesor$/ }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/staff',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"qualifiedAreas":["7"]'),
        }),
      )
    })

    const staffCreateCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      ([url, init]) => String(url) === '/api/staff' && init?.method === 'POST',
    )
    expect(staffCreateCall).toBeTruthy()
    expect(JSON.parse(String(staffCreateCall?.[1]?.body))).toEqual(expect.objectContaining({
      staffType: 'profesor',
      firstName: 'Nueva',
      lastName: 'Docente',
      email: 'nueva@example.com',
      qualifiedAreas: ['7'],
    }))
  })
})
