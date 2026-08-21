/**
 * Meta Marketing API Utility
 *
 * Wraps the Meta Graph API for programmatic campaign management.
 * Used by /api/meta/ads endpoint to create campaigns from Akademate.
 *
 * RULE: Campaign name prefix comes from META_CAMPAIGN_NAME_PREFIX (tenant/env).
 * RULE: All campaigns are created PAUSED — never auto-publish
 */

const META_GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION || 'v25.0'
const META_GRAPH_API = `https://graph.facebook.com/${META_GRAPH_API_VERSION}`

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MetaApiResult<T = Record<string, unknown>> {
  success: boolean
  data?: T
  error?: string
}

interface CreateCampaignParams {
  adAccountId: string
  accessToken: string
  name: string
  objective?: string
  status?: string
  specialAdCategories?: string[]
}

export const META_SAFE_DELIVERY_PLACEMENTS = [
  'facebook_feed',
  'facebook_story',
  'facebook_reels',
  'instagram_stream',
  'instagram_story',
  'instagram_reels',
] as const

export const FORBIDDEN_META_PIXEL_IDS = new Set(['831036194188836', '3589029217896274'])
export const PIXEL_LEAD_VOLUME_THRESHOLD_7D = 50
export const CEP_TENERIFE_CITY_ID = '696646'
export const CEP_TENERIFE_RADIUS_KM = 80
export const DEFAULT_CAMPAIGN_NAME_PREFIX = process.env.META_CAMPAIGN_NAME_PREFIX || ''

const MESSAGING_DESTINATION_TYPES = new Set([
  'PHONE_CALL',
  'WEBSITE_AND_PHONE_CALL',
  'WHATSAPP',
  'MESSENGER',
  'INSTAGRAM_DIRECT',
  'ON_AD',
])

export type FlexibleAssetRatio = '1:1' | '9:16' | '16:9'
export type FlexibleOptimizationType = 'REGULAR' | 'PLACEMENT'
export type AdSetConversionPath = 'LANDING_PAGE_VIEWS' | 'OFFSITE_CONVERSIONS'

interface CreateAdSetParams {
  adAccountId: string
  accessToken: string
  campaignId: string
  name: string
  dailyBudget: number
  pixelId: string
  optimizationGoal?: string
  billingEvent?: string
  destinationType?: string
  isDynamicCreative?: boolean
  conversionPath?: AdSetConversionPath
  bidStrategy?: string
  targeting: {
    geoLocations: {
      regions?: Array<{ key: string }>
      cities?: Array<{ key: string; radius?: number; distance_unit?: string }>
    }
    ageMin?: number
    ageMax?: number
    advantageAudience?: 0 | 1
    publisherPlatforms?: string[]
    facebookPositions?: string[]
    instagramPositions?: string[]
  }
  startTime?: string
  endTime?: string
}

export interface FlexibleCreativeAsset {
  ratio: FlexibleAssetRatio
  type: 'image' | 'video'
  imageHash?: string
  videoId?: string
}

export interface CreateFlexibleAdCreativeParams {
  adAccountId: string
  accessToken: string
  name: string
  pageId: string
  instagramUserId?: string
  linkUrl: string
  urlParameters?: string
  bodies: string[]
  titles: string[]
  descriptions?: string[]
  callToAction?: string
  assets: FlexibleCreativeAsset[]
  optimizationType?: FlexibleOptimizationType
  assetCustomizationRules?: Array<Record<string, unknown>>
}

export interface GeoLocationInput {
  cityId?: string
  radiusKm?: number
  regions?: Array<{ key: string }>
}

interface CreateAdCreativeParams {
  adAccountId: string
  accessToken: string
  name: string
  pageId: string
  imageHash?: string
  videoId?: string
  headline: string
  body: string
  description: string
  linkUrl: string
  callToAction?: string
  urlParameters?: string
}

interface CreateAdParams {
  adAccountId: string
  accessToken: string
  adSetId: string
  name: string
  creativeId: string
  status?: string
}

