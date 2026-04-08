import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createCampaign,
  createAdSet,
  createAdCreative,
  createAd,
  uploadAdImage,
  getCampaignInsights,
  listCampaigns,
  buildLandingUrl,
  buildUtmParams,
  buildCampaignName,
} from '@/src/lib/meta-marketing'

// ---------------------------------------------------------------------------
// Mock fetch globally
// ---------------------------------------------------------------------------

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => {
  vi.restoreAllMocks()
  vi.stubGlobal('fetch', mockFetch)
  mockFetch.mockReset()
})

// ---------------------------------------------------------------------------
// Helper to create a mock response
// ---------------------------------------------------------------------------

function mockResponse(data: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => data,
  }
}

// ---------------------------------------------------------------------------
// createCampaign
// ---------------------------------------------------------------------------

describe('createCampaign', () => {
  const baseParams = {
    adAccountId: '123456',
    accessToken: 'test-token',
    name: 'Test Campaign',
  }

  it('creates a campaign with SOLARIA AGENCY prefix when missing', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: 'camp_123' }))

    const result = await createCampaign(baseParams)

    expect(result.success).toBe(true)
    expect(result.data?.id).toBe('camp_123')

    // Verify the request
    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe('https://graph.facebook.com/v21.0/act_123456/campaigns')
    expect(options.method).toBe('POST')

    const body = new URLSearchParams(options.body)
    expect(body.get('name')).toBe('SOLARIA AGENCY - Test Campaign')
    expect(body.get('objective')).toBe('OUTCOME_LEADS')
    expect(body.get('status')).toBe('PAUSED')
    expect(body.get('access_token')).toBe('test-token')
  })

  it('keeps existing SOLARIA AGENCY prefix', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: 'camp_456' }))

    await createCampaign({
      ...baseParams,
      name: 'SOLARIA AGENCY - My Campaign',
    })

    const body = new URLSearchParams(mockFetch.mock.calls[0][1].body)
    expect(body.get('name')).toBe('SOLARIA AGENCY - My Campaign')
  })

  it('uses custom objective and status', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: 'camp_789' }))

    await createCampaign({
      ...baseParams,
      objective: 'OUTCOME_TRAFFIC',
      status: 'ACTIVE',
    })

    const body = new URLSearchParams(mockFetch.mock.calls[0][1].body)
    expect(body.get('objective')).toBe('OUTCOME_TRAFFIC')
    expect(body.get('status')).toBe('ACTIVE')
  })

  it('passes special_ad_categories', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: 'camp_abc' }))

    await createCampaign({
      ...baseParams,
      specialAdCategories: ['EMPLOYMENT'],
    })

    const body = new URLSearchParams(mockFetch.mock.calls[0][1].body)
    expect(body.get('special_ad_categories')).toBe('["EMPLOYMENT"]')
  })

  it('returns error on API failure', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ error: { message: 'Invalid token' } }, false, 401),
    )

    const result = await createCampaign(baseParams)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid token')
  })

  it('returns error on network exception', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network down'))

    const result = await createCampaign(baseParams)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Network down')
  })

  it('handles non-Error exceptions', async () => {
    mockFetch.mockRejectedValueOnce('string error')

    const result = await createCampaign(baseParams)

    expect(result.success).toBe(false)
    expect(result.error).toBe('string error')
  })

  it('handles API response with error field but ok=true', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ error: { message: 'Partial error' } }, true),
    )

    const result = await createCampaign(baseParams)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Partial error')
  })
})

// ---------------------------------------------------------------------------
// createAdSet
// ---------------------------------------------------------------------------

