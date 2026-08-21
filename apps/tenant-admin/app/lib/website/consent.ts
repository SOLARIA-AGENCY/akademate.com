import type {
  CookieBannerVariant,
  WebsiteConsentCategoryId,
  WebsiteConsentConfig,
  WebsiteConsentStats,
} from './types'

export const WEBSITE_CONSENT_COOKIE = 'ak_consent_v1'
export const WEBSITE_CONSENT_STORAGE_KEY = 'ak_cookie_consent_v1'
export const LEGACY_CONSENT_STORAGE_KEY = 'cep_cookie_consent_v1'
export const WEBSITE_CONSENT_EVENT = 'ak-consent-updated'
export const WEBSITE_CONSENT_OPEN_EVENT = 'ak-consent-open'

export const DEFAULT_CONSENT_STATS: WebsiteConsentStats = {
  shown: 0,
  analyticsGranted: 0,
  analyticsDenied: 0,
  marketingGoogleGranted: 0,
  marketingGoogleDenied: 0,
  marketingMetaGranted: 0,
  marketingMetaDenied: 0,
}

export const DEFAULT_WEBSITE_CONSENT: WebsiteConsentConfig = {
  bannerVariant: 'bar',
  categories: {
    analytics: true,
    marketing_google: true,
    marketing_meta: true,
  },
  googleAdsEnabled: false,
  stats: DEFAULT_CONSENT_STATS,
}

export type ConsentAdsFlags = {
  googleAds: boolean
  metaAds: boolean
}

export type VisitorConsentDecision = {
  analytics: boolean
  marketing_google: boolean
  marketing_meta: boolean
  decidedAt: string
}

export type OfferedConsentCategory = {
  id: Exclude<WebsiteConsentCategoryId, 'necessary'>
  label: string
  description: string
}

export function isCookieBannerVariant(value: unknown): value is CookieBannerVariant {
  return value === 'bar' || value === 'modal' || value === 'corner'
}

export function emptyConsentStats(): WebsiteConsentStats {
  return { ...DEFAULT_CONSENT_STATS }
}

export function normalizeWebsiteConsent(input?: Partial<WebsiteConsentConfig> | null): WebsiteConsentConfig {
  const categories = input?.categories
  return {
    bannerVariant: isCookieBannerVariant(input?.bannerVariant) ? input.bannerVariant : DEFAULT_WEBSITE_CONSENT.bannerVariant,
    categories: {
      analytics: categories?.analytics !== false,
      marketing_google: categories?.marketing_google !== false,
      marketing_meta: categories?.marketing_meta !== false,
    },
    googleAdsEnabled: input?.googleAdsEnabled === true,
    stats: {
      ...DEFAULT_CONSENT_STATS,
      ...(input?.stats ?? {}),
    },
  }
}

export function resolveAdsFlags(input: {
  googleAdsEnabled?: boolean
  gtmContainerId?: string
  metaPixelId?: string
  metaAdAccountId?: string
}): ConsentAdsFlags {
  return {
    googleAds: input.googleAdsEnabled === true || Boolean(input.gtmContainerId?.trim()),
    metaAds: Boolean(input.metaPixelId?.trim() || input.metaAdAccountId?.trim()),
  }
}

export function offeredConsentCategories(
  consent: WebsiteConsentConfig,
  ads: ConsentAdsFlags,
): OfferedConsentCategory[] {
  const offered: OfferedConsentCategory[] = []
  if (consent.categories.analytics) {
    offered.push({
      id: 'analytics',
      label: 'Analítica',
      description: 'Medición agregada del uso y el rendimiento de la web.',
    })
  }
  if (consent.categories.marketing_google && ads.googleAds) {
    offered.push({
      id: 'marketing_google',
      label: 'Publicidad Google',
      description: 'Etiquetas de Google Ads o GTM para medir campañas.',
    })
  }
  if (consent.categories.marketing_meta && ads.metaAds) {
    offered.push({
      id: 'marketing_meta',
      label: 'Publicidad Meta',
      description: 'Pixel de Meta para medir campañas en Facebook e Instagram.',
    })
  }
  return offered
}

export function canLoadAnalytics(decision: VisitorConsentDecision | null, ga4MeasurementId: string): boolean {
  return Boolean(decision?.analytics && ga4MeasurementId.trim())
}

export function canLoadGoogleMarketing(
  decision: VisitorConsentDecision | null,
  ads: ConsentAdsFlags,
  gtmContainerId: string,
): boolean {
  return Boolean(decision?.marketing_google && ads.googleAds && gtmContainerId.trim())
}

export function canLoadMetaMarketing(
  decision: VisitorConsentDecision | null,
  ads: ConsentAdsFlags,
  metaPixelId: string,
): boolean {
  return Boolean(decision?.marketing_meta && ads.metaAds && metaPixelId.trim())
}

