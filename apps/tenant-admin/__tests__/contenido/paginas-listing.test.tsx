import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import PaginasPage from '@/app/(app)/(dashboard)/contenido/paginas/page'

describe('Contenido > Paginas listing', () => {
  it('renders website page inventory including cursos, ciclos and convocatorias', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: {
            pages: [
              { title: 'Inicio', path: '/', pageKind: 'home' },
              { title: 'Cursos', path: '/cursos', pageKind: 'courses_index' },
              { title: 'Ciclos', path: '/ciclos', pageKind: 'cycles_index' },
              { title: 'Convocatorias', path: '/convocatorias', pageKind: 'convocations_index' },
            ],
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )

    render(<PaginasPage />)

    await waitFor(() => {
      expect(screen.getByText('Cursos')).toBeInTheDocument()
      expect(screen.getByText('Ciclos')).toBeInTheDocument()
      expect(screen.getByText('Convocatorias')).toBeInTheDocument()
    })

    expect(screen.getByText('/cursos')).toBeInTheDocument()
    expect(screen.getByText('/ciclos')).toBeInTheDocument()
    expect(screen.getByText('/convocatorias')).toBeInTheDocument()

    fetchMock.mockRestore()
  })
})
