import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { activateMetaAd } from '../_workflow'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const draftId = Number(body.draft_id)
    if (!Number.isInteger(draftId) || draftId <= 0) {
      return NextResponse.json({ success: false, error: { message: 'draft_id es obligatorio.' } }, { status: 400 })
    }
    const result = await activateMetaAd({ request, draftId })
    return NextResponse.json({ success: true, draft_id: draftId, data: { metaAdId: result.metaAdId, metaAds: result.metaAds, status: 'ACTIVE' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo activar el anuncio Meta.'
    const status = message === 'UNAUTHORIZED' ? 401 : 400
    return NextResponse.json({ success: false, error: { message } }, { status })
  }
}
