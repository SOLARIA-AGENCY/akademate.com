'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

function safeRedirect(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/dashboard'
  if (value.startsWith('/auth/session-exchange')) return '/dashboard'
  return value
}

export default function SessionExchangePage() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const redirect = safeRedirect(searchParams.get('redirect'))
    let cancelled = false

    const exchange = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        })
        if (!cancelled && response.ok) {
          window.location.replace(redirect)
          return
        }
      } catch {
        // Fall through to an explicit login when exchange is unavailable.
      }

      if (!cancelled) {
        const login = new URL('/auth/login', window.location.origin)
        login.searchParams.set('redirect', redirect)
        login.searchParams.set('error', 'session_reauth_required')
        window.location.replace(`${login.pathname}${login.search}`)
      }
    }

    void exchange()
    return () => {
      cancelled = true
    }
  }, [searchParams])

  return <main aria-busy="true" className="min-h-dvh" />
}
