import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
      expect(screen.getByLabelText('Sede base')).toBeInTheDocument()
    })

    expect(screen.getByText('Sede Norte - La Orotava')).toBeInTheDocument()
    expect(screen.getByText('Sede Norte · Base')).toBeInTheDocument()
    expect(screen.getByText('Autónomo')).toBeInTheDocument()
    expect(
      screen.getByText('Esta sede determinará también la empresa y base de facturación del docente.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Foto del profesor')).not.toBeInTheDocument()
    expect(screen.queryByText(/ficha docente está incompleta/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Bloqueado:/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Visibles en la ficha pública/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/mostrarlas en la ficha pública/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Seleccionar imagen' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Añadir' })).toBeInTheDocument()
    expect(screen.getByText('Sedes asignadas')).toBeInTheDocument()
    expect(screen.getByLabelText('Añadir sede adicional')).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('shows an inline error when saving without email', async () => {
    const user = userEvent.setup()
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
      expect(screen.getByLabelText('Sede base')).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }))
    expect(await screen.findByText('Este campo es obligatorio')).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-invalid', 'true')
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
    expect(screen.queryByText('Foto del profesor')).not.toBeInTheDocument()
  })
})
