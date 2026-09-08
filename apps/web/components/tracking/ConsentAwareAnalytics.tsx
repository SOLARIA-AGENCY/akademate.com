'use client'

import { useEffect, useState } from 'react'
import {
  CONSENT_CHANGE_EVENT,
  GTM_CONTAINER_ID,
  hasAnalyticsConsent,
  readStoredCookieConsent,
} from '@/lib/tracking'

const grantedAnalyticsConsent = {
  analytics_storage: 'granted',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  functionality_storage: 'granted',
  security_storage: 'granted',
} as const

function loadGtm(): void {
  if (typeof window === 'undefined') return
  if (document.getElementById('akademate-gtm')) return

  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push(grantedAnalyticsConsent)
  window.dataLayer.push({ event: 'akademate_consent_granted' })
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })

  const script = document.createElement('script')
  script.id = 'akademate-gtm'
  script.async = true
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_CONTAINER_ID}`
  document.head.appendChild(script)
}

export function ConsentAwareAnalytics() {
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    const sync = () => setAllowed(hasAnalyticsConsent(readStoredCookieConsent()))
    sync()
    window.addEventListener(CONSENT_CHANGE_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(CONSENT_CHANGE_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  useEffect(() => {
    if (!allowed) return
    loadGtm()
  }, [allowed])

  return null
}
