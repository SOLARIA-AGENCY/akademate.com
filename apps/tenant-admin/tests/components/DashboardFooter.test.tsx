import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardFooter } from '@payload-config/components/layout/DashboardFooter'

describe('DashboardFooter', () => {
  it('renders privacy link', () => {
    render(<DashboardFooter />)
    expect(screen.getByText('Privacidad')).toBeInTheDocument()
  })

  it('renders terms link', () => {
    render(<DashboardFooter />)
    expect(screen.getByText('Términos')).toBeInTheDocument()
  })

  it('renders cookies link', () => {
    render(<DashboardFooter />)
    expect(screen.getByText('Cookies')).toBeInTheDocument()
  })

  it('renders copyright text', () => {
    render(<DashboardFooter />)
    expect(screen.getByText(/2025 CEP Comunicación/)).toBeInTheDocument()
  })

  it('renders system status link', () => {
    render(<DashboardFooter />)
    expect(screen.getByText('Estado del Sistema')).toBeInTheDocument()
  })

  it('has correct link hrefs', () => {
    render(<DashboardFooter />)

    const privacyLink = screen.getByRole('link', { name: /Privacidad/i })
    expect(privacyLink).toHaveAttribute('href', '/legal/privacidad')

    const termsLink = screen.getByRole('link', { name: /Términos/i })
    expect(termsLink).toHaveAttribute('href', '/legal/terminos')

    const cookiesLink = screen.getByRole('link', { name: /Cookies/i })
    expect(cookiesLink).toHaveAttribute('href', '/legal/cookies')

    const statusLink = screen.getByRole('link', { name: /Estado del Sistema/i })
    expect(statusLink).toHaveAttribute('href', '/estado')
  })

  it('renders as a footer element', () => {
    render(<DashboardFooter />)
    const footer = document.querySelector('footer')
    expect(footer).toBeInTheDocument()
  })

  it('has left-justified legal links (no mx-auto centering)', () => {
    render(<DashboardFooter />)
    const footer = document.querySelector('footer')
    const innerDiv = footer?.querySelector('div')
    // Should have px padding for left alignment, NOT container mx-auto
    expect(innerDiv?.className).toContain('px-4')
    expect(innerDiv?.className).not.toContain('mx-auto')
  })
})
