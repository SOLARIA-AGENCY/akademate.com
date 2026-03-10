import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardFooter } from '@payload-config/components/layout/DashboardFooter'

describe('DashboardFooter', () => {
  it('renders privacy link', () => {
    render(<DashboardFooter data-oid="sbzbm14" />)
    expect(screen.getByText('Privacidad')).toBeInTheDocument()
  })

  it('renders terms link', () => {
    render(<DashboardFooter data-oid="z1-l16:" />)
    expect(screen.getByText('Términos')).toBeInTheDocument()
  })

  it('renders cookies link', () => {
    render(<DashboardFooter data-oid="k_j1mlo" />)
    expect(screen.getByText('Cookies')).toBeInTheDocument()
  })

  it('renders copyright text', () => {
    render(<DashboardFooter data-oid="fsedf20" />)
    expect(screen.getByText(/2025 CEP Comunicación/)).toBeInTheDocument()
  })

  it('renders system status link', () => {
    render(<DashboardFooter data-oid="w59t.wf" />)
    expect(screen.getByText('Estado del Sistema')).toBeInTheDocument()
  })

  it('has correct link hrefs', () => {
    render(<DashboardFooter data-oid="th-q3a." />)

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
    render(<DashboardFooter data-oid="18x:10m" />)
    const footer = document.querySelector('footer')
    expect(footer).toBeInTheDocument()
  })

  it('has left-justified legal links (no mx-auto centering)', () => {
    render(<DashboardFooter data-oid="b43gmv7" />)
    const footer = document.querySelector('footer')
    const innerDiv = footer?.querySelector('div')
    // Should have px padding for left alignment, NOT container mx-auto
    expect(innerDiv?.className).toContain('px-4')
    expect(innerDiv?.className).not.toContain('mx-auto')
  })
})
