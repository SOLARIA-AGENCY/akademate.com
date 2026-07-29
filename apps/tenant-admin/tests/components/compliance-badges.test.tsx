import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ComplianceBadges } from '../../app/components/legal/ComplianceBadges'
import AiTransparencyPage from '../../app/(public)/p/legal/ia/page'

describe('CEP compliance public surfaces', () => {
  it('renders informative badges without claiming certification', () => {
    render(<ComplianceBadges />)

    expect(screen.getByRole('link', { name: 'Privacidad y RGPD' })).toHaveAttribute(
      'href',
      '/p/legal/privacidad',
    )
    expect(screen.getByRole('link', { name: 'Transparencia y AI Act' })).toHaveAttribute(
      'href',
      '/p/legal/ia',
    )
    expect(screen.getByText('RGPD')).toBeInTheDocument()
    expect(screen.getByText('ACT')).toBeInTheDocument()
    expect(screen.getByText(/no constituye certificación/i)).toBeInTheDocument()
    expect(screen.queryByText(/certificad[oa]/i)).not.toBeInTheDocument()
  })

  it('publishes the AI transparency boundary and privacy contact', () => {
    render(<AiTransparencyPage />)

    expect(screen.getByRole('heading', { name: /transparencia y uso responsable de ia/i })).toBeInTheDocument()
    expect(screen.getByText(/funciones de alto riesgo desactivadas/i)).toBeInTheDocument()
    expect(screen.getByText(/alfabetización en ia/i)).toBeInTheDocument()
    expect(screen.getByText(/no etiqueta contenido como generado por ia/i)).toBeInTheDocument()
    expect(screen.getByText('privacidad@cursostenerife.es')).toBeInTheDocument()
  })
})
