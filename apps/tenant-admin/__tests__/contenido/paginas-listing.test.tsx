import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import PaginasPage from '@/app/(app)/(dashboard)/contenido/paginas/page'

describe('Contenido > Paginas listing', () => {
  it('renders website page inventory including thumbnails and edit links', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: {
            pages: [
              {
                title: 'Inicio',
                path: '/',
                slug: 'home',
                pageKind: 'home',
                thumbnailUrl: '/website-cache/1/home.abc123.svg',
                sections: [{ id: 'hero', kind: 'heroCarousel', enabled: true }],
              },
              {
                title: 'Cursos',
                path: '/cursos',
                slug: 'cursos',
                pageKind: 'courses_index',
                sections: [{ id: 'list', kind: 'courseList', enabled: true }],
              },
              {
                title: 'Ciclos',
                path: '/ciclos',
                slug: 'ciclos',
                pageKind: 'cycles_index',
                sections: [{ id: 'list', kind: 'cycleList', enabled: true }],
              },
              {
                title: 'Convocatorias',
                path: '/convocatorias',
                slug: 'convocatorias',
                pageKind: 'convocations_index',
                sections: [{ id: 'list', kind: 'convocationList', enabled: true }],
              },
            ],
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )

    render(<PaginasPage />)

    await waitFor(() => {
      expect(screen.getByText('/cursos')).toBeInTheDocument()
      expect(screen.getByText('/ciclos')).toBeInTheDocument()
      expect(screen.getByText('/convocatorias')).toBeInTheDocument()
    })

    expect(screen.getAllByRole('link', { name: /editar página/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: /ver página/i }).length).toBeGreaterThan(0)
    expect(screen.getByAltText('Miniatura de Inicio')).toBeInTheDocument()

    fetchMock.mockRestore()
  })
})
