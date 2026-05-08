import { createHash } from 'node:crypto'
import { type NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

/**
 * Public tracking endpoint for landing page views and lead captures.
 *
 * POST /api/track
 *
 * Body (page view):
 *   { path, slug, referrer, userAgent, timestamp, event_id?, fbc?, fbp?, utm_source?, utm_medium?, utm_campaign?, meta_campaign_id?, campaign_id?, utm_id? }
 *
 * Body (lead capture):
 *   { type: 'lead', path, courseRunId, courseName, first_name, last_name, email, phone,
 *     event_id?, fbc?, fbp?, utm_source?, utm_medium?, utm_campaign? }
 *
 * Body (custom tracked event):
 *   { type: 'event', event_type: 'form_click' | 'form_submit', path, event_id?,
 *     referrer?, userAgent?, utm_source?, utm_medium?, utm_campaign?, meta_campaign_id?, campaign_id?, utm_id? }
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

type TrackEventType = 'page_view' | 'lead' | 'form_click' | 'form_submit'

const RESERVED_TENANT_SLUGS = new Set(['www', 'admin', 'app'])
const ALLOWED_CUSTOM_EVENT_TYPES = new Set<TrackEventType>(['form_click', 'form_submit'])
let trafficFallbackPool: Pool | null = null

function isDatabaseConnectionError(error: unknown): boolean {
  const anyError = error as any
  if (anyError?.code === 'ECONNREFUSED') return true
  if (anyError?.payloadInitError === true) return true
  if (Array.isArray(anyError?.errors) && anyError.errors.some(isDatabaseConnectionError)) return true
  if (Array.isArray(anyError?.aggregateErrors) && anyError.aggregateErrors.some(isDatabaseConnectionError)) return true
  const message = error instanceof Error ? error.message : String(error ?? '')
  return message.includes('cannot connect to Postgres') || message.includes('ECONNREFUSED')
}

function escapeSql(value: string): string {
  return value.replace(/'/g, "''")
}

function sanitizeString(input: unknown, maxLen = 255): string {
  if (typeof input !== 'string') return ''
  const trimmed = input.trim()
  if (!trimmed) return ''
  return trimmed.slice(0, maxLen)
}

function normalizeOptional(input: unknown, maxLen = 255): string | null {
  const normalized = sanitizeString(input, maxLen)
  return normalized || null
}

function inferSourceForm(pathLike: string): string {
  const path = pathLike.toLowerCase()
  if (path.includes('/convocatorias')) return 'preinscripcion_convocatoria'
  if (path.includes('/ciclos')) return 'preinscripcion_ciclo'
  if (path.includes('/landing/')) return 'landing_contact_form'
  if (path.includes('/contacto')) return 'contacto'
  return 'web_form'
}

function inferLeadType(pathLike: string): string {
  const path = pathLike.toLowerCase()
  if (path.includes('/convocatorias') || path.includes('/ciclos')) return 'inscripcion'
  return 'lead'
}

function inferCampaignCode(body: any): string | null {
  const explicit =
    normalizeOptional(body.campaign_code, 64) ||
    normalizeOptional(body.utm_campaign, 64) ||
    normalizeOptional(body.meta_campaign_id, 64)
  if (explicit) return explicit

  const slug = normalizeOptional(body.slug, 120)
  if (slug) return `slug:${slug}`.slice(0, 64)
  return null
}

function inferMetaCampaignId(body: any): string | null {
  return (
    normalizeOptional(body.meta_campaign_id, 64) ||
    normalizeOptional(body.campaign_id, 64) ||
    normalizeOptional(body.utm_id, 64)
  )
}

function normalizeLeadName(body: any): { firstName: string; lastName: string } {
  const providedFirst = sanitizeString(body.first_name, 100)
  const providedLast = sanitizeString(body.last_name, 100)
  if (providedFirst) return { firstName: providedFirst, lastName: providedLast || '-' }

  const fromName = sanitizeString(body.name, 200)
  if (fromName) {
    const parts = fromName.split(/\s+/).filter(Boolean)
    const firstName = parts[0] || 'Lead'
    const lastName = parts.slice(1).join(' ') || '-'
    return { firstName, lastName }
  }

  const email = sanitizeString(body.email, 255)
  const firstName = email.includes('@') ? email.split('@')[0] : 'Lead'
  return { firstName: firstName || 'Lead', lastName: '-' }
}

function normalizeSpanishPhone(raw: unknown): string {
  const input = sanitizeString(raw, 32)
  const digits = input.replace(/[^\d]/g, '')
  let normalized = digits
  if (normalized.startsWith('0034')) normalized = normalized.slice(4)
  if (normalized.startsWith('34')) normalized = normalized.slice(2)
  if (normalized.length >= 9) {
    const local = normalized.slice(0, 9)
    return `+34 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6, 9)}`
  }
  return '+34 000 000 000'
}

function hashUserAgent(userAgent: string): string {
  if (!userAgent) return ''
  return createHash('sha256').update(userAgent).digest('hex')
}

function getTrafficFallbackPool(): Pool | null {
  const connectionString = process.env.DATABASE_URL?.trim() || ''
  if (!connectionString) return null
  if (!trafficFallbackPool) {
    trafficFallbackPool = new Pool({
      connectionString,
      max: 2,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
    })
  }
  return trafficFallbackPool
}

async function resolveTenantIdFallback(pool: Pool, requestHost: string): Promise<number | null> {
  if (requestHost && requestHost !== 'localhost' && requestHost !== '127.0.0.1') {
    const byDomain = await pool.query(
      `
        SELECT id
        FROM tenants
        WHERE LOWER(domain) = LOWER($1)
        LIMIT 1
      `,
      [requestHost],
    )
    if (byDomain.rows[0]?.id) return Number(byDomain.rows[0].id)
  }

  const firstTenant = await pool.query(
    `
      SELECT id
      FROM tenants
      ORDER BY id ASC
      LIMIT 1
    `,
  )
  if (firstTenant.rows[0]?.id) return Number(firstTenant.rows[0].id)
  return null
}

async function ensureTrafficEventsTableFallback(pool: Pool): Promise<void> {
  await pool.query(`
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
      meta_campaign_id VARCHAR(64),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await pool.query(`
    ALTER TABLE traffic_events
    ADD COLUMN IF NOT EXISTS meta_campaign_id VARCHAR(64)
  `)

  await pool.query(`
    DROP INDEX IF EXISTS traffic_events_tenant_event_unique
  `)

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS traffic_events_tenant_event_unique
    ON traffic_events (tenant_id, event_id)
  `)
}

async function insertTrafficEventFallback(
  pool: Pool,
  tenantId: number,
  body: any,
  eventType: TrackEventType,
): Promise<void> {
  const eventId = sanitizeString(body?.event_id, 191) || null
  const path = sanitizeString(body?.path, 2048) || null
  const referrer = sanitizeString(body?.referrer, 2048) || null
  const userAgent = sanitizeString(body?.userAgent, 1024)
  const userAgentHash = userAgent ? hashUserAgent(userAgent) : null
  const utmSource = sanitizeString(body?.utm_source, 255) || null
  const utmMedium = sanitizeString(body?.utm_medium, 255) || null
  const utmCampaign = sanitizeString(body?.utm_campaign, 255) || null
  const metaCampaignId = sanitizeString(inferMetaCampaignId(body), 64) || null

  await pool.query(
    `
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
        meta_campaign_id,
        created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
      ON CONFLICT (tenant_id, event_id) DO NOTHING
    `,
    [tenantId, eventType, eventId, path, referrer, userAgentHash, utmSource, utmMedium, utmCampaign, metaCampaignId],
  )
}

async function persistTrafficEventFallback(request: NextRequest, body: any): Promise<void> {
  const eventType =
    body?.type === 'lead'
      ? 'lead'
      : body?.type === 'event'
      ? parseCustomEventType(body?.event_type)
      : ('page_view' as const)

  if (!eventType) return

  const pool = getTrafficFallbackPool()
  if (!pool) return

  const requestHost = normalizeHost(
    request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host,
  )
  const tenantId = await resolveTenantIdFallback(pool, requestHost)
  if (!tenantId) return

  await ensureTrafficEventsTableFallback(pool)
  await insertTrafficEventFallback(pool, tenantId, body, eventType)
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
  const drizzle = (payload as any).db?.drizzle || (payload as any).db?.pool

  if (requestHost && requestHost !== 'localhost' && requestHost !== '127.0.0.1') {
    try {
      const byDomain = await payload.find({
        collection: 'tenants',
        where: { domain: { equals: requestHost } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
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
            overrideAccess: true,
          })
          tenant = bySlug.docs?.[0] ?? null
        }
      }
    } catch {
      tenant = null
    }
  }

  if (!tenant && drizzle?.execute) {
    try {
      if (requestHost && requestHost !== 'localhost' && requestHost !== '127.0.0.1') {
        const byDomainRows = await drizzle.execute(`
          SELECT id, integrations_meta_pixel_id, integrations_meta_conversions_api_token
          FROM tenants
          WHERE LOWER(domain) = LOWER('${escapeSql(requestHost)}')
          LIMIT 1
        `)
        const byDomain = Array.isArray((byDomainRows as any)?.rows) ? (byDomainRows as any).rows[0] : null
        if (byDomain?.id) tenant = byDomain
      }

      if (!tenant) {
        const firstRows = await drizzle.execute(`
          SELECT id, integrations_meta_pixel_id, integrations_meta_conversions_api_token
          FROM tenants
          ORDER BY id ASC
          LIMIT 1
        `)
        const firstTenant = Array.isArray((firstRows as any)?.rows) ? (firstRows as any).rows[0] : null
        if (firstTenant?.id) tenant = firstTenant
      }
    } catch {
      tenant = null
    }
  }

  if (!tenant) {
    try {
      const tenants = await payload.find({ collection: 'tenants', limit: 1, depth: 0, overrideAccess: true })
      tenant = tenants.docs?.[0] ?? null
    } catch {
      tenant = null
    }
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
      meta_campaign_id VARCHAR(64),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await drizzle.execute(`
    ALTER TABLE traffic_events
    ADD COLUMN IF NOT EXISTS meta_campaign_id VARCHAR(64)
  `)

  await drizzle.execute(`
    DROP INDEX IF EXISTS traffic_events_tenant_event_unique
  `)

  await drizzle.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS traffic_events_tenant_event_unique
    ON traffic_events (tenant_id, event_id)
  `)

  await drizzle.execute(`
    CREATE INDEX IF NOT EXISTS traffic_events_tenant_created_idx
    ON traffic_events (tenant_id, created_at DESC)
  `)
}

function parseCustomEventType(value: unknown): TrackEventType | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  if (!ALLOWED_CUSTOM_EVENT_TYPES.has(normalized as TrackEventType)) return null
  return normalized as TrackEventType
}

async function insertTrafficEvent(payload: any, tenantId: number, body: any, eventType: TrackEventType) {
  const drizzle = (payload as any).db?.drizzle || (payload as any).db?.pool
  if (!drizzle?.execute) return

  const eventId = sanitizeString(body.event_id, 191)
  const path = sanitizeString(body.path, 2048)
  const referrer = sanitizeString(body.referrer, 2048)
  const userAgent = sanitizeString(body.userAgent, 1024)
  const utmSource = sanitizeString(body.utm_source, 255)
  const utmMedium = sanitizeString(body.utm_medium, 255)
  const utmCampaign = sanitizeString(body.utm_campaign, 255)
  const metaCampaignId = sanitizeString(inferMetaCampaignId(body), 64)

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
      meta_campaign_id,
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
      ${metaCampaignId ? `'${escapeSql(metaCampaignId)}'` : 'NULL'},
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
  let body: any = {}
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  try {
    const { getPayloadHMR } = await import('@payloadcms/next/utilities')
    const configPromise = (await import('@payload-config')).default
    const payload = await getPayloadHMR({ config: configPromise })
    const tenant = await resolveTenant(payload, request)

    if (!tenant) {
      console.error('[track] Could not resolve tenant via Payload context. Using SQL fallback.')
      try {
        await persistTrafficEventFallback(request, body)
      } catch (fallbackError) {
        console.error('[track] Fallback tracking pipeline failed after tenant resolution miss:', fallbackError)
      }
      return NextResponse.json({ ok: true })
    }

    await ensureTrafficEventsTable(payload)

    if (body.type === 'lead') {
      await insertTrafficEvent(payload, tenant.id, body, 'lead').catch(() => {})

      // Lead capture — try to create a lead in Payload
      try {
        const sourcePage = normalizeOptional(body.source_page, 2000) || normalizeOptional(body.path, 2000) || '/'
        const sourceForm = normalizeOptional(body.source_form, 120) || inferSourceForm(sourcePage)
        const leadType = normalizeOptional(body.lead_type, 32) || inferLeadType(sourcePage)
        const campaignCode = inferCampaignCode(body)
        const courseName = normalizeOptional(body.courseName, 255)
        const metaCampaignId =
          normalizeOptional(body.meta_campaign_id, 64) || normalizeOptional(body.campaign_id, 64) || null
        const adId = normalizeOptional(body.ad_id, 64)
        const adsetId = normalizeOptional(body.adset_id, 64)
        const fbc = normalizeOptional(body.fbc, 255)
        const fbp = normalizeOptional(body.fbp, 255)
        const fbclid = normalizeOptional(body.fbclid, 255)
        const sourceDetails = {
          source_form: sourceForm,
          source_page: sourcePage,
          path: normalizeOptional(body.path, 1024),
          slug: normalizeOptional(body.slug, 255),
          course_name: courseName,
          course_run_id: normalizeOptional(body.courseRunId, 64),
          utm_source: normalizeOptional(body.utm_source, 255),
          utm_medium: normalizeOptional(body.utm_medium, 255),
          utm_campaign: normalizeOptional(body.utm_campaign, 255),
          meta_campaign_id: metaCampaignId,
          ad_id: adId,
          adset_id: adsetId,
          fbc,
          fbp,
          fbclid,
          tracker: 'api_track_v2',
        }

        const names = normalizeLeadName(body)
        const created = await payload.create({
          collection: 'leads',
          overrideAccess: true,
          data: {
            first_name: names.firstName,
            last_name: names.lastName,
            email: body.email || '',
            phone: normalizeSpanishPhone(body.phone),
            status: 'new',
            tenant: tenant.id,
            utm_source: body.utm_source || undefined,
            utm_medium: body.utm_medium || undefined,
            utm_campaign: body.utm_campaign || undefined,
            message: courseName ? `Interes: ${courseName}` : undefined,
            gdpr_consent: true,
            privacy_policy_accepted: true,
            consent_timestamp: new Date().toISOString(),
          } as any,
        })

        // Persist optional attribution fields without hard-depending on schema shape.
        try {
          const drizzle = (payload as any).db?.drizzle || (payload as any).db?.pool
          if (drizzle?.execute) {
            const optionalColumns = [
              'source_form',
              'source_page',
              'lead_type',
              'campaign_code',
              'meta_campaign_id',
              'ad_id',
              'adset_id',
              'fbc',
              'fbp',
              'fbclid',
              'source_details',
              'callback_notes',
            ]
            const columnsRes = await drizzle.execute(`
              SELECT column_name
              FROM information_schema.columns
              WHERE table_name = 'leads'
                AND column_name IN (${optionalColumns.map((column) => `'${escapeSql(column)}'`).join(', ')})
            `)
            const rows = Array.isArray(columnsRes) ? columnsRes : (columnsRes?.rows ?? [])
            const existing = new Set(rows.map((row: any) => String(row?.column_name || '').trim()).filter(Boolean))

            const updates: string[] = []
            if (existing.has('source_form')) updates.push(`source_form = '${escapeSql(sourceForm)}'`)
            if (existing.has('source_page')) updates.push(`source_page = '${escapeSql(sourcePage)}'`)
            if (existing.has('lead_type')) updates.push(`lead_type = '${escapeSql(leadType)}'`)
            if (campaignCode && existing.has('campaign_code')) updates.push(`campaign_code = '${escapeSql(campaignCode)}'`)
            if (metaCampaignId && existing.has('meta_campaign_id')) updates.push(`meta_campaign_id = '${escapeSql(metaCampaignId)}'`)
            if (adId && existing.has('ad_id')) updates.push(`ad_id = '${escapeSql(adId)}'`)
            if (adsetId && existing.has('adset_id')) updates.push(`adset_id = '${escapeSql(adsetId)}'`)
            if (fbc && existing.has('fbc')) updates.push(`fbc = '${escapeSql(fbc)}'`)
            if (fbp && existing.has('fbp')) updates.push(`fbp = '${escapeSql(fbp)}'`)
            if (fbclid && existing.has('fbclid')) updates.push(`fbclid = '${escapeSql(fbclid)}'`)
            if (courseName && existing.has('callback_notes')) updates.push(`callback_notes = 'Interes: ${escapeSql(courseName)}'`)
            if (existing.has('source_details')) {
              updates.push(`source_details = '${escapeSql(JSON.stringify(sourceDetails))}'::jsonb`)
            }

            if (updates.length > 0) {
              await drizzle.execute(`UPDATE leads SET ${updates.join(', ')} WHERE id = ${Number(created.id)}`)
            }
          }
        } catch (trackingError) {
          console.error('[track] Failed to persist lead attribution fields:', trackingError)
        }

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

    if (body.type === 'event') {
      const eventType = parseCustomEventType(body.event_type)
      if (!eventType) return NextResponse.json({ ok: true })
      await insertTrafficEvent(payload, tenant.id, body, eventType)
      return NextResponse.json({ ok: true })
    }

    await insertTrafficEvent(payload, tenant.id, body, 'page_view')

    // Page view tracking — non-blocking logging
    console.log(
      `[track] Page view: ${body.path} | referrer: ${body.referrer || 'direct'} | ${new Date().toISOString()}`,
    )

    // Fire Meta CAPI PageView event (fire and forget)
    if (body.event_id) {
      fireCapiEvent(request, tenant, 'PageView', body.event_id, body).catch(() => {})
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (!isDatabaseConnectionError(error)) {
      console.error('[track] Primary tracking pipeline failed:', error)
    }
    try {
      await persistTrafficEventFallback(request, body)
    } catch (fallbackError) {
      if (!isDatabaseConnectionError(fallbackError)) {
        console.error('[track] Fallback tracking pipeline failed:', fallbackError)
      }
    }
    return NextResponse.json({ ok: true })
  }
}
