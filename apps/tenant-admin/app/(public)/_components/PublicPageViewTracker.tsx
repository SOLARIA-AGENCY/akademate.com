'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

function readParam(searchParams: URLSearchParams | null, key: string): string | undefined {
  const value = searchParams?.get(key) || ''
  return value.trim().length > 0 ? value : undefined
}

function readMetaCampaignId(searchParams: URLSearchParams | null): string | undefined {
  return (
    readParam(searchParams, 'meta_campaign_id') ||
    readParam(searchParams, 'campaign_id') ||
    readParam(searchParams, 'utm_id')
  )
}

export function PublicPageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchQuery = searchParams?.toString() || ''

  useEffect(() => {
    const eventId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `pv-${Date.now()}-${Math.random().toString(36).slice(2)}`

    const pathWithQuery = searchQuery ? `${pathname}?${searchQuery}` : pathname

    void fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: pathWithQuery,
        referrer: document.referrer || null,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        event_id: eventId,
        utm_source: readParam(searchParams, 'utm_source'),
        utm_medium: readParam(searchParams, 'utm_medium'),
        utm_campaign: readParam(searchParams, 'utm_campaign'),
        meta_campaign_id: readMetaCampaignId(searchParams),
      }),
    }).catch(() => {})
  }, [pathname, searchParams, searchQuery])

  return null
}
