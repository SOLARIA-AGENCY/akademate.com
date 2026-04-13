import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { NewEnrollmentDialog } from '@/app/(dashboard)/matriculas/components/NewEnrollmentDialog'

const mockFetch = vi.fn()

describe('NewEnrollmentDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onCreated: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)

      if (url.includes('/api/leads')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              docs: [
                {
                  id: 11,
                  first_name: 'Lead',
                  last_name: 'Demo',
                  email: 'lead@example.com',
                  phone: '+34 600 111 222',
                  status: 'new',
                  enrollment_id: null,
                },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        )
      }

      if (url.includes('/api/convocatorias')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              data: [
                {
                  id: 71,
                  cursoNombre: 'CFGS Desarrollo',
                  campusNombre: 'Madrid',
                  fechaInicio: '2026-09-15',
                  estado: 'enrollment_open',
                },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        )
      }

      if (url.includes('/api/enrollments/direct')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              enrollmentId: 901,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        )
      }

      if (url.includes('/api/leads/11/enroll')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              enrollmentId: 301,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        )
      }

      return Promise.resolve(
        new Response(JSON.stringify({ error: 'Not Found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    })
  })

  it('renders both enrollment sources', async () => {
    render(<NewEnrollmentDialog {...defaultProps} />)

    expect(screen.getByText('Desde lead')).toBeInTheDocument()
    expect(screen.getByText('Alta directa')).toBeInTheDocument()

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })
  })

  it('submits direct enrollment without requiring lead prequalification', async () => {
    render(<NewEnrollmentDialog {...defaultProps} />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })

    fireEvent.click(screen.getByText('Alta directa'))
    fireEvent.change(screen.getByPlaceholderText('Nombre'), { target: { value: 'Ana' } })
    fireEvent.change(screen.getByPlaceholderText('Apellidos'), { target: { value: 'Lopez' } })
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'ana@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('Teléfono'), { target: { value: '612345678' } })

    fireEvent.click(screen.getByText('Crear Matrícula'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/enrollments/direct',
        expect.objectContaining({
          method: 'POST',
        }),
      )
    })

    expect(defaultProps.onCreated).toHaveBeenCalledWith('901')
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
  })
})
