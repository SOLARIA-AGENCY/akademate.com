'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const CONSENT_KEY = 'cep_cookie_consent_v1'

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
    <div className="fixed bottom-0 left-0 right-0 z-[60] border-t border-slate-200 bg-white shadow-[0_-12px_28px_rgba(0,0,0,0.16)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <p className="text-sm leading-6 text-slate-700">
          <strong className="text-slate-900">Utilizamos cookies para mejorar tu experiencia.</strong> Usamos cookies esenciales para el funcionamiento del sitio y cookies de marketing para personalizar contenido.{' '}
          <Link href="/legal/cookies" className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4">
            Ver política de cookies
          </Link>
          .
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            onClick={() => saveConsent('essential')}
          >
            Solo esenciales
          </button>
          <button
            type="button"
            className="rounded-full bg-[#f2014b] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#d0013f]"
            onClick={() => saveConsent('all')}
          >
            Aceptar todas
          </button>
        </div>
      </div>
    </div>
  )
}
