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
  shouldShowLegalDraftBanner,
  trackingPolicy,
} from '@/lib/legal-config'

describe('central legal contract', () => {
  it('keeps SOLARIA identity centralized and unresolved fields explicit', () => {
    expect(legalCompany.name).toBe('SOLARIA AGENCY OÜ')
    for (const field of [
      legalCompany.registryCode,
      legalCompany.vatId,
      legalCompany.registeredOffice,
      legalCompany.operatingAddress,
      legalCompany.privacyContact,
    ]) {
      expect(field.value).toBeNull()
      expect(formatLegalField(field)).toMatch(/pending/i)
    }
    expect(JSON.stringify(legalCompany)).not.toMatch(
      /FORMACI[ÓO]N CEP CANARIAS|cursostenerife|Plaza José Antonio/i
    )
  })

  it('exposes all required legal routes without legacy paths', () => {
    expect(legalLinks.map((link) => link.href)).toEqual([
      '/legal/aviso-legal',
      '/legal/privacidad',
      '/legal/terminos',
      '/legal/cookies',
      '/legal/subencargados',
      '/legal/ia',
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

    expect(getLegalLinks('es').map((link) => link.href)).toEqual(
      legalLinks.map((link) => link.href)
    )
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

  it('hides the amber draft banner only when identity env is complete or explicitly signed off', () => {
    const keys = [
      'AKADEMATE_LEGAL_REGISTRY_CODE',
      'AKADEMATE_LEGAL_VAT_ID',
      'AKADEMATE_LEGAL_REGISTERED_OFFICE',
      'AKADEMATE_LEGAL_OPERATING_ADDRESS',
      'AKADEMATE_LEGAL_PRIVACY_CONTACT',
      'AKADEMATE_LEGAL_HIDE_DRAFT_BANNER',
    ] as const
    const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]))
    const restore = () => {
      for (const key of keys) {
        if (previous[key] === undefined) delete process.env[key]
        else process.env[key] = previous[key]
      }
    }

    try {
      for (const key of keys) delete process.env[key]
      expect(shouldShowLegalDraftBanner('en')).toBe(true)
      expect(shouldShowLegalDraftBanner('es')).toBe(true)

      process.env.AKADEMATE_LEGAL_REGISTRY_CODE = '12345678'
      expect(shouldShowLegalDraftBanner()).toBe(true)

      process.env.AKADEMATE_LEGAL_VAT_ID = 'EE12345678'
      process.env.AKADEMATE_LEGAL_REGISTERED_OFFICE = 'Tallinn'
      process.env.AKADEMATE_LEGAL_OPERATING_ADDRESS = 'Malmö'
      process.env.AKADEMATE_LEGAL_PRIVACY_CONTACT = 'privacy@akademate.com'
      expect(shouldShowLegalDraftBanner()).toBe(false)

      for (const key of keys) delete process.env[key]
      process.env.AKADEMATE_LEGAL_HIDE_DRAFT_BANNER = 'true'
      expect(shouldShowLegalDraftBanner()).toBe(false)
    } finally {
      restore()
    }
  })
})
