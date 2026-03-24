'use client'

import { useEffect } from 'react'

interface MetaViewContentProps {
  contentName: string
  contentCategory: string
  contentId: string
  sourceUrl: string
}

export default function MetaViewContent({
  contentName,
  contentCategory,
  contentId,
  sourceUrl,
}: MetaViewContentProps) {
  useEffect(() => {
    const eventId = crypto.randomUUID()

    // Fire browser Pixel
    const w = window as any
    if (typeof w.fbq === 'function') {
      w.fbq(
        'track',
        'ViewContent',
        {
          content_name: contentName,
          content_category: contentCategory,
          content_ids: [contentId],
          content_type: 'product',
        },
        { eventID: eventId }
      )
    }

    // Fire server CAPI
    fetch('/api/meta/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: 'ViewContent',
        event_id: eventId,
        source_url: sourceUrl,
        user_data: {},
        custom_data: {
          content_name: contentName,
          content_category: contentCategory,
          content_ids: [contentId],
          content_type: 'product',
        },
      }),
    }).catch(() => {})
  }, [contentName, contentCategory, contentId, sourceUrl])

  return null
}
