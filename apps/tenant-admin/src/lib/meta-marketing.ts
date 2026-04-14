/**
 * Meta Marketing API Utility
 *
 * Wraps the Meta Graph API for programmatic campaign management.
 * Used by /api/meta/ads endpoint to create campaigns from Akademate.
 *
 * RULE: All campaigns MUST be prefixed "SOLARIA AGENCY - "
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

interface CreateAdSetParams {
  adAccountId: string
  accessToken: string
  campaignId: string
  name: string
  dailyBudget: number
  pixelId: string
  optimizationGoal?: string
  billingEvent?: string
  targeting: {
    geoLocations: { regions: Array<{ key: string }> }
    ageMin?: number
    ageMax?: number
  }
  startTime?: string
  endTime?: string
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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function createCampaign(params: CreateCampaignParams): Promise<MetaApiResult<{ id: string }>> {
  // Enforce SOLARIA AGENCY prefix
  const name = params.name.startsWith('SOLARIA AGENCY')
    ? params.name
    : `SOLARIA AGENCY - ${params.name}`

  return metaPost(`/act_${params.adAccountId}/campaigns`, {
    name,
    objective: params.objective ?? 'OUTCOME_LEADS',
    status: params.status ?? 'PAUSED',
    special_ad_categories: params.specialAdCategories ?? [],
  }, params.accessToken)
}

export async function createAdSet(params: CreateAdSetParams): Promise<MetaApiResult<{ id: string }>> {
  return metaPost(`/act_${params.adAccountId}/adsets`, {
    campaign_id: params.campaignId,
    name: params.name,
    billing_event: params.billingEvent ?? 'IMPRESSIONS',
    optimization_goal: params.optimizationGoal ?? 'LEAD_GENERATION',
    daily_budget: params.dailyBudget,
    promoted_object: { pixel_id: params.pixelId },
    targeting: {
      geo_locations: {
        regions: params.targeting.geoLocations.regions,
      },
      age_min: params.targeting.ageMin ?? 18,
      age_max: params.targeting.ageMax ?? 65,
    },
    status: 'PAUSED',
    ...(params.startTime ? { start_time: params.startTime } : {}),
    ...(params.endTime ? { end_time: params.endTime } : {}),
  }, params.accessToken)
}

export async function createAdCreative(params: CreateAdCreativeParams): Promise<MetaApiResult<{ id: string }>> {
  const objectStorySpec: Record<string, unknown> = {
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

export async function createAd(params: CreateAdParams): Promise<MetaApiResult<{ id: string }>> {
  return metaPost(`/act_${params.adAccountId}/ads`, {
    adset_id: params.adSetId,
    name: params.name,
    creative: { creative_id: params.creativeId },
    status: params.status ?? 'PAUSED',
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
  return metaGet(`/act_${adAccountId}/campaigns`, {
    fields: 'id,name,status,objective,daily_budget,lifetime_budget,created_time',
    limit: '50',
    filtering: JSON.stringify([{ field: 'name', operator: 'CONTAIN', value: 'SOLARIA AGENCY' }]),
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

export function buildCampaignName(category: string, season: string, campaignCode: string): string {
  return `SOLARIA AGENCY - ${category} - ${season} - ${campaignCode}`
}
