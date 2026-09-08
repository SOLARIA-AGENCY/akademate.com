// @vitest-environment node

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const webRoot = new URL('../', import.meta.url)

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return entry.name === 'node_modules' || entry.name === '.next' ? [] : sourceFiles(path)
    return /\.(?:ts|tsx)$/.test(entry.name) && !entry.name.includes('.test.') ? [path] : []
  })
}

const source = sourceFiles(webRoot.pathname).map((file) => readFileSync(file, 'utf8')).join('\n')

describe('public access and claim surface', () => {
  it('does not ship the development credential gateway', () => {
    expect(existsSync(new URL('../app/login/LoginGateway.tsx', import.meta.url))).toBe(false)
    expect(source).not.toMatch(/admin\s*\/\s*1234/i)
    expect(source).not.toContain('/api/auth/dev-login')
    expect(existsSync(new URL('../app/api/auth/[...all]/route.ts', import.meta.url))).toBe(false)
    expect(existsSync(new URL('../lib/auth.ts', import.meta.url))).toBe(false)
  })

  it('does not publish previously fabricated identity or traction claims', () => {
    expect(source).not.toContain('+34 912345678')
    expect(source).not.toContain('Calle Principal 123')
    expect(source).not.toMatch(/50\+\s+academias/i)
    expect(source).not.toContain('Alicia Romero')
  })

  it('does not execute advertising pixels or ungated analytics signatures', () => {
    expect(source).not.toMatch(/fbq\s*\(/)
    expect(source).not.toMatch(/gtag\s*\(/)
    expect(source).not.toMatch(/connect\.facebook\.net|static\.hotjar\.com/)
  })

  it('loads Google Tag Manager only from the consent-gated module', () => {
    const tracker = readFileSync(join(webRoot.pathname, 'components/tracking/ConsentAwareAnalytics.tsx'), 'utf8')
    const config = readFileSync(join(webRoot.pathname, 'lib/tracking.ts'), 'utf8')
    const otherSource = sourceFiles(webRoot.pathname)
      .filter((file) => !file.endsWith('ConsentAwareAnalytics.tsx') && !file.endsWith('tracking.ts'))
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n')

    expect(config).toContain('GTM-TKSVM638')
    expect(tracker).toContain('googletagmanager.com/gtm.js')
    expect(tracker).toMatch(/hasAnalyticsConsent/)
    expect(otherSource).not.toMatch(/googletagmanager\.com|google-analytics\.com/)
  })

  it('keeps dataLayer writes inside consent-aware tracking helpers', () => {
    const tracking = readFileSync(join(webRoot.pathname, 'lib/tracking.ts'), 'utf8')
    const contactForm = readFileSync(join(webRoot.pathname, 'components/forms/contact-form.tsx'), 'utf8')
    const otherSource = sourceFiles(webRoot.pathname)
      .filter(
        (file) =>
          !file.endsWith('ConsentAwareAnalytics.tsx') &&
          !file.endsWith('tracking.ts') &&
          !file.endsWith('AnalyticsClickCapture.tsx') &&
          !file.endsWith('contact-form.tsx')
      )
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n')

    expect(tracking).toMatch(/hasAnalyticsConsent\(readStoredCookieConsent\(\)\)/)
    expect(contactForm).toContain("event: 'generate_lead'")
    expect(contactForm).toContain('trackAnalyticsEvent')
    expect(otherSource).not.toMatch(/dataLayer\.push/)
  })
})
