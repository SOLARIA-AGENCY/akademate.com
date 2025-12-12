import { render, screen, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { LogoutButton } from '@payload-config/components/ui/LogoutButton'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

describe('LogoutButton Component', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    localStorage.clear()
  })

  it('renders logout button correctly', () => {
    render(<LogoutButton />)
    
    expect(screen.getByText('Cerrar Sesión')).toBeInTheDocument()
  })

  it('clears localStorage and redirects on click', () => {
    localStorage.setItem('cep_auth_token', 'test_token')
    localStorage.setItem('cep_user', '{}')
    
    render(<LogoutButton />)
    
    const logoutButton = screen.getByText('Cerrar Sesión')
    fireEvent.click(logoutButton)
    
    expect(localStorage.getItem('cep_auth_token')).toBeNull()
    expect(localStorage.getItem('cep_user')).toBeNull()
    expect(mockPush).toHaveBeenCalledWith('/auth/login')
  })

  it('has logout icon', () => {
    render(<LogoutButton />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('w-full', 'justify-start')
  })
})
