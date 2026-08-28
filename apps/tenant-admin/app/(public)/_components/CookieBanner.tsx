'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export const CONSENT_KEY = 'akademate_cookie_consent_v1'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const consent = window.localStorage.getItem(CONSENT_KEY)
      setVisible(!consent)
    } catch {
      setVisible(true)
    }
  }, [])

  const saveConsent = (mode: 'all' | 'essential') => {
    try {
      window.localStorage.setItem(CONSENT_KEY, mode)
    } catch {
      // Ignore storage errors and close the banner for this session.
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      data-testid="cookie-banner"
      className="fixed bottom-0 left-0 right-0 z-[60] overflow-x-hidden border-t border-slate-200 bg-white"
    >
      <div className="mx-auto flex h-10 max-w-7xl flex-nowrap items-center gap-3 overflow-x-hidden px-4 py-2 text-xs sm:px-6 lg:px-8">
        <p className="min-w-0 flex-1 truncate whitespace-nowrap text-xs text-slate-700">
          Usamos cookies.{' '}
          <Link href="/legal/cookies" className="font-semibold text-slate-900 underline underline-offset-2">
            Política
          </Link>
        </p>
        <div className="flex flex-nowrap items-center gap-2 shrink-0">
          <button
            type="button"
            className="whitespace-nowrap rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700"
            onClick={() => saveConsent('essential')}
          >
            Esenciales
          </button>
          <button
            type="button"
            className="brand-btn whitespace-nowrap rounded px-2 py-1 text-xs font-semibold"
            onClick={() => saveConsent('all')}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}