describe('createAdSet', () => {
  const baseParams = {
    adAccountId: '123456',
    accessToken: 'test-token',
    campaignId: 'camp_123',
    name: 'Test AdSet',
    dailyBudget: 2500,
    pixelId: 'pixel_789',
    targeting: {
      geoLocations: { regions: [{ key: '3872' }] },
    },
  }

  it('creates an ad set with correct parameters', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: 'adset_123' }))

    const result = await createAdSet(baseParams)

    expect(result.success).toBe(true)
    expect(result.data?.id).toBe('adset_123')

    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe('https://graph.facebook.com/v21.0/act_123456/adsets')

    const body = new URLSearchParams(options.body)
    expect(body.get('campaign_id')).toBe('camp_123')
    expect(body.get('billing_event')).toBe('IMPRESSIONS')
    expect(body.get('optimization_goal')).toBe('LEAD_GENERATION')
    expect(body.get('daily_budget')).toBe('2500')
    expect(body.get('status')).toBe('PAUSED')
  })

  it('uses default age range 18-65', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: 'adset_456' }))

    await createAdSet(baseParams)

    const body = new URLSearchParams(mockFetch.mock.calls[0][1].body)
    const targeting = JSON.parse(body.get('targeting')!)
    expect(targeting.age_min).toBe(18)
    expect(targeting.age_max).toBe(65)
  })

  it('respects custom age range', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: 'adset_789' }))

    await createAdSet({
      ...baseParams,
      targeting: {
        geoLocations: { regions: [{ key: '3872' }] },
        ageMin: 25,
        ageMax: 45,
      },
    })

    const body = new URLSearchParams(mockFetch.mock.calls[0][1].body)
    const targeting = JSON.parse(body.get('targeting')!)
    expect(targeting.age_min).toBe(25)
    expect(targeting.age_max).toBe(45)
  })

  it('includes start_time and end_time when provided', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: 'adset_time' }))

    await createAdSet({
      ...baseParams,
      startTime: '2026-09-01T00:00:00',
      endTime: '2026-12-31T23:59:59',
    })

    const body = new URLSearchParams(mockFetch.mock.calls[0][1].body)
    expect(body.get('start_time')).toBe('2026-09-01T00:00:00')
    expect(body.get('end_time')).toBe('2026-12-31T23:59:59')
  })

  it('omits start_time and end_time when not provided', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: 'adset_notime' }))

    await createAdSet(baseParams)

    const body = new URLSearchParams(mockFetch.mock.calls[0][1].body)
    expect(body.has('start_time')).toBe(false)
    expect(body.has('end_time')).toBe(false)
  })

  it('passes promoted_object with pixel_id', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: 'adset_pixel' }))

    await createAdSet(baseParams)

    const body = new URLSearchParams(mockFetch.mock.calls[0][1].body)
    const promotedObject = JSON.parse(body.get('promoted_object')!)
    expect(promotedObject.pixel_id).toBe('pixel_789')
  })

  it('returns error on failure', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ error: { message: 'Invalid campaign ID' } }, false),
    )

    const result = await createAdSet(baseParams)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid campaign ID')
  })
})

// ---------------------------------------------------------------------------
// createAdCreative
// ---------------------------------------------------------------------------

describe('createAdCreative', () => {
  const baseParams = {
    adAccountId: '123456',
    accessToken: 'test-token',
    name: 'Creative Test',
    pageId: 'page_123',
    headline: 'Test Headline',
    body: 'Test body text',
    description: 'Test description',
    linkUrl: 'https://example.com',
  }

  it('creates a creative with correct object_story_spec', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: 'creative_123' }))

    const result = await createAdCreative(baseParams)

    expect(result.success).toBe(true)
    expect(result.data?.id).toBe('creative_123')

    const body = new URLSearchParams(mockFetch.mock.calls[0][1].body)
    const storySpec = JSON.parse(body.get('object_story_spec')!)
    expect(storySpec.page_id).toBe('page_123')
    expect(storySpec.link_data.link).toBe('https://example.com')
    expect(storySpec.link_data.message).toBe('Test body text')
    expect(storySpec.link_data.name).toBe('Test Headline')
    expect(storySpec.link_data.description).toBe('Test description')
    expect(storySpec.link_data.call_to_action.type).toBe('LEARN_MORE')
  })

  it('includes image_hash when provided', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: 'creative_img' }))

    await createAdCreative({
      ...baseParams,
      imageHash: 'abc123hash',
    })

    const body = new URLSearchParams(mockFetch.mock.calls[0][1].body)
    const storySpec = JSON.parse(body.get('object_story_spec')!)
    expect(storySpec.link_data.image_hash).toBe('abc123hash')
  })

  it('omits image_hash when not provided', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: 'creative_noimg' }))

    await createAdCreative(baseParams)

    const body = new URLSearchParams(mockFetch.mock.calls[0][1].body)
    const storySpec = JSON.parse(body.get('object_story_spec')!)
    expect(storySpec.link_data.image_hash).toBeUndefined()
  })

  it('includes url_tags when urlParameters provided', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: 'creative_utm' }))

    await createAdCreative({
      ...baseParams,
      urlParameters: 'utm_source=facebook&utm_medium=paid',
    })

    const body = new URLSearchParams(mockFetch.mock.calls[0][1].body)
    const storySpec = JSON.parse(body.get('object_story_spec')!)
    expect(storySpec.link_data.url_tags).toBe('utm_source=facebook&utm_medium=paid')
  })

  it('uses custom callToAction', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: 'creative_cta' }))

    await createAdCreative({
      ...baseParams,
      callToAction: 'SIGN_UP',
    })

    const body = new URLSearchParams(mockFetch.mock.calls[0][1].body)
    const storySpec = JSON.parse(body.get('object_story_spec')!)
    expect(storySpec.link_data.call_to_action.type).toBe('SIGN_UP')
  })
})

