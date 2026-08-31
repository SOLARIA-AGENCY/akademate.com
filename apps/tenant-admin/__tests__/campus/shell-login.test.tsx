import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CampusShell } from '@/app/campus/components/CampusShell'

vi.mock('@/app/campus/providers/SessionProvider', () => ({
  useSession: () => ({
    student: null,
    enrollments: [],
    isLoading: false,
    isAuthenticated: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    refreshSession: vi.fn(),
  }),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/campus/login',
  useRouter: () => ({ push: vi.fn() }),
}))

describe('Campus shell on login', () => {
  it('does not render the student rail', () => {
    render(
      <CampusShell>
        <p>Login form</p>
      </CampusShell>
    )
    expect(screen.getByText('Login form')).toBeInTheDocument()
    expect(screen.queryByText('Mi panel')).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/buscar temarios/i)).not.toBeInTheDocument()
  })
})
