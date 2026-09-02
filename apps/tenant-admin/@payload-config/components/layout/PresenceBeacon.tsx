'use client'

import { useEffect } from 'react'

export function PresenceBeacon() {
  useEffect(() => {
    let cancelled = false
    const ping = () => {
      if (cancelled || document.visibilityState === 'hidden') return
      void fetch('/api/internal/presence', { method: 'POST', cache: 'no-store' }).catch(() => undefined)
    }
    ping()
    const timer = window.setInterval(ping, 60_000)
    const onVisible = () => ping()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])
  return null
}
