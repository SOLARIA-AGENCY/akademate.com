import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ProgramacionPage from '@/app/(dashboard)/programacion/page'

const baseConvocatoria = {
  id: 1,
  cursoNombre: 'Gestión Académica',
  cursoTipo: 'PRG-101',
  campusNombre: 'Campus Madrid Centro',
  modalidad: 'Aula 1',
  horario: 'Lunes 09:00-11:00',
  fechaInicio: '2026-03-01T00:00:00.000Z',
  fechaFin: '2026-03-30T00:00:00.000Z',
  plazasTotales: 30,
  plazasOcupadas: 12,
  estado: 'enrollment_open',
}

function mockProgramacionFetch(data: Record<string, unknown>[]) {
  vi.mocked(global.fetch).mockImplementation((input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString()

    if (url.includes('/api/convocatorias')) {
      return Promise.resolve(
        new Response(JSON.stringify({ data }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    }

    return Promise.resolve(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
  })
}

describe('ProgramacionPage', () => {
  beforeEach(() => {
    mockProgramacionFetch([
      {
        ...baseConvocatoria,
        profesor: {
          id: 2,
          staff_type: 'profesor',
          first_name: 'Lucia',
          last_name: 'Ortega',
          full_name: 'Lucia Ortega',
          email: 'lucia.ortega@cep.es',
        },
      },
    ])
  })

  it('renders convocatoria data from API response', async () => {
    render(<ProgramacionPage data-oid="212ssiu" />)

    await waitFor(() => {
      expect(screen.getAllByText('Gestión Académica').length).toBeGreaterThan(0)
    })

    expect(screen.getAllByText('Campus Madrid Centro').length).toBeGreaterThan(0)
    expect(screen.getByText('Lucia Ortega')).toBeInTheDocument()
  })

  it('normalizes teacher strings, records, arrays and partially populated relations', async () => {
    mockProgramacionFetch([
      {
        ...baseConvocatoria,
        profesor: 'Ana String',
        profesores: [
          { id: 3, full_name: 'Beatriz Completa' },
          { id: 4, first_name: 'Carlos', last_name: 'Parcial' },
          null,
        ],
        profesorRefs: [
          { id: 5, nombre: 'Diana Referencia' },
          [{ id: 6, name: 'Elena Anidada' }],
          { id: 7 },
        ],
      },
    ])

    render(<ProgramacionPage />)

    await waitFor(() => {
      expect(screen.getByText('Ana String')).toBeInTheDocument()
    })

    for (const name of [
      'Beatriz Completa',
      'Carlos Parcial',
      'Diana Referencia',
      'Elena Anidada',
    ]) {
      expect(screen.getByText(name)).toBeInTheDocument()
    }
    expect(screen.getByText('Diana Referencia').closest('button')).toBeInTheDocument()
    expect(screen.queryByText('[object Object]')).not.toBeInTheDocument()
  })

  it('fails closed to the empty teacher label for null and unknown relation objects', async () => {
    mockProgramacionFetch([
      {
        ...baseConvocatoria,
        profesor: null,
        profesores: [{ id: 7 }, { unsupported: 'relation' }],
        profesorRefs: [{ id: 8, metadata: { unexpected: true } }],
      },
    ])

    render(<ProgramacionPage />)

    await waitFor(() => {
      expect(screen.getByText('Sin docente')).toBeInTheDocument()
    })

    expect(screen.queryByText('[object Object]')).not.toBeInTheDocument()
  })
})
