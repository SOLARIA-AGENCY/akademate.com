import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { resolveMetaRequestContext } from '../../_lib/integrations'
import { checkMetaHealth } from '../../_lib/meta-graph'
import { uploadAdImage } from '../../../../../src/lib/meta-marketing'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function toPositiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) return parseInt(value, 10)
  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const mediaId = toPositiveInt(body.media_id)
    if (!mediaId) {
      return NextResponse.json({ success: false, error: { message: 'media_id es obligatorio.' } }, { status: 400 })
    }

    const metaContext = await resolveMetaRequestContext(request, request.nextUrl.searchParams.get('tenantId'))
    if (!metaContext.authenticated) {
      return NextResponse.json({ success: false, error: { message: 'Sesión no autenticada.' } }, { status: 401 })
    }

    const health = await checkMetaHealth({
      adAccountId: metaContext.meta.adAccountIdNormalized,
      accessToken: metaContext.meta.marketingApiToken,
      requireAdsManagement: true,
    })
    if (health.status !== 'ok') {
      return NextResponse.json({ success: false, error: health.error, source_health: health }, { status: 400 })
    }

    const payload = await getPayload({ config: configPromise })
    const media = await payload.findByID({ collection: 'media', id: mediaId })
    const mediaUrl = typeof (media as any)?.url === 'string' ? (media as any).url : ''
    if (!mediaUrl) {
      return NextResponse.json({ success: false, error: { message: 'El media no tiene URL pública.' } }, { status: 400 })
    }

    const absoluteUrl = mediaUrl.startsWith('http') ? mediaUrl : `${request.nextUrl.origin}${mediaUrl}`
    const uploaded = await uploadAdImage(metaContext.meta.adAccountIdNormalized, metaContext.meta.marketingApiToken, absoluteUrl)
    if (!uploaded.success) {
      return NextResponse.json({ success: false, error: { message: uploaded.error || 'No se pudo subir imagen a Meta.' } }, { status: 502 })
    }

    return NextResponse.json({ success: true, data: { media_id: mediaId, image_hash: uploaded.data?.hash, source_url: absoluteUrl }, source_health: health })
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: error instanceof Error ? error.message : 'Error subiendo imagen a Meta.' } }, { status: 500 })
  }
}
