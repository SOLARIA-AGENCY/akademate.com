import { type NextRequest, NextResponse } from 'next/server'

/**
 * Public tracking endpoint for landing page views and lead captures.
 *
 * POST /api/track
 *
 * Body (page view):
 *   { path, slug, referrer, userAgent, timestamp, event_id?, fbc?, fbp? }
 *
 * Body (lead capture):
 *   { type: 'lead', path, courseRunId, courseName, first_name, last_name, email, phone,
 *     event_id?, fbc?, fbp?, utm_source?, utm_medium?, utm_campaign? }
 *
 * This endpoint is intentionally public (no auth required).
 * It logs tracking data and optionally creates leads in Payload.
 * When event_id is present, also fires Meta Conversions API events (dual tracking).
 */

async function fireCapiEvent(request: NextRequest, eventName: string, eventId: string, body: any) {
  const { sendMetaEvent } = await import('@/src/lib/meta-capi')
  const { getPayloadHMR } = await import('@payloadcms/next/utilities')
  const configPromise = (await import('@payload-config')).default
  const payload = await getPayloadHMR({ config: configPromise })

  const tenants = await payload.find({ collection: 'tenants', limit: 1, depth: 0 })
  const tenant = tenants.docs[0] as any
  const pixelId = tenant?.integrations?.metaPixelId
  const accessToken = tenant?.integrations?.metaConversionsApiToken

  if (!pixelId || !accessToken) return

  await sendMetaEvent({
    pixelId,
    accessToken,
    eventName,
    eventId,
    eventSourceUrl: body.path ? 'https://cepformacion.akademate.com' + body.path : '',
    userData: {
      email: body.email,
      phone: body.phone,
      firstName: body.first_name,
      lastName: body.last_name,
      clientIpAddress: request.headers.get('x-forwarded-for') || '',
      clientUserAgent: body.userAgent || request.headers.get('user-agent') || '',
      fbc: body.fbc,
      fbp: body.fbp,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.type === 'lead') {
      // Lead capture — try to create a lead in Payload
      try {
        const { getPayloadHMR } = await import('@payloadcms/next/utilities')
        const configPromise = (await import('@payload-config')).default
        const payload = await getPayloadHMR({ config: configPromise })

        await payload.create({
          collection: 'leads',
          data: {
            first_name: body.first_name || '',
            last_name: body.last_name || '',
            email: body.email || '',
            phone: body.phone || '',
            status: 'new',
          } as any,
        })

        console.log(`[track] Lead captured: ${body.email} for ${body.courseName}`)
      } catch (err) {
        // If Payload lead creation fails, log and continue
        console.error('[track] Failed to create lead:', err)
      }

      // Fire Meta CAPI Lead event (fire and forget)
      if (body.event_id) {
        fireCapiEvent(request, 'Lead', body.event_id, body).catch(() => {})
      }

      return NextResponse.json({ ok: true })
    }

    // Page view tracking — log only for now
    console.log(`[track] Page view: ${body.path} | referrer: ${body.referrer || 'direct'} | ${new Date().toISOString()}`)

    // Fire Meta CAPI PageView event (fire and forget)
    if (body.event_id) {
      fireCapiEvent(request, 'PageView', body.event_id, body).catch(() => {})
    }

    return NextResponse.json({ ok: true })
  } catch {
    // Silently accept malformed requests to avoid breaking tracking pixels
    return NextResponse.json({ ok: true })
  }
}