interface UpdateAdStatusParams {
  adId: string
  accessToken: string
  status: 'ACTIVE' | 'PAUSED'
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function metaPost(
  path: string,
  body: Record<string, unknown>,
  accessToken: string,
): Promise<MetaApiResult<{ id: string }>> {
  try {
    const url = `${META_GRAPH_API}${path}`
    const formBody = new URLSearchParams()
    formBody.set('access_token', accessToken)
    for (const [key, value] of Object.entries(body)) {
      if (value !== undefined && value !== null) {
        formBody.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
      }
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody.toString(),
    })

    const data = await res.json()

    if (!res.ok || data.error) {
      const msg = data.error?.message ?? JSON.stringify(data)
      console.error(`[meta-marketing] POST ${path} failed:`, msg)
      return { success: false, error: msg }
    }

    return { success: true, data: { id: data.id } }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[meta-marketing] POST ${path} exception:`, msg)
    return { success: false, error: msg }
  }
}

async function metaGet(
  path: string,
  params: Record<string, string>,
  accessToken: string,
): Promise<MetaApiResult> {
  try {
    const url = new URL(`${META_GRAPH_API}${path}`)
    url.searchParams.set('access_token', accessToken)
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }

    const res = await fetch(url.toString())
    const data = await res.json()

    if (!res.ok || data.error) {
      const msg = data.error?.message ?? JSON.stringify(data)
      return { success: false, error: msg }
    }

    return { success: true, data }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

function appendQueryString(rawUrl: string, queryString?: string): string {
  if (!queryString) return rawUrl
  const url = new URL(rawUrl)
  const params = new URLSearchParams(queryString)
  for (const [key, value] of params.entries()) {
    url.searchParams.set(key, value)
  }
  return url.toString()
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function applyCampaignNamePrefix(
  name: string,
  prefix = process.env.META_CAMPAIGN_NAME_PREFIX || DEFAULT_CAMPAIGN_NAME_PREFIX,
): string {
  const normalizedPrefix = prefix.trim()
  if (!normalizedPrefix) return name
  return name.startsWith(normalizedPrefix) ? name : `${normalizedPrefix} - ${name}`
}

export function assertAllowedPixelId(pixelId: string): void {
  if (FORBIDDEN_META_PIXEL_IDS.has(String(pixelId || '').trim())) {
    throw new Error('Pixel prohibido para estas campañas. Usa el pixel configurado del tenant.')
  }
}

export function needsWebsiteOnlyAdSet(destinationType: string | null | undefined): boolean {
  const dest = String(destinationType || '').trim().toUpperCase()
  if (!dest) return false
  if (dest === 'WEBSITE') return false
  if (MESSAGING_DESTINATION_TYPES.has(dest)) return true
  return dest.includes('PHONE') || dest.includes('WHATSAPP') || dest.includes('MESSENGER')
}

export function chooseOptimizationFromPixelVolume(leadCount7d: number | null | undefined): AdSetConversionPath {
  if (typeof leadCount7d === 'number' && leadCount7d >= PIXEL_LEAD_VOLUME_THRESHOLD_7D) {
    return 'OFFSITE_CONVERSIONS'
  }
  return 'LANDING_PAGE_VIEWS'
}

export function buildGeoLocations(input: GeoLocationInput = {}): {
  cities?: Array<{ key: string; radius: number; distance_unit: string }>
  regions?: Array<{ key: string }>
} {
  const geo: {
    cities?: Array<{ key: string; radius: number; distance_unit: string }>
    regions?: Array<{ key: string }>
  } = {}
  if (input.cityId) {
    geo.cities = [{
      key: input.cityId,
      radius: input.radiusKm ?? CEP_TENERIFE_RADIUS_KM,
      distance_unit: 'kilometer',
    }]
  }
  if (input.regions?.length) geo.regions = input.regions
  return geo
}

export function buildCepTenerifeGeoLocations() {
  return buildGeoLocations({ cityId: CEP_TENERIFE_CITY_ID, radiusKm: CEP_TENERIFE_RADIUS_KM })
}

export function assetFeedLabel(asset: FlexibleCreativeAsset): string {
  if (asset.type === 'video') {
    if (asset.ratio === '1:1') return 'vid_1x1'
    if (asset.ratio === '9:16') return 'vid_9x16'
    return 'vid_16x9'
  }
  if (asset.ratio === '1:1') return 'art_1x1'
  if (asset.ratio === '9:16') return 'art_9x16'
  return 'art_16x9'
}

export function resolveFlexibleOptimizationType(
  requested?: FlexibleOptimizationType,
  rules?: Array<Record<string, unknown>>,
): FlexibleOptimizationType {
  const ruleCount = Array.isArray(rules) ? rules.length : 0
  if (requested === 'PLACEMENT') {
    if (ruleCount === 0) {
      throw new Error('optimization_type PLACEMENT requiere asset_customization_rules. Usa REGULAR o 1 regla por cada placement seguro.')
    }
    if (ruleCount !== META_SAFE_DELIVERY_PLACEMENTS.length) {
      throw new Error(`optimization_type PLACEMENT exige exactamente ${META_SAFE_DELIVERY_PLACEMENTS.length} reglas, una por placement seguro.`)
    }
    return 'PLACEMENT'
  }
  return 'REGULAR'
}

export async function createCampaign(params: CreateCampaignParams): Promise<MetaApiResult<{ id: string }>> {
  const name = applyCampaignNamePrefix(params.name)

  return metaPost(`/act_${params.adAccountId}/campaigns`, {
    name,
    objective: params.objective ?? 'OUTCOME_LEADS',
    status: params.status ?? 'PAUSED',
    special_ad_categories: params.specialAdCategories ?? [],
  }, params.accessToken)
}

export async function createAdSet(params: CreateAdSetParams): Promise<MetaApiResult<{ id: string }>> {
  assertAllowedPixelId(params.pixelId)
  const conversionPath = params.conversionPath
    || (params.optimizationGoal as AdSetConversionPath | undefined)
    || 'LANDING_PAGE_VIEWS'
  const optimizationGoal = params.optimizationGoal
    || (conversionPath === 'OFFSITE_CONVERSIONS' ? 'OFFSITE_CONVERSIONS' : 'LANDING_PAGE_VIEWS')
  const promotedObject: Record<string, unknown> = { pixel_id: params.pixelId }
  if (optimizationGoal === 'OFFSITE_CONVERSIONS') {
    promotedObject.custom_event_type = 'LEAD'
  }

  const geoLocations: Record<string, unknown> = {}
  if (params.targeting.geoLocations.cities?.length) {
    geoLocations.cities = params.targeting.geoLocations.cities
  }
  if (params.targeting.geoLocations.regions?.length) {
    geoLocations.regions = params.targeting.geoLocations.regions
  }

  return metaPost(`/act_${params.adAccountId}/adsets`, {
    campaign_id: params.campaignId,
    name: params.name,
    billing_event: params.billingEvent ?? 'IMPRESSIONS',
    optimization_goal: optimizationGoal,
    destination_type: params.destinationType ?? 'WEBSITE',
    is_dynamic_creative: params.isDynamicCreative !== false,
    bid_strategy: params.bidStrategy ?? 'LOWEST_COST_WITHOUT_CAP',
    daily_budget: params.dailyBudget,
    promoted_object: promotedObject,
    attribution_spec: [{ event_type: 'CLICK_THROUGH', window_days: 1 }],
    targeting: {
      geo_locations: geoLocations,
      age_min: params.targeting.ageMin ?? 18,
      age_max: params.targeting.ageMax ?? 65,
      targeting_automation: {
        advantage_audience: params.targeting.advantageAudience ?? 0,
      },
      publisher_platforms: params.targeting.publisherPlatforms ?? ['facebook', 'instagram'],
      facebook_positions: params.targeting.facebookPositions ?? ['feed', 'story', 'facebook_reels'],
      instagram_positions: params.targeting.instagramPositions ?? ['stream', 'story', 'reels'],
    },
    status: 'PAUSED',
    ...(params.startTime ? { start_time: params.startTime } : {}),
    ...(params.endTime ? { end_time: params.endTime } : {}),
  }, params.accessToken)
}

export async function getAdSetDelivery(adSetId: string, accessToken: string): Promise<MetaApiResult> {
  return metaGet(`/${adSetId}`, {
    fields: 'id,name,destination_type,optimization_goal,promoted_object,status,effective_status',
  }, accessToken)
}

export async function getPixelLeadCount7d(input: {
  pixelId: string
  accessToken: string
  adAccountId?: string
}): Promise<number> {
  const stats = await metaGet(`/${input.pixelId}/stats`, {
    aggregation: 'event',
    start_time: String(Math.floor((Date.now() - 7 * 86_400_000) / 1000)),
    end_time: String(Math.floor(Date.now() / 1000)),
  }, input.accessToken)
  if (!stats.success || !stats.data) return 0
  const rows = Array.isArray((stats.data as { data?: unknown }).data)
    ? (stats.data as { data: Array<Record<string, unknown>> }).data
    : Array.isArray(stats.data)
      ? stats.data as Array<Record<string, unknown>>
      : []
  let count = 0
  for (const row of rows) {
    const event = String(row.event || row.event_name || row.name || '').toLowerCase()
    if (event === 'lead' || event === 'offsite_conversion.fb_pixel_lead') {
      count += Number(row.count || row.value || row.total || 0)
    }
  }
  return Number.isFinite(count) ? count : 0
}

export async function createAdCreative(params: CreateAdCreativeParams): Promise<MetaApiResult<{ id: string }>> {
  const videoLinkUrl = appendQueryString(params.linkUrl, params.urlParameters)
  const objectStorySpec: Record<string, unknown> = params.videoId
    ? {
      page_id: params.pageId,
      video_data: {
        video_id: params.videoId,
        message: params.body,
        title: params.headline,
        call_to_action: {
          type: params.callToAction ?? 'LEARN_MORE',
          value: { link: videoLinkUrl },
        },
      },
    }
    : {
      page_id: params.pageId,
      link_data: {
        link: params.linkUrl,
        message: params.body,
        name: params.headline,
        description: params.description,
        call_to_action: { type: params.callToAction ?? 'LEARN_MORE' },
        ...(params.imageHash ? { image_hash: params.imageHash } : {}),
        ...(params.urlParameters ? { url_tags: params.urlParameters } : {}),
      },
    }

  return metaPost(`/act_${params.adAccountId}/adcreatives`, {
    name: params.name,
    object_story_spec: objectStorySpec,
  }, params.accessToken)
}

export async function createFlexibleAdCreative(
  params: CreateFlexibleAdCreativeParams,
): Promise<MetaApiResult<{ id: string }>> {
  const images = params.assets.filter((asset) => asset.type === 'image' && asset.imageHash)
  const videos = params.assets.filter((asset) => asset.type === 'video' && asset.videoId)
  const hasSquare = images.some((asset) => asset.ratio === '1:1')
  const hasVertical = images.some((asset) => asset.ratio === '9:16')
  if (!hasSquare || !hasVertical) {
    throw new Error('createFlexibleAdCreative exige imagen 1:1 e imagen 9:16.')
  }

  const optimizationType = resolveFlexibleOptimizationType(
    params.optimizationType,
    params.assetCustomizationRules,
  )

  const objectStorySpec: Record<string, unknown> = {
    page_id: params.pageId,
    ...(params.instagramUserId ? { instagram_user_id: params.instagramUserId } : {}),
  }

  const assetFeedSpec: Record<string, unknown> = {
    images: images.map((asset) => ({
      hash: asset.imageHash,
      adlabels: [{ name: assetFeedLabel(asset) }],
    })),
    bodies: params.bodies.filter(Boolean).slice(0, 6).map((text) => ({ text })),
    titles: params.titles.filter(Boolean).slice(0, 6).map((text) => ({ text })),
    descriptions: (params.descriptions || []).filter(Boolean).slice(0, 3).map((text) => ({ text })),
    ad_formats: ['AUTOMATIC_FORMAT'],
    call_to_action_types: [params.callToAction || 'SIGN_UP'],
    link_urls: [{ website_url: appendQueryString(params.linkUrl, params.urlParameters) }],
    optimization_type: optimizationType,
  }
  if (videos.length > 0) {
    assetFeedSpec.videos = videos.map((asset) => ({
      video_id: asset.videoId,
      adlabels: [{ name: assetFeedLabel(asset) }],
    }))
  }
  if (optimizationType === 'PLACEMENT') {
    assetFeedSpec.asset_customization_rules = params.assetCustomizationRules
  }

  return metaPost(`/act_${params.adAccountId}/adcreatives`, {
    name: params.name,
    object_story_spec: objectStorySpec,
    asset_feed_spec: assetFeedSpec,
    degrees_of_freedom_spec: {
      creative_features_spec: {
        standard_enhancements: { enroll_status: 'OPT_OUT' },
      },
    },
    ...(params.urlParameters ? { url_tags: params.urlParameters } : {}),
  }, params.accessToken)
}

export async function createAd(params: CreateAdParams): Promise<MetaApiResult<{ id: string }>> {
  return metaPost(`/act_${params.adAccountId}/ads`, {
    adset_id: params.adSetId,
    name: params.name,
    creative: { creative_id: params.creativeId },
    status: params.status ?? 'PAUSED',
  }, params.accessToken)
}

export async function updateAdStatus(params: UpdateAdStatusParams): Promise<MetaApiResult<{ id: string }>> {
  return metaPost(`/${params.adId}`, {
    status: params.status,
  }, params.accessToken)
}

export async function uploadAdImage(
  adAccountId: string,
  accessToken: string,
  imageUrl: string,
): Promise<MetaApiResult<{ hash: string }>> {
  try {
    // Download image from our media server
    const imgRes = await fetch(imageUrl)
    if (!imgRes.ok) return { success: false, error: 'Failed to download image' }
    const blob = await imgRes.blob()

    const formData = new FormData()
    formData.append('access_token', accessToken)
    formData.append('filename', new File([blob], 'ad-image.jpg', { type: blob.type }))

    const url = `${META_GRAPH_API}/act_${adAccountId}/adimages`
    const res = await fetch(url, { method: 'POST', body: formData })
    const data = await res.json()

    if (!res.ok || data.error) {
      return { success: false, error: data.error?.message ?? 'Image upload failed' }
    }

    // Response: { images: { "ad-image.jpg": { hash: "xxx" } } }
    const images = data.images as Record<string, { hash: string }>
    const firstImage = Object.values(images)[0]
    if (!firstImage?.hash) return { success: false, error: 'No image hash returned' }

    return { success: true, data: { hash: firstImage.hash } }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[meta-marketing] uploadAdImage exception:', msg)
    return { success: false, error: msg }
  }
}

export async function uploadAdVideo(
  adAccountId: string,
  accessToken: string,
  videoUrl: string,
): Promise<MetaApiResult<{ id: string }>> {
  return metaPost(`/act_${adAccountId}/advideos`, {
    file_url: videoUrl,
  }, accessToken)
}

export async function getCampaignInsights(
  adAccountId: string,
  accessToken: string,
  campaignId: string,
): Promise<MetaApiResult> {
  return metaGet(`/${campaignId}/insights`, {
    fields: 'impressions,clicks,spend,cpc,cpm,actions,cost_per_action_type',
    date_preset: 'last_30d',
  }, accessToken)
}

export async function listCampaigns(
  adAccountId: string,
  accessToken: string,
): Promise<MetaApiResult> {
  const prefix = (process.env.META_CAMPAIGN_NAME_PREFIX || DEFAULT_CAMPAIGN_NAME_PREFIX).trim()
  return metaGet(`/act_${adAccountId}/campaigns`, {
    fields: 'id,name,status,objective,daily_budget,lifetime_budget,created_time,start_time,updated_time',
    limit: '50',
    ...(prefix ? { filtering: JSON.stringify([{ field: 'name', operator: 'CONTAIN', value: prefix }]) } : {}),
  }, accessToken)
}

// ---------------------------------------------------------------------------
// UTM & URL helpers
// ---------------------------------------------------------------------------

export function buildLandingUrl(convocatoriaCode: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_TENANT_URL || process.env.PAYLOAD_PUBLIC_SERVER_URL || 'https://akademate.com'
  return `${baseUrl.replace(/\/$/, '')}/p/convocatorias/${convocatoriaCode}`
}

export function buildUtmParams(campaignCode: string): string {
  return `utm_source=facebook&utm_medium=paid&utm_campaign=${encodeURIComponent(campaignCode)}`
}

export function buildCampaignName(
  category: string,
  season: string,
  campaignCode: string,
  prefix = process.env.META_CAMPAIGN_NAME_PREFIX || DEFAULT_CAMPAIGN_NAME_PREFIX,
): string {
  return applyCampaignNamePrefix(`${category} - ${season} - ${campaignCode}`, prefix)
}
