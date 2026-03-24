import { NextRequest, NextResponse } from 'next/server'
import { sendMetaEvent } from '@/src/lib/meta-capi'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { event_name, event_id, source_url, user_data, custom_data } = body

    if (!event_name || !event_id) {
      return NextResponse.json(
        { ok: false, error: 'event_name and event_id are required' },
        { status: 400 },
      )
    }

    // Read Meta config from tenant
    const { getPayloadHMR } = await import('@payloadcms/next/utilities')
    const configPromise = (await import('@payload-config')).default
    const payload = await getPayloadHMR({ config: configPromise })
    const tenants = await payload.find({ collection: 'tenants', limit: 1, depth: 0 })
    const tenant = tenants.docs[0] as any
    const pixelId = tenant?.integrations?.metaPixelId
    const accessToken = tenant?.integrations?.metaConversionsApiToken

    if (!pixelId || !accessToken) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    // Enrich user_data with server-side info
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      undefined
    const clientUserAgent = req.headers.get('user-agent') || undefined

    const enrichedUserData = {
      ...user_data,
      ...(clientIp && { clientIpAddress: clientIp }),
      ...(clientUserAgent && { clientUserAgent }),
    }

    const result = await sendMetaEvent({
      pixelId,
      accessToken,
      eventName: event_name,
      eventId: event_id,
      eventSourceUrl: source_url || '',
      userData: enrichedUserData,
      customData: custom_data,
    })

    return NextResponse.json({ ok: result.success })
  } catch (err) {
    // Never break tracking — silently succeed
    console.error('[api/meta/events]', err)
    return NextResponse.json({ ok: true })
  }
}
