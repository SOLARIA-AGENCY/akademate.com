import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ProgramacionPage from '@/app/(dashboard)/programacion/page'

describe('ProgramacionPage', () => {
  beforeEach(() => {
    vi.mocked(global.fetch).mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString()

      if (url.includes('/api/convocatorias')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: [
                {
                  id: 1,
                  cursoNombre: 'Gestión Académica',
                  cursoTipo: 'PRG-101',
                  profesor: {
                    id: 2,
                    staff_type: 'profesor',
                    first_name: 'Lucia',
                    last_name: 'Ortega',
                    full_name: 'Lucia Ortega',
                    email: 'lucia.ortega@cep.es',
                  },
                  campusNombre: 'Campus Madrid Centro',
                  modalidad: 'Aula 1',
                  horario: 'Lunes 09:00-11:00',
                  fechaInicio: '2026-03-01T00:00:00.000Z',
                  fechaFin: '2026-03-30T00:00:00.000Z',
                  plazasTotales: 30,
                  plazasOcupadas: 12,
                  estado: 'enrollment_open',
                },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        )
      }

      return Promise.resolve(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })
  })

  it('renders convocatoria data from API response', async () => {
    render(<ProgramacionPage data-oid="212ssiu" />)

    await waitFor(() => {
      expect(screen.getAllByText('Gestión Académica').length).toBeGreaterThan(0)
    })

    expect(screen.getAllByText('Campus Madrid Centro').length).toBeGreaterThan(0)
  })

  it('renders an explicit empty state when dependencies return non-success responses', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ error: 'upstream failure' }), { status: 500 })),
    )

    render(<ProgramacionPage />)

    await waitFor(() => {
      expect(screen.getAllByText('No hay convocatorias').length).toBeGreaterThan(0)
    })
  })

  it('stops rendering protected data and explains session expiry on 401', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })),
    )

    render(<ProgramacionPage />)

    await waitFor(() => {
      expect(screen.getByText(/Tu sesión ha caducado/)).toBeInTheDocument()
    })
  })

  it('switches from list to annual view without losing the empty state', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ data: [] }), { status: 200 })),
    )

    render(<ProgramacionPage />)
    await waitFor(() => {
      expect(screen.getByText('Lista operativa de convocatorias')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Cronograma/ }))

    expect(screen.getByText(`No hay convocatorias para ${new Date().getFullYear()}`)).toBeInTheDocument()
  })
})
