import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  PUBLIC_CONSENT_STORAGE_KEY,
  PublicConsentManager,
  readPublicConsent,
} from '../../app/(public)/_components/PublicConsentManager'

const providerIds = {
  metaPixelId: 'meta-123',
  ga4MeasurementId: 'G-123',
  gtmContainerId: 'GTM-123',
}

describe('PublicConsentManager', () => {
  it('keeps non-essential providers disabled before consent', async () => {
    const { container } = render(<PublicConsentManager {...providerIds} />)

    expect(await screen.findByRole('region', { name: /preferencias de cookies/i })).toBeInTheDocument()
    expect(container.querySelector('#cep-meta-consented')).not.toBeInTheDocument()
    expect(container.querySelector('#cep-ga4-consented')).not.toBeInTheDocument()
    expect(container.querySelector('#cep-gtm-consented')).not.toBeInTheDocument()
  })

  it('persists an explicit rejection without loading providers', async () => {
    const { container } = render(<PublicConsentManager {...providerIds} />)

    fireEvent.click(await screen.findByRole('button', { name: /rechazar no esenciales/i }))

    await waitFor(() => expect(screen.queryByRole('region', { name: /preferencias de cookies/i })).not.toBeInTheDocument())
    expect(readPublicConsent()).toMatchObject({ analytics: false, marketing: false })
    expect(container.querySelector('script[src*="googletagmanager"]')).not.toBeInTheDocument()
    expect(container.querySelector('#cep-meta-consented')).not.toBeInTheDocument()
  })

  it('stores granular preferences', async () => {
    render(<PublicConsentManager {...providerIds} />)

    const analytics = await screen.findByRole('checkbox', { name: /analítica/i })
    fireEvent.click(analytics)
    fireEvent.click(screen.getByRole('button', { name: /guardar preferencias/i }))

    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(PUBLIC_CONSENT_STORAGE_KEY) ?? '{}')).toMatchObject({
        analytics: true,
        marketing: false,
      })
    })
  })
})
