import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ComplianceBadges } from '@/components/legal/ComplianceBadges'
import { legalCompany, legalLinks } from './legal-config'

describe('legal configuration', () => {
  it('keeps required company details as explicit verification placeholders', () => {
    expect(legalCompany.name).toBe('SOLARIA AGENCY OÜ')
    expect(legalCompany.registryCode).toBe('[ESTONIAN REGISTRY CODE]')
    expect(legalCompany.vatId).toBe('[ESTONIAN VAT ID]')
    expect(legalCompany.registeredOffice).toBe('[REGISTERED OFFICE — ESTONIA]')
    expect(legalCompany.operatingAddress).toBe('[OPERATING ADDRESS — MALMÖ, SWEDEN]')
    expect(legalCompany.privacyEmail).toBe('[PRIVACY EMAIL — PENDING VERIFICATION]')
  })

  it('exposes each public legal route from one central registry', () => {
    expect(legalLinks.map((link) => link.href)).toEqual([
      '/legal/privacidad',
      '/legal/terminos',
      '/legal/cookies',
      '/legal/subencargados',
      '/legal/ia',
    ])
  })

  it('renders informational compliance links without presenting certification', () => {
    const markup = renderToStaticMarkup(createElement(ComplianceBadges))

    expect(markup).toContain('href="/legal/privacidad"')
    expect(markup).toContain('href="/legal/ia"')
    expect(markup).toContain('Privacidad y RGPD')
    expect(markup).toContain('Transparencia de IA')
    expect(markup).toContain('Información regulatoria; no constituye certificación')
  })
})
