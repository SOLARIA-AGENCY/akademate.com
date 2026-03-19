'use client'

import { useEffect } from 'react'

interface PageViewTrackerProps {
  path: string
  slug: string
}

export function PageViewTracker({ path, slug }: PageViewTrackerProps) {
  useEffect(() => {
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
      }),
    }).catch(() => {
      // Silently ignore tracking failures
    })
  }, [path, slug])

  return null
}