export function parseVisitorConsent(raw: unknown): VisitorConsentDecision | null {
  if (!raw || typeof raw !== 'object') return null
  const value = raw as Record<string, unknown>
  const analytics = value.analytics === true
  const marketingGoogle =
    value.marketing_google === true || (value.marketing === true && value.marketing_google !== false)
  const marketingMeta =
    value.marketing_meta === true || (value.marketing === true && value.marketing_meta !== false)
  if (
    typeof value.analytics !== 'boolean' &&
    typeof value.marketing !== 'boolean' &&
    typeof value.marketing_google !== 'boolean' &&
    typeof value.marketing_meta !== 'boolean'
  ) {
    return null
  }
  return {
    analytics,
    marketing_google: marketingGoogle,
    marketing_meta: marketingMeta,
    decidedAt: typeof value.decidedAt === 'string' ? value.decidedAt : '',
  }
}

export function serializeVisitorConsent(
  decision: Omit<VisitorConsentDecision, 'decidedAt'>,
  decidedAt = new Date().toISOString(),
): VisitorConsentDecision {
  return {
    analytics: decision.analytics,
    marketing_google: decision.marketing_google,
    marketing_meta: decision.marketing_meta,
    decidedAt,
  }
}

export function rejectNonessentialDecision(): Omit<VisitorConsentDecision, 'decidedAt'> {
  return { analytics: false, marketing_google: false, marketing_meta: false }
}

export function acceptOfferedDecision(
  offered: OfferedConsentCategory[],
): Omit<VisitorConsentDecision, 'decidedAt'> {
  const ids = new Set(offered.map((item) => item.id))
  return {
    analytics: ids.has('analytics'),
    marketing_google: ids.has('marketing_google'),
    marketing_meta: ids.has('marketing_meta'),
  }
}

export type ConsentEventInput = {
  pageSlug?: string
  bannerVariant?: CookieBannerVariant
  ads: ConsentAdsFlags
  shown?: boolean
  decision?: Omit<VisitorConsentDecision, 'decidedAt'>
}

export function applyConsentEvent(stats: WebsiteConsentStats, event: ConsentEventInput): WebsiteConsentStats {
  const next = { ...stats }
  if (event.shown) next.shown += 1
  if (!event.decision) return next
  if (event.decision.analytics) next.analyticsGranted += 1
  else next.analyticsDenied += 1
  if (event.ads.googleAds) {
    if (event.decision.marketing_google) next.marketingGoogleGranted += 1
    else next.marketingGoogleDenied += 1
  }
  if (event.ads.metaAds) {
    if (event.decision.marketing_meta) next.marketingMetaGranted += 1
    else next.marketingMetaDenied += 1
  }
  return next
}

export function consentRate(granted: number, denied: number): number {
  const total = granted + denied
  if (total <= 0) return 0
  return Math.round((granted / total) * 100)
}

export function legalCookieCategories(ads: ConsentAdsFlags): Array<{
  id: WebsiteConsentCategoryId
  title: string
  consent: string
  items: string[]
}> {
  const categories: Array<{
    id: WebsiteConsentCategoryId
    title: string
    consent: string
    items: string[]
  }> = [
    {
      id: 'necessary',
      title: 'Necesarias',
      consent: 'Siempre activas. Permiten el funcionamiento y recordar su elección de cookies.',
      items: [
        `Preferencia de consentimiento \`${WEBSITE_CONSENT_COOKIE}\` en una cookie de primer partido.`,
        'Cookies de sesión y seguridad del área autenticada, solo si accede a esa área.',
      ],
    },
    {
      id: 'analytics',
      title: 'Analítica',
      consent: 'Desactivada hasta que la autorice. Mide visitas de forma agregada.',
      items: [
        'Google Analytics 4 solo si el centro ha configurado un identificador y usted consiente analítica.',
      ],
    },
  ]

  if (ads.googleAds) {
    categories.push({
      id: 'marketing_google',
      title: 'Publicidad Google',
      consent: 'Solo se ofrece si el centro tiene publicidad o etiquetas de Google activas.',
      items: [
        'Google Ads o Google Tag Manager pueden cargar etiquetas de campaña cuando hay consentimiento.',
      ],
    })
  }

  if (ads.metaAds) {
    categories.push({
      id: 'marketing_meta',
      title: 'Publicidad Meta',
      consent: 'Solo se ofrece si el centro tiene el pixel o anuncios de Meta activos.',
      items: [
        'Meta Pixel puede usar identificadores como `_fbp` cuando la medición está configurada y consentida.',
      ],
    })
  }

  return categories
}
