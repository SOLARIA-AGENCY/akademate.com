import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import {
  createCampaign,
  createAdSet,
  createAdCreative,
  createAd,
  uploadAdImage,
  buildLandingUrl,
  buildUtmParams,
  buildCampaignName,
} from '../../../../src/lib/meta-marketing'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreateCampaignBody {
  convocatoriaId: number
  campaignName?: string
  category?: string
  season?: string
  dailyBudget: number
  targetRegion?: string
  headlines: string[]
  descriptions: string[]
  primaryTexts: string[]
  imageMediaId?: number
}

// ---------------------------------------------------------------------------
// Meta config defaults (CEP Formacion)
// ---------------------------------------------------------------------------

const META_AD_ACCOUNT = process.env.META_AD_ACCOUNT_ID || '730494526974837'
const META_PAGE_ID = process.env.META_PAGE_ID || '174953792552373'
const META_PIXEL_ID = process.env.META_PIXEL_ID || '1189071876088388'
const META_REGION_TENERIFE = '3872'

// ---------------------------------------------------------------------------
// POST /api/meta/ads — Create a full campaign in Meta (PAUSED)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateCampaignBody

    if (!body.convocatoriaId || !body.dailyBudget) {
      return NextResponse.json(
        { error: 'convocatoriaId and dailyBudget are required' },
        { status: 400 },
      )
    }

    if (!body.headlines?.length || !body.primaryTexts?.length) {
      return NextResponse.json(
        { error: 'At least 1 headline and 1 primaryText required' },
        { status: 400 },
      )
    }

    // 1. Get Marketing API token from tenant config
    const payload = await getPayloadHMR({ config: configPromise })
    let accessToken = ''

    try {
      const tenants = await payload.find({ collection: 'tenants', limit: 1 })
      const tenant = tenants.docs[0] as any
      const integrations = tenant?.branding?.integrations
      accessToken = integrations?.metaMarketingApiToken || process.env.META_MARKETING_API_TOKEN || ''
    } catch {
      accessToken = process.env.META_MARKETING_API_TOKEN || ''
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Meta Marketing API token not configured. Go to Configuracion > Integraciones.' },
        { status: 400 },
      )
    }

    // 2. Get convocatoria data
    const convocatoria = await payload.findByID({
      collection: 'course-runs',
      id: body.convocatoriaId,
      depth: 1,
    })

    if (!convocatoria) {
      return NextResponse.json({ error: 'Convocatoria not found' }, { status: 404 })
    }

    const campaignCode = (convocatoria as any).campaign_code || `CONV-${body.convocatoriaId}`
    const courseName = typeof (convocatoria as any).course === 'object'
      ? (convocatoria as any).course.name
      : `Curso ${body.convocatoriaId}`

    const landingUrl = buildLandingUrl(campaignCode)
    const utmParams = buildUtmParams(campaignCode)
    const region = body.targetRegion || META_REGION_TENERIFE

    // 3. Create Campaign (PAUSED)
    const campaignName = body.campaignName
      || buildCampaignName(
        body.category || 'CICLOS FP',
        body.season || `${new Date().getFullYear()}`,
        campaignCode,
      )

    const campaignResult = await createCampaign({
      adAccountId: META_AD_ACCOUNT,
      accessToken,
      name: campaignName,
    })

    if (!campaignResult.success) {
      return NextResponse.json(
        { error: `Failed to create campaign: ${campaignResult.error}` },
        { status: 502 },
      )
    }

    const metaCampaignId = campaignResult.data!.id

    // 4. Create Ad Set
    const adSetResult = await createAdSet({
      adAccountId: META_AD_ACCOUNT,
      accessToken,
      campaignId: metaCampaignId,
      name: `${courseName} / Tenerife`,
      dailyBudget: body.dailyBudget * 100, // Convert EUR to cents
      pixelId: META_PIXEL_ID,
      targeting: {
        geoLocations: { regions: [{ key: region }] },
      },
    })

    if (!adSetResult.success) {
      return NextResponse.json({
        error: `Campaign created (${metaCampaignId}) but ad set failed: ${adSetResult.error}`,
        metaCampaignId,
      }, { status: 502 })
    }

    const metaAdSetId = adSetResult.data!.id

    // 5. Upload image if provided
    let imageHash: string | undefined
    if (body.imageMediaId) {
      try {
        const media = await payload.findByID({ collection: 'media', id: body.imageMediaId })
        if (media && (media as any).url) {
          const imgResult = await uploadAdImage(
            META_AD_ACCOUNT,
            accessToken,
            `${process.env.NEXT_PUBLIC_TENANT_URL || 'https://cepformacion.akademate.com'}${(media as any).url}`,
          )
          if (imgResult.success) {
            imageHash = imgResult.data!.hash
          }
        }
      } catch {
        // Image upload is optional — continue without
      }
    }

    // 6. Create Ad Creative
    const creativeResult = await createAdCreative({
      adAccountId: META_AD_ACCOUNT,
      accessToken,
      name: `Creative - ${courseName}`,
      pageId: META_PAGE_ID,
      imageHash,
      headline: body.headlines[0],
      body: body.primaryTexts[0],
      description: body.descriptions?.[0] || '',
      linkUrl: landingUrl,
      callToAction: 'LEARN_MORE',
      urlParameters: utmParams,
    })

    if (!creativeResult.success) {
      return NextResponse.json({
        error: `Campaign + AdSet created but creative failed: ${creativeResult.error}`,
        metaCampaignId,
        metaAdSetId,
      }, { status: 502 })
    }

    const metaCreativeId = creativeResult.data!.id

    // 7. Create Ad (PAUSED)
    const adResult = await createAd({
      adAccountId: META_AD_ACCOUNT,
      accessToken,
      adSetId: metaAdSetId,
      name: `AD-01 / ${courseName} / Feed`,
      creativeId: metaCreativeId,
    })

    if (!adResult.success) {
      return NextResponse.json({
        error: `Campaign + AdSet + Creative created but ad failed: ${adResult.error}`,
        metaCampaignId,
        metaAdSetId,
        metaCreativeId,
      }, { status: 502 })
    }

    const metaAdId = adResult.data!.id

    // 8. Return all Meta IDs
    return NextResponse.json({
      success: true,
      data: {
        metaCampaignId,
        metaAdSetId,
        metaCreativeId,
        metaAdId,
        campaignName,
        landingUrl,
        status: 'PAUSED',
        adsManagerUrl: `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${META_AD_ACCOUNT}&campaign_ids=${metaCampaignId}`,
      },
    })
  } catch (error) {
    console.error('[meta-ads] POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error creating Meta campaign' },
      { status: 500 },
    )
  }
}
