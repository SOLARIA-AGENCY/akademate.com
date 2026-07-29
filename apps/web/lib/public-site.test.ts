// @vitest-environment node

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  getPublicLegalIdentity,
  LEGAL_PLACEHOLDER,
  publicLegalRoutes,
  publicNavigation,
  resolveTrackerConfiguration,
} from './public-site'
import { validatePublicLeadInput, validateWaitlistInput } from './public-forms'

const webRoot = process.cwd()

function routeFile(href: string): string {
  const pathname = href.split('#')[0] || '/'
  return pathname === '/' ? join(webRoot, 'app/page.tsx') : join(webRoot, `app${pathname}/page.tsx`)
}

function readSourceTree(directory: string): string {
  return readdirSync(directory).map((entry) => {
    const path = join(directory, entry)
    return statSync(path).isDirectory() ? readSourceTree(path) : /\.(ts|tsx|js|jsx)$/.test(entry) ? readFileSync(path, 'utf8') : ''
  }).join('\n')
}

describe('public legal identity', () => {
  it('uses SOLARIA AGENCY OÜ without inheriting CEP identity', () => {
    const identity = getPublicLegalIdentity({})
    expect(identity.legalName).toBe('SOLARIA AGENCY OÜ')
    expect(JSON.stringify(identity)).not.toMatch(/CEP|cepcomunicacion/i)
  })

  it('renders explicit placeholders when documentary fields are absent or blank', () => {
    const identity = getPublicLegalIdentity({ NEXT_PUBLIC_LEGAL_EMAIL: '   ' })
    expect(identity.registryCode).toBe(LEGAL_PLACEHOLDER)
    expect(identity.taxId).toBe(LEGAL_PLACEHOLDER)
    expect(identity.registeredAddress).toBe(LEGAL_PLACEHOLDER)
    expect(identity.legalEmail).toBe(LEGAL_PLACEHOLDER)
  })

  it('accepts explicitly configured documentary values', () => {
    expect(getPublicLegalIdentity({ NEXT_PUBLIC_LEGAL_TAX_ID: 'EE-VERIFIED' }).taxId).toBe('EE-VERIFIED')
  })
})
describe('fail-closed tracker configuration', () => {
  it('requires no banner when no optional trackers exist', () => {
    expect(resolveTrackerConfiguration()).toEqual({ active: [], blocked: [], requiresConsent: false })
  })

  it('does not activate a tracker from environment configuration alone', () => {
    expect(resolveTrackerConfiguration('google-analytics, meta-pixel')).toEqual({
      active: [],
      blocked: ['google-analytics', 'meta-pixel'],
      requiresConsent: false,
    })
  })

  it('normalizes malformed and duplicate requests without widening access', () => {
    expect(resolveTrackerConfiguration(' , META-PIXEL,meta-pixel, unknown ')).toEqual({
      active: [], blocked: ['meta-pixel', 'unknown'], requiresConsent: false,
    })
  })
})

describe('public forms fail closed', () => {
  const validLead = { email: 'persona@example.com', gdpr_consent: true, privacy_policy_accepted: true }

  it('rejects missing consent and invalid email', () => {
    expect(validatePublicLeadInput({ email: 'persona@example.com' }).ok).toBe(false)
    expect(validatePublicLeadInput({ ...validLead, email: 'not-an-email' }).ok).toBe(false)
    expect(validateWaitlistInput({ email: 'persona@example.com' }).ok).toBe(false)
  })

  it('rejects honeypot abuse and oversized content', () => {
    expect(validatePublicLeadInput({ ...validLead, website: 'spam.example' }).ok).toBe(false)
    expect(validatePublicLeadInput({ ...validLead, message: 'x'.repeat(5001) }).ok).toBe(false)
  })

  it('accepts a bounded request with explicit consent', () => {
    expect(validatePublicLeadInput(validLead)).toEqual({ ok: true })
    expect(validateWaitlistInput({ email: 'persona@example.com', privacy_policy_accepted: true })).toEqual({ ok: true })
  })
})

describe('public route and claim guardrails', () => {
  it('backs every public navigation and legal link with a route', () => {
    for (const route of [...publicNavigation, ...publicLegalRoutes]) {
      expect(() => readFileSync(routeFile(route.href), 'utf8'), route.href).not.toThrow()
    }
  })

  it('keeps the regulatory badge explicit and non-certifying', () => {
    const source = readFileSync(join(webRoot, 'components/legal/regulatory-notice.tsx'), 'utf8')
    expect(source).toContain('Información regulatoria · No es una certificación')
    expect(source).toContain('aria-label="Información regulatoria; este distintivo no es una certificación"')
  })

  it('ships no optional tracker loader or invented adoption claim', () => {
    const source = `${readSourceTree(join(webRoot, 'app'))}\n${readSourceTree(join(webRoot, 'components'))}`
    expect(source).not.toMatch(/googletagmanager|fbq\s*\(|posthog\.init|clarity\s*\(/i)
    expect(source).not.toMatch(/4\.9\/5|120\+ reseñas|50\+ academias|MCP nativo|facturación automática/i)
  })
})
