'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useLocale } from '@/components/i18n/locale-provider'
import { localizedHref } from '@/lib/i18n/routing'
import {
  CONSENT_VERSION,
  readStoredCookieConsent,
  writeStoredCookieConsent,
} from '@/lib/tracking'

const copy = {
  en: {
    region: 'Cookie preferences',
    body: 'Necessary cookies keep the site working. Analytics cookies load Google Tag Manager and Google Analytics 4 only after you accept. We do not use advertising cookies.',
    necessary: 'Necessary only',
    accept: 'Accept analytics',
    policy: 'Cookie policy',
  },
  es: {
    region: 'Preferencias de cookies',
    body: 'Las cookies necesarias hacen funcionar el sitio. Las de analítica cargan Google Tag Manager y Google Analytics 4 solo si las aceptas. No usamos cookies publicitarias.',
    necessary: 'Solo necesarias',
    accept: 'Aceptar analítica',
    policy: 'Política de cookies',
  },
} as const

export function CookieConsentBanner() {
  const locale = useLocale()
  const text = copy[locale]
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(readStoredCookieConsent() === null)
  }, [])

  if (!visible) return null

  const choose = (analytics: boolean) => {
    writeStoredCookieConsent({ analytics, version: CONSENT_VERSION })
    setVisible(false)
  }

  return (
    <aside
      role="region"
      aria-label={text.region}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[#d7deea] bg-white/95 p-4 text-[#071633] shadow-[0_-8px_30px_rgba(7,22,51,0.12)] backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-3xl text-sm leading-6 text-[#31415f]">
          {text.body}{' '}
          <Link href={localizedHref('/legal/cookies', locale)} className="font-semibold text-[#1250c4] underline-offset-2 hover:underline">
            {text.policy}
          </Link>
          .
        </p>
        <div className="flex flex-none flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full border border-[#d7deea] px-4 py-2 text-sm font-semibold text-[#071633] hover:bg-[#f7f9fc]"
            onClick={() => choose(false)}
          >
            {text.necessary}
          </button>
          <button
            type="button"
            className="rounded-full bg-[#1250c4] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d3f9c]"
            onClick={() => choose(true)}
          >
            {text.accept}
          </button>
        </div>
      </div>
    </aside>
  )
}
