export const META_LEAD_CAPI_VALUE_EUR = 50
export const META_LEAD_CAPI_CURRENCY = 'EUR'

function parseCampaignMap(raw: string | undefined): Record<string, string> {
  if (!raw?.trim()) return {}
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const map: Record<string, string> = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string' && value.trim()) map[key] = value.trim()
    }
    return map
  } catch {
    return {}
  }
}

export function tenantPaidLandingCampaignMap(): Record<string, string> {
  return parseCampaignMap(process.env.META_PAID_LANDING_CAMPAIGN_MAP)
}

export type MetaAttributionInput = {
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  meta_campaign_id?: string | null
  campaign_id?: string | null
  utm_id?: string | null
  fbclid?: string | null
}

export function isPaidMetaLanding(input: MetaAttributionInput | null | undefined): boolean {
  if (!input) return false
  if (String(input.fbclid || '').trim()) return true
  const source = String(input.utm_source || '').trim().toLowerCase()
  const medium = String(input.utm_medium || '').trim().toLowerCase()
  return (source === 'facebook' || source === 'instagram') && medium === 'paid'
}

export function shouldTrackPublicPageView(input: {
  attribution?: MetaAttributionInput | null
  analyticsConsent: boolean
}): boolean {
  if (isPaidMetaLanding(input.attribution)) return true
  return input.analyticsConsent === true
}

export function inferPaidCampaignFromPath(
  path: string | null | undefined,
  attribution: MetaAttributionInput | null | undefined,
  campaignMap: Record<string, string> = tenantPaidLandingCampaignMap(),
): string | null {
  if (!isPaidMetaLanding(attribution)) return null
  const haystack = String(path || '')
  for (const [code, campaignId] of Object.entries(campaignMap)) {
    if (code && campaignId && haystack.includes(code)) return campaignId
  }
  return null
}

export function resolveMetaFbc(
  fbc: string | null | undefined,
  fbclid: string | null | undefined,
  nowMs: number = Date.now(),
): string | null {
  const existing = typeof fbc === 'string' ? fbc.trim() : ''
  if (existing) return existing
  const clickId = typeof fbclid === 'string' ? fbclid.trim() : ''
  if (!clickId) return null
  return `fb.1.${Math.floor(nowMs / 1000)}.${clickId}`
}

export function leadCapiCustomData(input?: { contentName?: string; contentCategory?: string }) {
  return {
    content_name: input?.contentName || '',
    content_category: input?.contentCategory || 'convocatoria',
    value: META_LEAD_CAPI_VALUE_EUR,
    currency: META_LEAD_CAPI_CURRENCY,
  }
}
