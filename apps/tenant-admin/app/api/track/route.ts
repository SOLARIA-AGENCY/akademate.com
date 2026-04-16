import { createHash } from 'node:crypto'
import { type NextRequest, NextResponse } from 'next/server'

/**
 * Public tracking endpoint for landing page views and lead captures.
 *
 * POST /api/track
 *
 * Body (page view):
 *   { path, slug, referrer, userAgent, timestamp, event_id?, fbc?, fbp?, utm_source?, utm_medium?, utm_campaign? }
 *
 * Body (lead capture):
 *   { type: 'lead', path, courseRunId, courseName, first_name, last_name, email, phone,
 *     event_id?, fbc?, fbp?, utm_source?, utm_medium?, utm_campaign? }
 *
 * This endpoint is intentionally public (no auth required).
 * It logs tracking data and optionally creates leads in Payload.
 * When event_id is present, also fires Meta Conversions API events (dual tracking).
 */

type TenantIntegrations = {
  metaPixelId?: string
  metaConversionsApiToken?: string
}

interface TenantInfo {
  id: number
  integrations: TenantIntegrations
}

const RESERVED_TENANT_SLUGS = new Set(['www', 'admin', 'app'])

function escapeSql(value: string): string {
  return value.replace(/'/g, "''")
}

function sanitizeString(input: unknown, maxLen = 255): string {
  if (typeof input !== 'string') return ''
  const trimmed = input.trim()
  if (!trimmed) return ''
  return trimmed.slice(0, maxLen)
}

function hashUserAgent(userAgent: string): string {
  if (!userAgent) return ''
  return createHash('sha256').update(userAgent).digest('hex')
}

function normalizeHost(rawHost: string | null | undefined): string {
  const firstHost = (rawHost ?? '').split(',')[0]?.trim().toLowerCase() ?? ''
  return firstHost.replace(/:\d+$/, '')
}

async function resolveTenant(payload: any, request: NextRequest): Promise<TenantInfo | null> {
  const requestHost = normalizeHost(
    request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host,
  )

  let tenant: any = null

  if (requestHost && requestHost !== 'localhost' && requestHost !== '127.0.0.1') {
    const byDomain = await payload.find({
      collection: 'tenants',
      where: { domain: { equals: requestHost } },
      limit: 1,
      depth: 0,
    })
    tenant = byDomain.docs?.[0] ?? null

    if (!tenant) {
      const hostParts = requestHost.split('.')
      const subdomain = hostParts.length >= 3 ? hostParts[0] : ''
      if (subdomain && !RESERVED_TENANT_SLUGS.has(subdomain)) {
        const bySlug = await payload.find({
          collection: 'tenants',
          where: { slug: { equals: subdomain } },
          limit: 1,
          depth: 0,
        })
        tenant = bySlug.docs?.[0] ?? null
      }
    }
  }

  if (!tenant) {
    const tenants = await payload.find({ collection: 'tenants', limit: 1, depth: 0 })
    tenant = tenants.docs?.[0] ?? null
  }

  if (!tenant?.id) return null

  const integrations: TenantIntegrations = {
    metaPixelId: tenant?.integrations_meta_pixel_id || '',
    metaConversionsApiToken: tenant?.integrations_meta_conversions_api_token || '',
  }

  return {
    id: Number(tenant.id),
    integrations,
  }
}

async function ensureTrafficEventsTable(payload: any) {
  const drizzle = (payload as any).db?.drizzle || (payload as any).db?.pool
  if (!drizzle?.execute) return

  await drizzle.execute(`
    CREATE TABLE IF NOT EXISTS traffic_events (
      id BIGSERIAL PRIMARY KEY,
      tenant_id INTEGER NOT NULL,
      event_type VARCHAR(32) NOT NULL,
      event_id VARCHAR(191),
      path TEXT,
      referrer TEXT,
      user_agent_hash VARCHAR(64),
      utm_source VARCHAR(255),
      utm_medium VARCHAR(255),
      utm_campaign VARCHAR(255),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await drizzle.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS traffic_events_tenant_event_unique
    ON traffic_events (tenant_id, event_id)
    WHERE event_id IS NOT NULL
  `)

  await drizzle.execute(`
    CREATE INDEX IF NOT EXISTS traffic_events_tenant_created_idx
    ON traffic_events (tenant_id, created_at DESC)
  `)
}

async function insertTrafficEvent(payload: any, tenantId: number, body: any, eventType: 'page_view' | 'lead') {
  const drizzle = (payload as any).db?.drizzle || (payload as any).db?.pool
  if (!drizzle?.execute) return

  const eventId = sanitizeString(body.event_id, 191)
  const path = sanitizeString(body.path, 2048)
  const referrer = sanitizeString(body.referrer, 2048)
  const userAgent = sanitizeString(body.userAgent, 1024)
  const utmSource = sanitizeString(body.utm_source, 255)
  const utmMedium = sanitizeString(body.utm_medium, 255)
  const utmCampaign = sanitizeString(body.utm_campaign, 255)

  const q = `
    INSERT INTO traffic_events (
      tenant_id,
      event_type,
      event_id,
      path,
      referrer,
      user_agent_hash,
      utm_source,
      utm_medium,
      utm_campaign,
      created_at
    ) VALUES (
      ${tenantId},
      '${escapeSql(eventType)}',
      ${eventId ? `'${escapeSql(eventId)}'` : 'NULL'},
      ${path ? `'${escapeSql(path)}'` : 'NULL'},
      ${referrer ? `'${escapeSql(referrer)}'` : 'NULL'},
      ${userAgent ? `'${escapeSql(hashUserAgent(userAgent))}'` : 'NULL'},
      ${utmSource ? `'${escapeSql(utmSource)}'` : 'NULL'},
      ${utmMedium ? `'${escapeSql(utmMedium)}'` : 'NULL'},
      ${utmCampaign ? `'${escapeSql(utmCampaign)}'` : 'NULL'},
      NOW()
    )
    ON CONFLICT (tenant_id, event_id) DO NOTHING
  `

  await drizzle.execute(q)
}

async function fireCapiEvent(
  request: NextRequest,
  tenant: TenantInfo,
  eventName: string,
  eventId: string,
  body: any,
) {
  const { sendMetaEvent } = await import('@/src/lib/meta-capi')

  const pixelId = tenant.integrations.metaPixelId || ''
  const accessToken = tenant.integrations.metaConversionsApiToken || ''
  if (!pixelId || !accessToken) return

  await sendMetaEvent({
    pixelId,
    accessToken,
    eventName,
    eventId,
    eventSourceUrl: body.path
      ? `${process.env.NEXT_PUBLIC_TENANT_URL?.trim() || request.nextUrl.origin}${body.path}`
      : '',
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

    const { getPayloadHMR } = await import('@payloadcms/next/utilities')
    const configPromise = (await import('@payload-config')).default
    const payload = await getPayloadHMR({ config: configPromise })
    const tenant = await resolveTenant(payload, request)

    if (!tenant) {
      return NextResponse.json({ ok: true })
    }

    await ensureTrafficEventsTable(payload)

    if (body.type === 'lead') {
      await insertTrafficEvent(payload, tenant.id, body, 'lead').catch(() => {})

      // Lead capture — try to create a lead in Payload
      try {
        await payload.create({
          collection: 'leads',
          data: {
            first_name: body.first_name || '',
            last_name: body.last_name || '',
            email: body.email || '',
            phone: body.phone || '',
            status: 'new',
            tenant: tenant.id,
            utm_source: body.utm_source || undefined,
            utm_medium: body.utm_medium || undefined,
            utm_campaign: body.utm_campaign || undefined,
          } as any,
        })

        console.log(`[track] Lead captured: ${body.email} for ${body.courseName}`)
      } catch (err) {
        // If Payload lead creation fails, log and continue
        console.error('[track] Failed to create lead:', err)
      }

      // Fire Meta CAPI Lead event (fire and forget)
      if (body.event_id) {
        fireCapiEvent(request, tenant, 'Lead', body.event_id, body).catch(() => {})
      }

      return NextResponse.json({ ok: true })
    }

    await insertTrafficEvent(payload, tenant.id, body, 'page_view').catch(() => {})

    // Page view tracking — non-blocking logging
    console.log(
      `[track] Page view: ${body.path} | referrer: ${body.referrer || 'direct'} | ${new Date().toISOString()}`,
    )

    // Fire Meta CAPI PageView event (fire and forget)
    if (body.event_id) {
      fireCapiEvent(request, tenant, 'PageView', body.event_id, body).catch(() => {})
    }

    return NextResponse.json({ ok: true })
  } catch {
    // Silently accept malformed requests to avoid breaking tracking pixels
    return NextResponse.json({ ok: true })
  }
}
