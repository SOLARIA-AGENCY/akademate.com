import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  PUBLIC_CONSENT_STORAGE_KEY,
  PublicConsentManager,
  readPublicConsent,
} from '../../app/(public)/_components/PublicConsentManager'
import { DEFAULT_WEBSITE_CONSENT, WEBSITE_CONSENT_COOKIE } from '../../app/lib/website/consent'

const providerIds = {
  metaPixelId: 'meta-123',
  ga4MeasurementId: 'G-123',
  gtmContainerId: 'GTM-123',
  googleAdsEnabled: true,
  consent: DEFAULT_WEBSITE_CONSENT,
}

describe('PublicConsentManager', () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.cookie.split(';').forEach((part) => {
      const name = part.split('=')[0]?.trim()
      if (name) document.cookie = `${name}=; Max-Age=0; Path=/`
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('points the banner at the single /legal/cookies URL', async () => {
    render(<PublicConsentManager {...providerIds} />)
    expect((await screen.findByRole('link', { name: /política de cookies/i })).getAttribute('href')).toBe('/legal/cookies')
  })

  it('keeps non-essential providers disabled before consent', async () => {
    const { container } = render(<PublicConsentManager {...providerIds} />)

    expect(await screen.findByRole('region', { name: /preferencias de cookies/i })).toBeInTheDocument()
    expect(container.querySelector('#ak-meta-consented')).not.toBeInTheDocument()
    expect(container.querySelector('#ak-ga4-consented')).not.toBeInTheDocument()
    expect(container.querySelector('#ak-gtm-consented')).not.toBeInTheDocument()
  })

  it('hides Google and Meta categories when ads are off', async () => {
    render(
      <PublicConsentManager
        metaPixelId=""
        ga4MeasurementId="G-123"
        gtmContainerId=""
        googleAdsEnabled={false}
        consent={DEFAULT_WEBSITE_CONSENT}
      />,
    )

    fireEvent.click(await screen.findByRole('button', { name: /gestionar preferencias/i }))
    expect(await screen.findByRole('checkbox', { name: /analítica/i })).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: /publicidad google/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: /publicidad meta/i })).not.toBeInTheDocument()
  })

  it('persists an explicit rejection without loading providers', async () => {
    const { container } = render(<PublicConsentManager {...providerIds} />)

    fireEvent.click(await screen.findByRole('button', { name: /rechazar no esenciales/i }))

    await waitFor(() => expect(screen.queryByRole('region', { name: /preferencias de cookies/i })).not.toBeInTheDocument())
    expect(readPublicConsent()).toMatchObject({
      analytics: false,
      marketing_google: false,
      marketing_meta: false,
    })
    expect(document.cookie).toContain(WEBSITE_CONSENT_COOKIE)
    expect(decodeURIComponent(document.cookie)).toContain('"analytics":false')
    expect(container.querySelector('script[src*="googletagmanager"]')).not.toBeInTheDocument()
    expect(container.querySelector('#ak-meta-consented')).not.toBeInTheDocument()
  })

  it('stores granular preferences and does not treat accept as the only CTA', async () => {
    render(<PublicConsentManager {...providerIds} />)

    expect(screen.getByRole('button', { name: /rechazar no esenciales/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /gestionar preferencias/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /gestionar preferencias/i }))
    const analytics = await screen.findByRole('checkbox', { name: /analítica/i })
    fireEvent.click(analytics)
    fireEvent.click(screen.getByRole('button', { name: /guardar preferencias/i }))

    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(PUBLIC_CONSENT_STORAGE_KEY) ?? '{}')).toMatchObject({
        analytics: true,
        marketing_google: false,
        marketing_meta: false,
      })
    })
  })
})
