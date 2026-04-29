import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import EditProfesorPage from '@/app/(dashboard)/profesores/[id]/editar/page'

const push = vi.fn()
const back = vi.fn()

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '32' }),
  useRouter: () => ({ push, back }),
}))

describe('EditProfesorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads campuses from Payload docs and shows the assigned base campus', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.startsWith('/api/staff')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                data: [
                  {
                    id: 32,
                    firstName: 'Sheila',
                    lastName: 'Méndez',
                    email: '',
                    phone: '',
                    position: 'Aux. en Clínicas Estéticas',
                    contractType: 'freelance',
                    employmentStatus: 'active',
                    assignedCampuses: [{ id: 2, name: 'Sede Norte', city: 'La Orotava' }],
                    photo: '/placeholder-avatar.svg',
                  },
                ],
              }),
          })
        }

        if (url.startsWith('/api/campuses')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                docs: [
                  { id: 2, name: 'Sede Norte', city: 'La Orotava' },
                  { id: 3, name: 'Sede Santa Cruz', city: 'Santa Cruz de Tenerife' },
                ],
              }),
          })
        }

        return Promise.reject(new Error(`Unexpected URL: ${url}`))
      }) as unknown as typeof fetch,
    )

    render(<EditProfesorPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('Sede base asignada')).toBeInTheDocument()
    })

    expect(screen.getByText('Sede Norte - La Orotava')).toBeInTheDocument()
    expect(screen.getByText('Autónomo')).toBeInTheDocument()
  })

  it('uses the generic teacher fallback instead of rendering the placeholder image', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.startsWith('/api/staff')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                data: [
                  {
                    id: 32,
                    firstName: 'Sheila',
                    lastName: 'Méndez',
                    position: 'Aux. en Clínicas Estéticas',
                    contractType: 'freelance',
                    employmentStatus: 'active',
                    assignedCampuses: [{ id: 2, name: 'Sede Norte', city: 'La Orotava' }],
                    photo: '/placeholder-avatar.svg',
                  },
                ],
              }),
          })
        }

        if (url.startsWith('/api/campuses')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ docs: [{ id: 2, name: 'Sede Norte', city: 'La Orotava' }] }),
          })
        }

        return Promise.reject(new Error(`Unexpected URL: ${url}`))
      }) as unknown as typeof fetch,
    )

    render(<EditProfesorPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('Imagen genérica de docente')).toBeInTheDocument()
    })

    expect(screen.queryByAltText('Foto del profesor')).not.toBeInTheDocument()
  })
})