// ---------------------------------------------------------------------------
// createAd
// ---------------------------------------------------------------------------

describe('createAd', () => {
  const baseParams = {
    adAccountId: '123456',
    accessToken: 'test-token',
    adSetId: 'adset_123',
    name: 'AD-01 / Test',
    creativeId: 'creative_123',
  }

  it('creates an ad with PAUSED status by default', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: 'ad_123' }))

    const result = await createAd(baseParams)

    expect(result.success).toBe(true)
    expect(result.data?.id).toBe('ad_123')

    const body = new URLSearchParams(mockFetch.mock.calls[0][1].body)
    expect(body.get('adset_id')).toBe('adset_123')
    expect(body.get('name')).toBe('AD-01 / Test')
    expect(body.get('status')).toBe('PAUSED')

    const creative = JSON.parse(body.get('creative')!)
    expect(creative.creative_id).toBe('creative_123')
  })

  it('uses custom status', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: 'ad_active' }))

    await createAd({ ...baseParams, status: 'ACTIVE' })

    const body = new URLSearchParams(mockFetch.mock.calls[0][1].body)
    expect(body.get('status')).toBe('ACTIVE')
  })

  it('returns error on failure', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ error: { message: 'Creative not found' } }, false),
    )

    const result = await createAd(baseParams)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Creative not found')
  })
})

// ---------------------------------------------------------------------------
// uploadAdImage
// ---------------------------------------------------------------------------

describe('uploadAdImage', () => {
  it('uploads image and returns hash', async () => {
    // Mock image download
    const imageBlob = new Blob(['fake-image'], { type: 'image/jpeg' })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      blob: async () => imageBlob,
    })

    // Mock Meta API upload
    mockFetch.mockResolvedValueOnce(
      mockResponse({
        images: { 'ad-image.jpg': { hash: 'abc123hash' } },
      }),
    )

    const result = await uploadAdImage('123456', 'test-token', 'https://example.com/image.jpg')

    expect(result.success).toBe(true)
    expect(result.data?.hash).toBe('abc123hash')
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('returns error when image download fails', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })

    const result = await uploadAdImage('123456', 'test-token', 'https://example.com/bad.jpg')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Failed to download image')
  })

  it('returns error when Meta API returns error', async () => {
    const imageBlob = new Blob(['fake-image'], { type: 'image/jpeg' })
    mockFetch.mockResolvedValueOnce({ ok: true, blob: async () => imageBlob })
    mockFetch.mockResolvedValueOnce(
      mockResponse({ error: { message: 'Invalid image format' } }, false),
    )

    const result = await uploadAdImage('123456', 'test-token', 'https://example.com/image.jpg')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid image format')
  })

  it('returns error when no hash in response', async () => {
    const imageBlob = new Blob(['fake-image'], { type: 'image/jpeg' })
    mockFetch.mockResolvedValueOnce({ ok: true, blob: async () => imageBlob })
    mockFetch.mockResolvedValueOnce(mockResponse({ images: {} }))

    const result = await uploadAdImage('123456', 'test-token', 'https://example.com/image.jpg')

    expect(result.success).toBe(false)
    expect(result.error).toBe('No image hash returned')
  })

  it('handles network exception during upload', async () => {
    const imageBlob = new Blob(['fake-image'], { type: 'image/jpeg' })
    mockFetch.mockResolvedValueOnce({ ok: true, blob: async () => imageBlob })
    mockFetch.mockRejectedValueOnce(new Error('Upload timeout'))

    const result = await uploadAdImage('123456', 'test-token', 'https://example.com/image.jpg')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Upload timeout')
  })
})

