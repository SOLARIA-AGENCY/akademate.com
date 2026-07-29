'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

export const PUBLIC_CONSENT_STORAGE_KEY = 'cep_cookie_consent_v1'
export const PUBLIC_CONSENT_EVENT = 'cep-consent-updated'
const PUBLIC_CONSENT_OPEN_EVENT = 'cep-consent-open'

export type PublicConsentPreferences = {
  analytics: boolean
  marketing: boolean
  decidedAt: string
}

export function readPublicConsent(): PublicConsentPreferences | null {
  if (typeof window === 'undefined') return null
  try {
    const parsed = JSON.parse(window.localStorage.getItem(PUBLIC_CONSENT_STORAGE_KEY) ?? '') as Partial<PublicConsentPreferences>
    if (typeof parsed.analytics !== 'boolean' || typeof parsed.marketing !== 'boolean') return null
    return {
      analytics: parsed.analytics,
      marketing: parsed.marketing,
      decidedAt: typeof parsed.decidedAt === 'string' ? parsed.decidedAt : '',
    }
  } catch {
    return null
  }
}

function persistPublicConsent(preferences: Omit<PublicConsentPreferences, 'decidedAt'>) {
  const value: PublicConsentPreferences = {
    ...preferences,
    decidedAt: new Date().toISOString(),
  }
  try {
    window.localStorage.setItem(PUBLIC_CONSENT_STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Continue fail-closed for the current page even when persistent storage is unavailable.
  }
  window.dispatchEvent(new CustomEvent(PUBLIC_CONSENT_EVENT, { detail: value }))
  return value
}

export function CookiePreferencesButton() {
  return (
    <button
      type="button"
      className="transition hover:text-slate-950"
      onClick={() => window.dispatchEvent(new Event(PUBLIC_CONSENT_OPEN_EVENT))}
    >
      Preferencias de cookies
    </button>
  )
}

export function PublicConsentManager({
  metaPixelId,
  ga4MeasurementId,
  gtmContainerId,
}: {
  metaPixelId: string
  ga4MeasurementId: string
  gtmContainerId: string
}) {
  const [preferences, setPreferences] = useState<PublicConsentPreferences | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    const stored = readPublicConsent()
    setPreferences(stored)
    setAnalytics(stored?.analytics ?? false)
    setMarketing(stored?.marketing ?? false)
    setIsOpen(stored === null)

    const open = () => setIsOpen(true)
    window.addEventListener(PUBLIC_CONSENT_OPEN_EVENT, open)
    return () => window.removeEventListener(PUBLIC_CONSENT_OPEN_EVENT, open)
  }, [])

  function save(next: { analytics: boolean; marketing: boolean }) {
    const stored = persistPublicConsent(next)
    setPreferences(stored)
    setAnalytics(stored.analytics)
    setMarketing(stored.marketing)
    setIsOpen(false)
  }

  return (
    <>
      {preferences?.analytics && ga4MeasurementId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4MeasurementId}`} strategy="afterInteractive" />
          <Script id="cep-ga4-consented" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${ga4MeasurementId}', { anonymize_ip: true });`}
          </Script>
        </>
      ) : null}

      {preferences?.marketing && metaPixelId ? (
        <Script id="cep-meta-consented" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${metaPixelId}');
fbq('track', 'PageView');`}
        </Script>
      ) : null}

      {preferences?.marketing && gtmContainerId ? (
        <Script id="cep-gtm-consented" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmContainerId}');`}
        </Script>
      ) : null}

      {isOpen ? (
        <section
          aria-label="Preferencias de cookies"
          className="fixed inset-x-3 bottom-3 z-[10000] mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-2xl sm:bottom-5 sm:p-6"
        >
          <h2 className="text-lg font-bold">Privacidad y cookies</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Las cookies técnicas son necesarias. Analítica y marketing permanecen desactivados
            hasta que usted los autorice. Puede cambiar su elección en cualquier momento.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(event) => setAnalytics(event.target.checked)}
                className="mt-1 h-4 w-4"
              />
              <span>
                <span className="block text-sm font-semibold">Analítica</span>
                <span className="block text-xs leading-5 text-slate-500">Medición agregada del uso y rendimiento.</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(event) => setMarketing(event.target.checked)}
                className="mt-1 h-4 w-4"
              />
              <span>
                <span className="block text-sm font-semibold">Marketing</span>
                <span className="block text-xs leading-5 text-slate-500">Meta Pixel y medición de campañas.</span>
              </span>
            </label>
          </div>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => save({ analytics: false, marketing: false })} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50">
              Rechazar no esenciales
            </button>
            <button type="button" onClick={() => save({ analytics, marketing })} className="rounded-lg border border-slate-900 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50">
              Guardar preferencias
            </button>
            <button type="button" onClick={() => save({ analytics: true, marketing: true })} className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
              Aceptar todas
            </button>
          </div>
        </section>
      ) : null}
    </>
  )
}
