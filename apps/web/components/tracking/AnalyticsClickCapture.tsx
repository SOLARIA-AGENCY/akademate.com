'use client'

import { useEffect } from 'react'
import { trackAnalyticsEvent } from '@/lib/tracking'

export function AnalyticsClickCapture() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = (event.target as HTMLElement | null)?.closest('[data-analytics-event]')
      if (!(target instanceof HTMLElement)) return
      const name = target.dataset.analyticsEvent
      if (!name) return
      trackAnalyticsEvent({
        event: name,
        content_type: name === 'cta_demo' ? 'demo' : name,
      })
      if (name === 'cta_demo') {
        trackAnalyticsEvent({
          event: 'select_content',
          content_type: 'demo',
        })
      }
    }

    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  return null
}
