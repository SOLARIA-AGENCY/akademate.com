// @vitest-environment node

import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ComplianceBadges } from '@/components/legal/ComplianceBadges'
import {
  formatLegalField,
  getLegalContent,
  getLegalLinks,
  legalCompany,
  legalDraftNotice,
  legalLinks,
  trackingPolicy,
} from '@/lib/legal-config'

describe('central legal contract', () => {
  it('keeps SOLARIA identity centralized and unresolved fields explicit', () => {
    expect(legalCompany.name).toBe('SOLARIA AGENCY OÜ')
    for (const field of [legalCompany.registryCode, legalCompany.vatId, legalCompany.registeredOffice, legalCompany.operatingAddress, legalCompany.privacyContact]) {
      expect(field.value).toBeNull()
      expect(formatLegalField(field)).toMatch(/pending/i)
    }
    expect(JSON.stringify(legalCompany)).not.toMatch(/FORMACI[ÓO]N CEP CANARIAS|cursostenerife|Plaza José Antonio/i)
  })

  it('exposes all required legal routes without legacy paths', () => {
    expect(legalLinks.map((link) => link.href)).toEqual([
      '/legal/privacidad', '/legal/terminos', '/legal/cookies', '/legal/subencargados', '/legal/ia',
    ])
  })

  it('renders visual privacy and responsible AI links without certification claims', () => {
    const markup = renderToStaticMarkup(React.createElement(ComplianceBadges))
    expect(markup).toContain('Privacy and GDPR')
    expect(markup).toContain('Responsible AI')
    expect(markup).toContain('%2Flogos%2Fgdpr-logo.png')
    expect(markup).toContain('%2Flogos%2Feu-ai-act.png')
    expect(markup).not.toMatch(/certified|certification|official seal|approved by/i)
    expect(legalDraftNotice).toContain('professional review')
  })

  it('documents why no consent manager is installed', () => {
    expect(trackingPolicy.currentStatus).toBe('no-non-essential-trackers')
    expect(trackingPolicy.activationGate).toMatch(/granular fail-closed consent/i)
  })

  it('keeps the Spanish trust contract aligned without resolving placeholder identity facts', () => {
    const english = getLegalContent('en')
    const spanish = getLegalContent('es')

    expect(getLegalLinks('es').map((link) => link.href)).toEqual(legalLinks.map((link) => link.href))
    expect(spanish.draftNotice).toMatch(/revisión profesional/i)
    expect(spanish.trackingPolicy.currentStatus).toBe(english.trackingPolicy.currentStatus)

    for (const field of [
      spanish.company.registryCode,
      spanish.company.vatId,
      spanish.company.registeredOffice,
      spanish.company.operatingAddress,
      spanish.company.privacyContact,
    ]) {
      expect(field.value).toBeNull()
      expect(formatLegalField(field)).toMatch(/pendiente/i)
    }

    expect(JSON.stringify(spanish.company)).not.toMatch(
      /FORMACI[ÓO]N CEP CANARIAS|cursostenerife|Plaza José Antonio/i
    )
  })
})
