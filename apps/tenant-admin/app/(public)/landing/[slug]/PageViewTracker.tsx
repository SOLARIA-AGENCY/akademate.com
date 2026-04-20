'use client'

import { useEffect } from 'react'

interface PageViewTrackerProps {
  path: string
  slug: string
}

export function PageViewTracker({ path, slug }: PageViewTrackerProps) {
  useEffect(() => {
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null

    // Fire and forget - no need to await
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path,
        slug,
        referrer: document.referrer || null,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        utm_source: urlParams?.get('utm_source') || undefined,
        utm_medium: urlParams?.get('utm_medium') || undefined,
        utm_campaign: urlParams?.get('utm_campaign') || undefined,
        meta_campaign_id:
          urlParams?.get('meta_campaign_id') || urlParams?.get('campaign_id') || urlParams?.get('utm_id') || undefined,
      }),
    }).catch(() => {
      // Silently ignore tracking failures
    })
  }, [path, slug])

  return null
}
