'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import type { CookieBannerVariant } from '@/app/lib/website/types'
import {
  LEGACY_CONSENT_STORAGE_KEY,
  WEBSITE_CONSENT_COOKIE,
  WEBSITE_CONSENT_EVENT,
  WEBSITE_CONSENT_OPEN_EVENT,
  WEBSITE_CONSENT_STORAGE_KEY,
  acceptOfferedDecision,
  canLoadAnalytics,
  canLoadGoogleMarketing,
  canLoadMetaMarketing,
  offeredConsentCategories,
  parseVisitorConsent,
  rejectNonessentialDecision,
  resolveAdsFlags,
  serializeVisitorConsent,
  type ConsentAdsFlags,
  type OfferedConsentCategory,
  type VisitorConsentDecision,
} from '@/app/lib/website/consent'
import type { WebsiteConsentConfig } from '@/app/lib/website/types'

export const PUBLIC_CONSENT_STORAGE_KEY = WEBSITE_CONSENT_STORAGE_KEY
export const PUBLIC_CONSENT_EVENT = WEBSITE_CONSENT_EVENT

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const parts = document.cookie.split(';')
  for (const part of parts) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return decodeURIComponent(rest.join('='))
  }
  return null
}

function writeConsentCookie(value: VisitorConsentDecision) {
  const encoded = encodeURIComponent(JSON.stringify(value))
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${WEBSITE_CONSENT_COOKIE}=${encoded}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`
}

export function readPublicConsent(): VisitorConsentDecision | null {
  if (typeof window === 'undefined') return null
  try {
    const fromCookie = readCookie(WEBSITE_CONSENT_COOKIE)
    const parsedCookie = fromCookie ? parseVisitorConsent(JSON.parse(fromCookie)) : null
    if (parsedCookie) return parsedCookie
    const stored =
      window.localStorage.getItem(WEBSITE_CONSENT_STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_CONSENT_STORAGE_KEY)
    return parseVisitorConsent(JSON.parse(stored ?? ''))
  } catch {
    return null
  }
}

function persistPublicConsent(preferences: Omit<VisitorConsentDecision, 'decidedAt'>) {
  const value = serializeVisitorConsent(preferences)
  try {
    window.localStorage.setItem(WEBSITE_CONSENT_STORAGE_KEY, JSON.stringify(value))
    writeConsentCookie(value)
  } catch {
    writeConsentCookie(value)
  }
  window.dispatchEvent(new CustomEvent(WEBSITE_CONSENT_EVENT, { detail: value }))
  return value
}

export function CookiePreferencesButton() {
  return (
    <button
      type="button"
      className="transition hover:text-slate-950"
      onClick={() => window.dispatchEvent(new Event(WEBSITE_CONSENT_OPEN_EVENT))}
    >
      Preferencias de cookies
    </button>
  )
}

function bannerClassName(variant: CookieBannerVariant): string {
  switch (variant) {
    case 'bar':
      return 'fixed inset-x-0 bottom-0 z-[10000] border-t border-slate-200 bg-white p-5 text-slate-900 shadow-[0_-12px_28px_rgba(0,0,0,0.16)] sm:p-6'
    case 'corner':
      return 'fixed bottom-3 right-3 z-[10000] w-[min(100%-1.5rem,24rem)] rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-2xl sm:bottom-5 sm:right-5'
    case 'modal':
      return 'fixed inset-x-4 top-1/2 z-[10000] mx-auto w-[min(100%-2rem,36rem)] -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-2xl sm:p-6'
    default: {
      const exhaustive: never = variant
      return exhaustive
    }
  }
}

export function PublicConsentManager({
  metaPixelId,
  ga4MeasurementId,
  gtmContainerId,
  googleAdsEnabled = false,
  consent,
  pageSlug,
}: {
  metaPixelId: string
  ga4MeasurementId: string
  gtmContainerId: string
  googleAdsEnabled?: boolean
  consent?: WebsiteConsentConfig
  pageSlug?: string
}) {
  const pathname = usePathname()
  const resolvedPageSlug = pageSlug || pathname || '/'
  const ads: ConsentAdsFlags = useMemo(
    () =>
      resolveAdsFlags({
        googleAdsEnabled,
        gtmContainerId,
        metaPixelId,
      }),
    [googleAdsEnabled, gtmContainerId, metaPixelId],
  )
  const config = consent ?? {
    bannerVariant: 'bar' as const,
    categories: { analytics: true, marketing_google: true, marketing_meta: true },
  }
  const offered = offeredConsentCategories(config, ads)
  const variant = config.bannerVariant ?? 'bar'

  const [preferences, setPreferences] = useState<VisitorConsentDecision | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [managing, setManaging] = useState(false)
  const [draft, setDraft] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const stored = readPublicConsent()
    setPreferences(stored)
    setIsOpen(stored === null)
    setDraft({
      analytics: stored?.analytics ?? false,
      marketing_google: stored?.marketing_google ?? false,
      marketing_meta: stored?.marketing_meta ?? false,
    })

    const open = () => {
      setManaging(true)
      setIsOpen(true)
    }
    window.addEventListener(WEBSITE_CONSENT_OPEN_EVENT, open)
    return () => window.removeEventListener(WEBSITE_CONSENT_OPEN_EVENT, open)
  }, [])

  useEffect(() => {
    if (preferences !== null || typeof window === 'undefined') return
    void fetch('/api/config/website/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shown: true,
        pageSlug: resolvedPageSlug,
        bannerVariant: variant,
        ads,
      }),
    }).catch(() => {})
  }, [ads, resolvedPageSlug, preferences, variant])

  function save(next: Omit<VisitorConsentDecision, 'decidedAt'>) {
    const stored = persistPublicConsent(next)
    setPreferences(stored)
    setDraft({
      analytics: stored.analytics,
      marketing_google: stored.marketing_google,
      marketing_meta: stored.marketing_meta,
    })
    setIsOpen(false)
    setManaging(false)
    void fetch('/api/config/website/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pageSlug: resolvedPageSlug,
        bannerVariant: variant,
        ads,
        decision: next,
      }),
    }).catch(() => {})
  }

  function toggleCategory(id: OfferedConsentCategory['id']) {
    setDraft((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const loadAnalytics = canLoadAnalytics(preferences, ga4MeasurementId)
  const loadGoogle = canLoadGoogleMarketing(preferences, ads, gtmContainerId)
  const loadMeta = canLoadMetaMarketing(preferences, ads, metaPixelId)

  return (
    <>
      {loadAnalytics ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4MeasurementId}`} strategy="afterInteractive" />
          <Script id="ak-ga4-consented" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${ga4MeasurementId}', { anonymize_ip: true });`}
          </Script>
        </>
      ) : null}

      {loadMeta ? (
        <Script id="ak-meta-consented" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${metaPixelId}');
fbq('track', 'PageView');`}
        </Script>
      ) : null}

      {loadGoogle ? (
        <Script id="ak-gtm-consented" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmContainerId}');`}
        </Script>
      ) : null}

      {isOpen ? (
        <section aria-label="Preferencias de cookies" className={bannerClassName(variant)}>
          <div className={variant === 'bar' ? 'mx-auto max-w-7xl' : undefined}>
            <h2 className="text-lg font-bold">Privacidad y cookies</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Las cookies técnicas son necesarias. El resto permanece desactivado hasta que lo autorice.
              Puede rechazar las no esenciales o ajustar cada categoría. Consulte la{' '}
              <a className="font-semibold underline" href="/legal/cookies">
                política de cookies
              </a>
              .
            </p>
            {managing || variant === 'modal' ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3">
                  <input type="checkbox" checked disabled className="mt-1 h-4 w-4" />
                  <span>
                    <span className="block text-sm font-semibold">Necesarias</span>
                    <span className="block text-xs leading-5 text-slate-500">Siempre activas. No son opcionales.</span>
                  </span>
                </label>
                {offered.map((category) => (
                  <label key={category.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3">
                    <input
                      type="checkbox"
                      checked={draft[category.id] === true}
                      onChange={() => toggleCategory(category.id)}
                      className="mt-1 h-4 w-4"
                    />
                    <span>
                      <span className="block text-sm font-semibold">{category.label}</span>
                      <span className="block text-xs leading-5 text-slate-500">{category.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            ) : null}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => save(rejectNonessentialDecision())}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
              >
                Rechazar no esenciales
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!managing) {
                    setManaging(true)
                    return
                  }
                  save({
                    analytics: offered.some((item) => item.id === 'analytics') ? draft.analytics === true : false,
                    marketing_google: offered.some((item) => item.id === 'marketing_google')
                      ? draft.marketing_google === true
                      : false,
                    marketing_meta: offered.some((item) => item.id === 'marketing_meta')
                      ? draft.marketing_meta === true
                      : false,
                  })
                }}
                className="rounded-lg border border-slate-900 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
              >
                {managing ? 'Guardar preferencias' : 'Gestionar preferencias'}
              </button>
              <button
                type="button"
                onClick={() => save(acceptOfferedDecision(offered))}
                className="rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-dark)]"
              >
                Aceptar disponibles
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </>
  )
}
