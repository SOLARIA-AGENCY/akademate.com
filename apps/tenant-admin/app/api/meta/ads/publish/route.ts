import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { normalizeAdWorkflowBody, publishToMeta } from '../_workflow'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = normalizeAdWorkflowBody(await request.json())
    const result = await publishToMeta({ request, body })
    return NextResponse.json({
      success: true,
      draft_id: result.draftId,
      preview: result.preview,
      data: {
        metaCampaignId: result.metaCampaignId,
        metaAdSetId: result.metaAdSetId,
        metaCreativeId: result.metaCreativeId,
        metaAdId: result.metaAdId,
        metaAds: result.metaAds,
        status: 'PAUSED',
        adsManagerUrl: `https://adsmanager.facebook.com/adsmanager/manage/ads?act=${result.ctx.metaContext.meta.adAccountIdNormalized}&selected_ad_ids=${result.metaAdId}`,
      },
      source_health: result.ctx.health,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo publicar el anuncio Meta.'
    const status = message === 'UNAUTHORIZED' ? 401 : 400
    return NextResponse.json({ success: false, error: { message } }, { status })
  }
}
