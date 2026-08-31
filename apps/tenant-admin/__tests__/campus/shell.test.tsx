import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CampusSidebar } from '@/app/campus/components/CampusSidebar'
import { CampusTopbar } from '@/app/campus/components/CampusTopbar'

vi.mock('@/app/campus/providers/SessionProvider', () => ({
  useSession: () => ({
    student: {
      id: '1',
      email: 'a@test.com',
      firstName: 'Ana',
      lastName: 'Lopez',
      fullName: 'Ana Lopez',
      tenantId: 1,
    },
    enrollments: [],
    isLoading: false,
    isAuthenticated: true,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    refreshSession: vi.fn(),
  }),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/campus',
  useRouter: () => ({ push: vi.fn() }),
}))

describe('Campus shell', () => {
  it('renders student rail labels', () => {
    render(<CampusSidebar />)
    expect(screen.getByText('Mi panel')).toBeInTheDocument()
    expect(screen.getByText('Mis cursos')).toBeInTheDocument()
    expect(screen.getByText('Horarios y clases')).toBeInTheDocument()
    expect(screen.getByText('Ayuda y tutorías')).toBeInTheDocument()
    expect(screen.getByText('Contactar tutor')).toBeInTheDocument()
  })

  it('shows the campus search shortcut in the topbar', () => {
    render(<CampusTopbar />)
    expect(screen.getByPlaceholderText(/buscar temarios, clases o recursos/i)).toBeInTheDocument()
  })
})