// ---------------------------------------------------------------------------
// getCampaignInsights
// ---------------------------------------------------------------------------

describe('getCampaignInsights', () => {
  it('fetches insights with correct fields', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ data: [{ impressions: '1000', clicks: '50' }] }),
    )

    const result = await getCampaignInsights('123456', 'test-token', 'camp_123')

    expect(result.success).toBe(true)

    const url = new URL(mockFetch.mock.calls[0][0])
    expect(url.pathname).toBe('/v21.0/camp_123/insights')
    expect(url.searchParams.get('fields')).toContain('impressions')
    expect(url.searchParams.get('fields')).toContain('clicks')
    expect(url.searchParams.get('fields')).toContain('spend')
    expect(url.searchParams.get('date_preset')).toBe('last_30d')
    expect(url.searchParams.get('access_token')).toBe('test-token')
  })

  it('returns error on failure', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ error: { message: 'Rate limit' } }, false),
    )

    const result = await getCampaignInsights('123456', 'test-token', 'camp_123')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Rate limit')
  })
})

// ---------------------------------------------------------------------------
// listCampaigns
// ---------------------------------------------------------------------------

describe('listCampaigns', () => {
  it('lists campaigns with SOLARIA AGENCY filter', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ data: [{ id: 'camp_1', name: 'SOLARIA AGENCY - Test' }] }),
    )

    const result = await listCampaigns('123456', 'test-token')

    expect(result.success).toBe(true)

    const url = new URL(mockFetch.mock.calls[0][0])
    expect(url.pathname).toBe('/v21.0/act_123456/campaigns')
    expect(url.searchParams.get('limit')).toBe('50')

    const filtering = JSON.parse(url.searchParams.get('filtering')!)
    expect(filtering[0].field).toBe('name')
    expect(filtering[0].operator).toBe('CONTAIN')
    expect(filtering[0].value).toBe('SOLARIA AGENCY')
  })
})

// ---------------------------------------------------------------------------
// URL/UTM helpers
// ---------------------------------------------------------------------------

describe('buildLandingUrl', () => {
  const expectedBase = (
    process.env.NEXT_PUBLIC_TENANT_URL ||
    process.env.PAYLOAD_PUBLIC_SERVER_URL ||
    'https://akademate.com'
  ).replace(/\/$/, '')

  it('builds correct landing URL', () => {
    expect(buildLandingUrl('SC-2026-001')).toBe(
      `${expectedBase}/p/convocatorias/SC-2026-001`,
    )
  })

  it('handles special characters in code', () => {
    expect(buildLandingUrl('SC-2026-SPECIAL')).toBe(
      `${expectedBase}/p/convocatorias/SC-2026-SPECIAL`,
    )
  })
})

describe('buildUtmParams', () => {
  it('builds correct UTM parameters', () => {
    expect(buildUtmParams('SA-SC-SAN-FAR-2628-CIC-CAP26')).toBe(
      'utm_source=facebook&utm_medium=paid&utm_campaign=SA-SC-SAN-FAR-2628-CIC-CAP26',
    )
  })

  it('encodes special characters', () => {
    const result = buildUtmParams('CODE WITH SPACES')
    expect(result).toContain('utm_campaign=CODE%20WITH%20SPACES')
  })
})

describe('buildCampaignName', () => {
  it('builds correct campaign name', () => {
    expect(buildCampaignName('CICLOS FP', 'CAPTACION 2026', 'SA-SC-SAN-FAR-2628-CIC-CAP26')).toBe(
      'SOLARIA AGENCY - CICLOS FP - CAPTACION 2026 - SA-SC-SAN-FAR-2628-CIC-CAP26',
    )
  })
})
