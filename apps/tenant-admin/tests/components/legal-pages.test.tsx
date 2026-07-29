import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import PrivacyPage from '../../app/(public)/p/legal/privacidad/page'
import TermsPage from '../../app/(public)/p/legal/terminos/page'
import CookiesPage from '../../app/(public)/p/legal/cookies/page'
import LegalCenterPage from '../../app/(public)/p/legal/page'

describe('CEP public legal center', () => {
  it('publishes one navigable legal center without presenting badges as certifications', () => {
    render(<LegalCenterPage />)

    expect(screen.getByRole('heading', { name: /centro legal y regulatorio/i })).toBeInTheDocument()
    const links = screen.getAllByRole('link')
    expect(links.some((link) => link.getAttribute('href') === '/p/legal/privacidad')).toBe(true)
    expect(links.some((link) => link.getAttribute('href') === '/p/legal/ia')).toBe(true)
    expect(screen.getAllByText(/no.*certificaciones/i).length).toBeGreaterThan(0)
  })

  it('identifies CEP as controller and Solaria as technology processor', () => {
    render(<PrivacyPage />)

    expect(screen.getByText('FORMACIÓN CEP CANARIAS S.L.')).toBeInTheDocument()
    expect(screen.getByText(/SOLARIA AGENCY OÜ/)).toBeInTheDocument()
    expect(screen.getAllByText('privacidad@cursostenerife.es').length).toBeGreaterThan(0)
    expect(screen.getByText(/capítulo V del RGPD/i)).toBeInTheDocument()
  })

  it('does not require an identity document by default and states the RGPD response window', () => {
    render(<PrivacyPage />)

    expect(screen.getByText(/no se exige con carácter general adjuntar una copia completa/i)).toBeInTheDocument()
    expect(screen.getByText(/en un mes, prorrogable/i)).toBeInTheDocument()
  })

  it('describes retention through documented criteria instead of indefinite generic storage', () => {
    render(<PrivacyPage />)

    expect(screen.getByText(/registro interno de actividades de tratamiento/i)).toBeInTheDocument()
    expect(screen.queryByText(/datos académicos:.*indefinidamente/i)).not.toBeInTheDocument()
  })

  it('keeps permissions and feature availability conditional on authorization and configuration', () => {
    render(<TermsPage />)

    expect(screen.getByText(/dependen del rol, sede, permisos y configuración/i)).toBeInTheDocument()
    expect(screen.getByText(/no implica acceso general a finanzas/i)).toBeInTheDocument()
    expect(screen.queryByText(/acceso total al sistema/i)).not.toBeInTheDocument()
  })

  it('does not invent generic cancellation percentages or waive consumer jurisdiction', () => {
    render(<TermsPage />)

    expect(screen.getByText(/no se establece aquí un porcentaje genérico de reembolso/i)).toBeInTheDocument()
    expect(screen.getByText(/sin imponer una renuncia anticipada a su fuero/i)).toBeInTheDocument()
    expect(screen.queryByText(/reembolso del 50%/i)).not.toBeInTheDocument()
  })

  it('documents only configurable analytics and marketing providers', () => {
    render(<CookiesPage />)

    expect(screen.getByText(/Google Analytics 4/i)).toBeInTheDocument()
    expect(screen.getByText(/Meta Pixel/i)).toBeInTheDocument()
    expect(screen.queryByText(/Plausible Analytics/i)).not.toBeInTheDocument()
  })

  it('exposes the working cookie preference control', () => {
    render(<CookiesPage />)

    expect(screen.getByRole('button', { name: /preferencias de cookies/i })).toBeInTheDocument()
  })
})
