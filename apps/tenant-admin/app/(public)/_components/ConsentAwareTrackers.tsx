'use client'

import { useEffect } from 'react'

export const CONSENT_STORAGE_KEY = 'cep_cookie_consent_v1'
export const CONSENT_EVENT = 'cep-consent-updated'

type ConsentAwareTrackersProps = {
  gtmContainerId?: string
  metaPixelId?: string
  ga4MeasurementId?: string
  umamiWebsiteId?: string
  isCepTenant?: boolean
}

function hasMarketingConsent(): boolean {
  try {
    return window.localStorage.getItem(CONSENT_STORAGE_KEY) === 'all'
  } catch {
    return false
  }
}

function loadScript(src: string, attrs: Record<string, string> = {}): void {
  if (document.querySelector(`script[src="${src}"]`)) return
  const script = document.createElement('script')
  script.src = src
  script.async = true
  for (const [key, value] of Object.entries(attrs)) script.setAttribute(key, value)
  document.head.appendChild(script)
}

export function ConsentAwareTrackers({
  gtmContainerId,
  metaPixelId,
  ga4MeasurementId,
  umamiWebsiteId,
  isCepTenant,
}: ConsentAwareTrackersProps) {
  useEffect(() => {
    const loadMarketing = () => {
      if (!hasMarketingConsent()) return

      if (gtmContainerId) {
        window.dataLayer = window.dataLayer || []
        window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })
        loadScript(`https://www.googletagmanager.com/gtm.js?id=${gtmContainerId}`)
      }

      if (metaPixelId) {
        const eventId = crypto.randomUUID()
        window.fbq =
          window.fbq ||
          function fbq(...args: unknown[]) {
            ;(window.fbq as { queue: unknown[] }).queue.push(args)
          }
        window.fbq.queue = window.fbq.queue || []
        window.fbq.loaded = true
        window.fbq.version = '2.0'
        loadScript('https://connect.facebook.net/en_US/fbevents.js')
        window.fbq('init', metaPixelId)
        window.fbq('track', 'PageView', {}, { eventID: eventId })
      }

      if (ga4MeasurementId) {
        loadScript(`https://www.googletagmanager.com/gtag/js?id=${ga4MeasurementId}`)
        window.dataLayer = window.dataLayer || []
        window.gtag = function gtag(...args: unknown[]) {
          window.dataLayer.push(args)
        }
        window.gtag('js', new Date())
        window.gtag('config', ga4MeasurementId, { anonymize_ip: true })
      }

      if (isCepTenant && umamiWebsiteId) {
        loadScript('https://cepformacion-umami.akademate.com/script.js', {
          'data-website-id': umamiWebsiteId,
          'data-auto-track': 'true',
        })
      }
    }

    loadMarketing()
    window.addEventListener(CONSENT_EVENT, loadMarketing)
    return () => window.removeEventListener(CONSENT_EVENT, loadMarketing)
  }, [gtmContainerId, metaPixelId, ga4MeasurementId, umamiWebsiteId, isCepTenant])

  return null
}

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag?: (...args: unknown[]) => void
    fbq?: ((...args: unknown[]) => void) & { queue: unknown[]; loaded?: boolean; version?: string }
  }
}
