import { type NextRequest, NextResponse } from 'next/server'

/**
 * Public tracking endpoint for landing page views and lead captures.
 *
 * POST /api/track
 *
 * Body (page view):
 *   { path, slug, referrer, userAgent, timestamp }
 *
 * Body (lead capture):
 *   { type: 'lead', path, courseRunId, courseName, first_name, last_name, email, phone }
 *
 * This endpoint is intentionally public (no auth required).
 * It logs tracking data and optionally creates leads in Payload.
 */
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
            source: 'web',
            status: 'nuevo',
            course_interest: body.courseName || '',
            notes: `Landing page: ${body.path || ''} | CourseRun ID: ${body.courseRunId || ''}`,
            utm_source: 'landing',
            utm_medium: 'organic',
            utm_campaign: body.slug || '',
          },
        })

        console.log(`[track] Lead captured: ${body.email} for ${body.courseName}`)
      } catch (err) {
        // If Payload lead creation fails, log and continue
        console.error('[track] Failed to create lead:', err)
      }

      return NextResponse.json({ ok: true })
    }

    // Page view tracking — log only for now
    console.log(`[track] Page view: ${body.path} | referrer: ${body.referrer || 'direct'} | ${new Date().toISOString()}`)

    return NextResponse.json({ ok: true })
  } catch {
    // Silently accept malformed requests to avoid breaking tracking pixels
    return NextResponse.json({ ok: true })
  }
}
