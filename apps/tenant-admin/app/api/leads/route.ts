import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getAuthenticatedUserContext } from './_lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const RESERVED_TENANT_SLUGS = new Set(['www', 'admin', 'app'])

function esc(s: string): string {
  return s.replace(/'/g, "''")
}

function normalizeWhatsAppPhone(raw?: string): string | null {
  if (!raw) return null
  const digits = raw.replace(/[^\d+]/g, '').replace(/\+/g, '')
  if (!digits) return null
  return digits.startsWith('34') ? digits : `34${digits}`
}

function toPositiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) return parseInt(value, 10)
  return null
}

function normalizeHost(rawHost: string | null | undefined): string {
  const firstHost = (rawHost ?? '').split(',')[0]?.trim().toLowerCase() ?? ''
  return firstHost.replace(/:\d+$/, '')
}

function hostLooksLikeCep(host: string): boolean {
  return /(^|\.)cepformacion(\.|$)/i.test(host) || host.includes('cep-formacion')
}

function toAbsoluteUrl(baseUrl: string, maybeRelative: string): string {
  if (!maybeRelative) return ''
  if (/^https?:\/\//i.test(maybeRelative)) return maybeRelative
  const base = baseUrl.replace(/\/$/, '')
  const path = maybeRelative.startsWith('/') ? maybeRelative : `/${maybeRelative}`
  return `${base}${path}`
}

function extractQueryParamFromUrl(rawUrl: unknown, param: string): string | null {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) return null
  try {
    const parsed = new URL(rawUrl)
    const value = parsed.searchParams.get(param)
    return value && value.trim() ? value.trim() : null
  } catch {
    return null
  }
}

function normalizeOptionalTrackingValue(value: unknown, maxLength = 255): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  if (!normalized) return null
  return normalized.slice(0, maxLength)
}

function parseBooleanLike(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1 ? true : value === 0 ? false : null
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  if (['1', 'true', 'yes', 'on', 'si', 'sí'].includes(normalized)) return true
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false
  return null
}

function inferIsTestLead(body: Record<string, unknown>): boolean {
  const explicit = parseBooleanLike(body.is_test)
  if (explicit !== null) return explicit

  const testEventCode = normalizeOptionalTrackingValue(body.test_event_code, 128)
  if (testEventCode) return true

  const email = String(body.email || '').toLowerCase()
  const firstName = String(body.first_name || body.name || '').toLowerCase()
  const lastName = String(body.last_name || '').toLowerCase()

  const emailLooksTest =
    email.includes('@tests.') ||
    email.includes('@test.') ||
    email.includes('+test@') ||
    /(^|[^a-z])(test|prueba|dummy)([^a-z]|$)/i.test(email)

  const nameLooksTest =
    /(test|tests|prueba|dummy|qa)/i.test(firstName) || /(test|tests|prueba|dummy|qa)/i.test(lastName)

  return emailLooksTest || nameLooksTest
}

async function resolveTenantForPublicLead(payload: any, request: NextRequest): Promise<Record<string, unknown> | null> {
  const requestHost = normalizeHost(
    request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host
  )

  if (requestHost && requestHost !== 'localhost' && requestHost !== '127.0.0.1') {
    try {
      const byDomain = await payload.find({
        collection: 'tenants',
        where: { domain: { equals: requestHost } },
        limit: 1,
        depth: 0,
      })
      if (Array.isArray(byDomain?.docs) && byDomain.docs[0]) {
        return byDomain.docs[0] as Record<string, unknown>
      }
    } catch {
      // Continue to slug fallback.
    }

    const hostParts = requestHost.split('.')
    const subdomain = hostParts.length >= 3 ? hostParts[0] : ''
    if (subdomain && !RESERVED_TENANT_SLUGS.has(subdomain)) {
      try {
        const bySlug = await payload.find({
          collection: 'tenants',
          where: { slug: { equals: subdomain } },
          limit: 1,
          depth: 0,
        })
        if (Array.isArray(bySlug?.docs) && bySlug.docs[0]) {
          return bySlug.docs[0] as Record<string, unknown>
        }
      } catch {
        // Continue to global fallback.
      }
    }
  }

  const fallback = await payload.find({
    collection: 'tenants',
    limit: 1,
    depth: 0,
  })

  return (fallback?.docs?.[0] as Record<string, unknown> | undefined) ?? null
}

async function hasColumn(drizzle: any, tableName: string, columnName: string): Promise<boolean> {
  try {
    const result = await drizzle.execute(`
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = '${esc(tableName)}'
        AND column_name = '${esc(columnName)}'
      LIMIT 1
    `)
    const rows = Array.isArray(result) ? result : (result?.rows ?? [])
    return rows.length > 0
  } catch {
    return false
  }
}

async function hasTable(drizzle: any, tableName: string): Promise<boolean> {
  try {
    const result = await drizzle.execute(`
      SELECT 1
      FROM information_schema.tables
      WHERE table_name = '${esc(tableName)}'
        AND table_schema = 'public'
      LIMIT 1
    `)
    const rows = Array.isArray(result) ? result : (result?.rows ?? [])
    return rows.length > 0
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const limit = Math.min(parseInt(searchParams.get('limit') ?? '25', 10), 200)
    const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10), 1)
    const status = searchParams.get('status') ?? searchParams.get('where[status][equals]')
    const search = searchParams.get('q')?.trim() ?? searchParams.get('search')?.trim()
    const leadType =
      searchParams.get('lead_type') ??
      searchParams.get('type') ??
      searchParams.get('where[lead_type][equals]')
    const enrollmentId = searchParams.get('enrollment_id') ?? searchParams.get('where[enrollment_id][equals]')
    const includeTests = ['1', 'true', 'yes'].includes((searchParams.get('include_tests') || '').toLowerCase())

    const payload = await getPayloadHMR({ config: configPromise })
    const drizzle = (payload as any).db?.drizzle || (payload as any).db?.pool

    const authSession = await getAuthenticatedUserContext(request, payload)
    if (!authSession) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (!drizzle?.execute) {
      // Fallback to Payload API if drizzle not available
      const where: Record<string, any> = {}
      if (authSession.tenantId) where.tenant = { equals: authSession.tenantId }
      if (status) where.status = { equals: status }

      const leads = await payload.find({
        collection: 'leads',
        limit,
        page,
        sort: '-createdAt',
        depth: 1,
        where: Object.keys(where).length > 0 ? where : undefined,
      })
      if (!leadType) {
        return NextResponse.json(leads)
      }

      const filteredDocs = leads.docs.filter((doc: any) => String(doc?.lead_type ?? '') === leadType)
      return NextResponse.json({
        ...leads,
        docs: filteredDocs,
        totalDocs: filteredDocs.length,
        totalPages: Math.ceil(filteredDocs.length / limit),
        hasNextPage: page * limit < filteredDocs.length,
      })
    }

    // Build WHERE clause
    const conditions: string[] = []
    if (authSession.tenantId) {
      conditions.push(`l.tenant_id = ${authSession.tenantId}`)
    }
    if (status) conditions.push(`l.status = '${esc(status)}'`)
    if (search) {
      const q = esc(search)
      conditions.push(`(l.first_name ILIKE '%${q}%' OR l.last_name ILIKE '%${q}%' OR l.email ILIKE '%${q}%' OR l.phone ILIKE '%${q}%')`)
    }

    const enrollmentIdColumnExists = enrollmentId ? await hasColumn(drizzle, 'leads', 'enrollment_id') : false
    if (enrollmentId && enrollmentIdColumnExists) {
      const enrollmentIdInt = toPositiveInt(enrollmentId)
      if (enrollmentIdInt) {
        conditions.push(`l.enrollment_id = ${enrollmentIdInt}`)
      }
    }

    const leadTypeColumnExists = leadType ? await hasColumn(drizzle, 'leads', 'lead_type') : false
    if (leadType && leadTypeColumnExists) {
      conditions.push(`l.lead_type = '${esc(leadType)}'`)
    }

    const isTestColumnExists = await hasColumn(drizzle, 'leads', 'is_test')
    if (isTestColumnExists && !includeTests) {
      conditions.push(`COALESCE(l.is_test, false) = false`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Count total
    const countRes = await drizzle.execute(`SELECT COUNT(*) as cnt FROM leads l ${whereClause}`)
    const countRows = Array.isArray(countRes) ? countRes : (countRes?.rows ?? [])
    const totalDocs = parseInt(countRows[0]?.cnt ?? '0')

    const offset = (page - 1) * limit

    // Base query for leads
    const leadsRes = await drizzle.execute(`SELECT * FROM leads l ${whereClause} ORDER BY CASE l.status WHEN 'new' THEN 0 WHEN 'contacted' THEN 1 WHEN 'following_up' THEN 2 WHEN 'interested' THEN 3 WHEN 'on_hold' THEN 4 WHEN 'enrolling' THEN 5 ELSE 6 END, l.created_at DESC LIMIT ${limit} OFFSET ${offset}`)
    const leadsRows = Array.isArray(leadsRes) ? leadsRes : (leadsRes?.rows ?? [])

    // Enrich with interaction data in bulk (prevents N+1 queries on large CRM datasets)
    let docs = leadsRows.map((row: any) => ({ ...row, lastInteractor: null, interactionCount: 0 }))
    const leadIds = leadsRows.map((row: any) => toPositiveInt(row?.id)).filter((id): id is number => id !== null)
    const leadInteractionsTableExists = leadIds.length > 0 ? await hasTable(drizzle, 'lead_interactions') : false

    if (leadInteractionsTableExists && leadIds.length > 0) {
      const leadIdsSql = leadIds.join(',')
      const interactionsTenantFilter = authSession.tenantId ? ` AND li.tenant_id = ${authSession.tenantId}` : ''

      try {
        const countRes = await drizzle.execute(
          `SELECT li.lead_id, COUNT(*) as cnt
           FROM lead_interactions li
           WHERE li.lead_id IN (${leadIdsSql})${interactionsTenantFilter}
           GROUP BY li.lead_id`,
        )
        const countRows = Array.isArray(countRes) ? countRes : (countRes?.rows ?? [])
        const interactionCountMap = new Map<number, number>()
        for (const row of countRows) {
          const leadId = toPositiveInt(row?.lead_id)
          if (leadId !== null) {
            interactionCountMap.set(leadId, parseInt(row?.cnt ?? '0'))
          }
        }

        const usersTableExists = await hasTable(drizzle, 'users')
        const usersFirstNameExists = usersTableExists ? await hasColumn(drizzle, 'users', 'first_name') : false

        const lastInteractionSql = usersFirstNameExists
          ? `SELECT DISTINCT ON (li.lead_id)
               li.lead_id,
               li.channel,
               li.created_at,
               u.first_name
             FROM lead_interactions li
             LEFT JOIN users u ON u.id = li.user_id
             WHERE li.lead_id IN (${leadIdsSql})${interactionsTenantFilter}
             ORDER BY li.lead_id, li.created_at DESC`
          : `SELECT DISTINCT ON (li.lead_id)
               li.lead_id,
               li.channel,
               li.created_at,
               NULL::text AS first_name
             FROM lead_interactions li
             WHERE li.lead_id IN (${leadIdsSql})${interactionsTenantFilter}
             ORDER BY li.lead_id, li.created_at DESC`

        const lastRes = await drizzle.execute(lastInteractionSql)
        const lastRows = Array.isArray(lastRes) ? lastRes : (lastRes?.rows ?? [])
        const lastInteractionMap = new Map<number, { name: string | null; channel: string | null; at: string | null }>()
        for (const row of lastRows) {
          const leadId = toPositiveInt(row?.lead_id)
          if (leadId !== null) {
            lastInteractionMap.set(leadId, {
              name: (typeof row?.first_name === 'string' && row.first_name.trim().length > 0) ? row.first_name : null,
              channel: typeof row?.channel === 'string' ? row.channel : null,
              at: typeof row?.created_at === 'string' ? row.created_at : null,
            })
          }
        }

        docs = leadsRows.map((row: any) => {
          const leadId = toPositiveInt(row?.id)
          const interactionCount = leadId !== null ? interactionCountMap.get(leadId) ?? 0 : 0
          const lastInteraction = leadId !== null ? lastInteractionMap.get(leadId) : undefined

          return {
            ...row,
            interactionCount,
            lastInteractor: lastInteraction
              ? {
                  name: lastInteraction.name ?? 'Sistema',
                  channel: lastInteraction.channel ?? 'system',
                  at: lastInteraction.at ?? row?.updated_at ?? row?.created_at ?? null,
                }
              : null,
          }
        })
      } catch {
        // Keep docs without interaction enrichment if joins fail in partial schemas.
      }
    }

    if (leadType && !leadTypeColumnExists) {
      docs = docs.filter((doc: any) => String(doc.lead_type ?? '') === leadType)
    }

    return NextResponse.json({
      docs,
      totalDocs: leadType && !leadTypeColumnExists ? docs.length : totalDocs,
      limit,
      page,
      totalPages: Math.ceil((leadType && !leadTypeColumnExists ? docs.length : totalDocs) / limit),
      hasNextPage: page * limit < (leadType && !leadTypeColumnExists ? docs.length : totalDocs),
      hasPrevPage: page > 1,
    })
  } catch (error) {
    console.error('[API][Leads] Failed to fetch leads:', error)
    return NextResponse.json({
      docs: [], totalDocs: 0, limit: 25, page: 1,
      totalPages: 0, hasNextPage: false, hasPrevPage: false,
      warning: 'Leads no disponibles temporalmente.',
    })
  }
}

// POST /api/leads — Create a new lead from public forms
export async function POST(request: NextRequest) {
  try {
    const body: Record<string, any> = await request.json()

    if (!body.email) {
      return NextResponse.json(
        { error: 'Email es obligatorio' },
        { status: 400 }
      )
    }

    const payload = await getPayloadHMR({ config: configPromise })
    const tenant = await resolveTenantForPublicLead(payload, request)
    const tenantIdRaw = tenant?.id
    const host = normalizeHost(
      request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host
    )
    const isCepTenant =
      hostLooksLikeCep(host) ||
      hostLooksLikeCep(String(tenant?.domain || '')) ||
      String(tenant?.slug || '').toLowerCase().includes('cep')
    const tenantIdNumeric =
      typeof tenantIdRaw === 'number'
        ? tenantIdRaw
        : typeof tenantIdRaw === 'string' && /^\d+$/.test(tenantIdRaw)
        ? parseInt(tenantIdRaw, 10)
        : 1
    const tenantDomain =
      (typeof tenant?.domain === 'string' && tenant.domain.trim()) || null
    const tenantBaseUrl =
      process.env.NEXT_PUBLIC_TENANT_URL?.trim() ||
      (tenantDomain ? `https://${tenantDomain}` : request.nextUrl.origin)
    const logoFallback = isCepTenant
      ? '/logos/cep-formacion-logo-rectangular.png'
      : '/logos/akademate-logo-official.png'
    const rawTenantLogoUrl =
      (typeof tenant?.branding_logo_url === 'string' && tenant.branding_logo_url.trim()) || logoFallback
    const academyName =
      (typeof tenant?.name === 'string' && tenant.name.trim()) ||
      (isCepTenant ? 'CEP Formación' : '') ||
      process.env.NEXT_PUBLIC_TENANT_NAME ||
      'Akademate'
    const tenantPrimaryColor =
      (typeof tenant?.branding_primary_color === 'string' && tenant.branding_primary_color.trim()) ||
      (isCepTenant ? '#f2014b' : '') ||
      process.env.NEXT_PUBLIC_TENANT_PRIMARY_COLOR ||
      '#0066CC'
    const tenantLogoUrl = toAbsoluteUrl(tenantBaseUrl, rawTenantLogoUrl)
    const contactEmail =
      (typeof tenant?.contact_email === 'string' && tenant.contact_email.trim()) ||
      (isCepTenant ? 'info@cepformacion.com' : '') ||
      process.env.SMTP_REPLY_TO ||
      'soporte@akademate.com'
    const contactPhone =
      (typeof tenant?.contact_phone === 'string' && tenant.contact_phone.trim()) || ''
    const websiteUrl =
      (typeof tenant?.contact_website === 'string' && tenant.contact_website.trim()) ||
      tenantBaseUrl
    const whatsappPhone = normalizeWhatsAppPhone(contactPhone)
    const sourcePage = normalizeOptionalTrackingValue(body.source_page, 2000)
    const metaCampaignId =
      normalizeOptionalTrackingValue(body.meta_campaign_id, 64) ||
      normalizeOptionalTrackingValue(body.campaign_id, 64) ||
      null
    const adId = normalizeOptionalTrackingValue(body.ad_id, 64)
    const adsetId = normalizeOptionalTrackingValue(body.adset_id, 64)
    const fbc = normalizeOptionalTrackingValue(body.fbc, 255)
    const fbp = normalizeOptionalTrackingValue(body.fbp, 255)
    const fbclid =
      normalizeOptionalTrackingValue(body.fbclid, 255) ||
      extractQueryParamFromUrl(sourcePage, 'fbclid')
    const isTestLead = inferIsTestLead(body)

    // Parse name into first/last
    const fullName = body.first_name || body.name || ''
    const nameParts = fullName.trim().split(/\s+/)
    const firstName = nameParts[0] || body.email.split('@')[0]
    const lastName = nameParts.slice(1).join(' ') || '-'

    // Normalize phone to Spanish format: +34 XXX XXX XXX
    let phone = (body.phone || '').replace(/\s+/g, '').replace(/^0+/, '')
    if (phone && !phone.startsWith('+34')) phone = phone.startsWith('34') ? `+${phone}` : `+34${phone}`
    // Format with spaces: +34 XXX XXX XXX
    if (phone.startsWith('+34') && phone.length >= 12) {
      const digits = phone.replace('+34', '')
      phone = `+34 ${digits.slice(0,3)} ${digits.slice(3,6)} ${digits.slice(6,9)}`
    }
    if (!phone || phone.length < 10) phone = '+34 000 000 000'

    // Build lead data — ONLY include fields that exist in the Leads collection
    const leadData: Record<string, unknown> = {
      email: body.email,
      first_name: firstName,
      last_name: lastName,
      phone,
      message: body.message || undefined,
      gdpr_consent: body.gdpr_consent ?? true,
      consent_timestamp: body.consent_timestamp || new Date().toISOString(),
      privacy_policy_accepted: true,
      status: 'new',
      lead_score: 0,
      utm_source: body.utm_source || undefined,
      utm_medium: body.utm_medium || undefined,
      utm_campaign: body.utm_campaign || undefined,
      utm_term: body.utm_term || undefined,
      utm_content: body.utm_content || undefined,
      priority: ['low','medium','high','urgent'].includes(body.priority) ? body.priority : (body.lead_type === 'inscripcion' ? 'high' : 'medium'),
      tenant: tenantIdNumeric,
    }

    // Remove undefined/null values to avoid Payload validation errors
    Object.keys(leadData).forEach(key => {
      if (leadData[key] === undefined || leadData[key] === null) delete leadData[key]
    })

    const created = await payload.create({
      collection: 'leads',
      data: leadData as any,
    })

    // Create real-time notification for the dashboard
    try {
      const leadName = `${firstName} ${lastName !== '-' ? lastName : ''}`.trim()
      const notifTitle = body.lead_type === 'inscripcion'
        ? `Nueva preinscripcion: ${leadName}`
        : `Nuevo lead: ${leadName}`
      const notifBody = body.notes
        ? body.notes.replace('Preinscripcion: ', '').replace('Interes: ', '')
        : (body.email || '')
      // Use drizzle's raw SQL execution
      const drizzle = (payload.db as any).drizzle || (payload.db as any).pool
      if (drizzle?.execute) {
        await drizzle.execute(`INSERT INTO notifications (type, title, body, link, tenant_id) VALUES ('new_lead', '${notifTitle.replace(/'/g, "''")}', '${notifBody.replace(/'/g, "''")}', '/leads/${created.id}', ${tenantIdNumeric})`)
      } else {
        // Fallback: try pool query
        const pool = (payload.db as any).pool
        if (pool?.query) {
          await pool.query(`INSERT INTO notifications (type, title, body, link, tenant_id) VALUES ('new_lead', $1, $2, $3, $4)`, [notifTitle, notifBody, `/leads/${created.id}`, tenantIdNumeric])
        }
      }
    } catch (notifErr) { console.error('[leads] Notification insert failed:', notifErr) }

    // Store extra tracking data in optional DB columns when present.
    try {
      const drizzle = (payload.db as any).drizzle || (payload.db as any).pool
      if (drizzle?.execute) {
        const optionalColumns = [
          'source_form',
          'source_page',
          'lead_type',
          'callback_notes',
          'campaign_code',
          'convocatoria_id',
          'cycle_id',
          'meta_campaign_id',
          'ad_id',
          'adset_id',
          'fbclid',
          'fbc',
          'fbp',
          'is_test',
          'source_details',
        ]
        const columnRowsRes = await drizzle.execute(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = 'leads'
            AND column_name IN (${optionalColumns.map((column) => `'${column}'`).join(', ')})
        `)
        const columnRows = Array.isArray(columnRowsRes) ? columnRowsRes : (columnRowsRes?.rows ?? [])
        const existingColumns = new Set(
          columnRows
            .map((row: any) => String(row?.column_name || '').trim())
            .filter((column: string) => column.length > 0),
        )

        const updates: string[] = []

        if (body.source_form && existingColumns.has('source_form')) {
          updates.push(`source_form = '${String(body.source_form).replace(/'/g, "''")}'`)
        }
        if (body.source_page && existingColumns.has('source_page')) {
          updates.push(`source_page = '${String(sourcePage || '').replace(/'/g, "''")}'`)
        }
        if (body.lead_type && existingColumns.has('lead_type')) {
          updates.push(`lead_type = '${String(body.lead_type).replace(/'/g, "''")}'`)
        }
        if (body.notes && existingColumns.has('callback_notes')) {
          updates.push(`callback_notes = '${String(body.notes).replace(/'/g, "''")}'`)
        }
        if (body.campaign_code && existingColumns.has('campaign_code')) {
          updates.push(`campaign_code = '${String(body.campaign_code).replace(/'/g, "''")}'`)
        }
        if (metaCampaignId && existingColumns.has('meta_campaign_id')) {
          updates.push(`meta_campaign_id = '${metaCampaignId.replace(/'/g, "''")}'`)
        }
        if (adId && existingColumns.has('ad_id')) {
          updates.push(`ad_id = '${adId.replace(/'/g, "''")}'`)
        }
        if (adsetId && existingColumns.has('adset_id')) {
          updates.push(`adset_id = '${adsetId.replace(/'/g, "''")}'`)
        }
        if (fbclid && existingColumns.has('fbclid')) {
          updates.push(`fbclid = '${fbclid.replace(/'/g, "''")}'`)
        }
        if (fbc && existingColumns.has('fbc')) {
          updates.push(`fbc = '${fbc.replace(/'/g, "''")}'`)
        }
        if (fbp && existingColumns.has('fbp')) {
          updates.push(`fbp = '${fbp.replace(/'/g, "''")}'`)
        }
        if (existingColumns.has('is_test')) {
          updates.push(`is_test = ${isTestLead ? 'true' : 'false'}`)
        }

        if (existingColumns.has('source_details')) {
          const sourceDetailsPayload = {
            source_form: normalizeOptionalTrackingValue(body.source_form, 120),
            source_page: sourcePage,
            utm_source: normalizeOptionalTrackingValue(body.utm_source, 255),
            utm_medium: normalizeOptionalTrackingValue(body.utm_medium, 255),
            utm_campaign: normalizeOptionalTrackingValue(body.utm_campaign, 255),
            utm_term: normalizeOptionalTrackingValue(body.utm_term, 255),
            utm_content: normalizeOptionalTrackingValue(body.utm_content, 255),
            fbclid,
            fbc,
            fbp,
            meta_campaign_id: metaCampaignId,
            ad_id: adId,
            adset_id: adsetId,
          }
          updates.push(`source_details = '${JSON.stringify(sourceDetailsPayload).replace(/'/g, "''")}'::jsonb`)
        }

        const convocatoriaId = toPositiveInt(body.convocatoria_id)
        if (convocatoriaId !== null && existingColumns.has('convocatoria_id')) {
          updates.push(`convocatoria_id = ${convocatoriaId}`)
        }

        const cycleId = toPositiveInt(body.cycle_id)
        if (cycleId !== null && existingColumns.has('cycle_id')) {
          updates.push(`cycle_id = ${cycleId}`)
        }

        if (updates.length > 0) {
          await drizzle.execute(`UPDATE leads SET ${updates.join(', ')} WHERE id = ${created.id}`)
        }
      }
    } catch {
      // Optional tracking fields must never block lead creation.
    }

    // Send confirmation email to the lead (non-blocking, via Brevo)
    try {
      const leadType = body.lead_type || 'informacion'
      const heroImages: Record<string, string> = {
        inscripcion: 'https://i.imgur.com/3URhTS6.png',   // Creemos en ti
        informacion: 'https://i.imgur.com/1ueas0V.png',   // El momento es ahora
        contacto: 'https://i.imgur.com/6MUQn8h.png',      // Poder de la actitud
      }
      const titles: Record<string, string> = {
        inscripcion: 'Tu preinscripcion ha sido recibida',
        informacion: 'Hemos recibido tu solicitud',
        contacto: 'Gracias por contactarnos',
      }
      const heroImage = heroImages[leadType] || heroImages.informacion
      const title = titles[leadType] || titles.informacion
      const courseName = body.notes?.replace('Preinscripcion: ', '').replace('Interes: ', '') || ''
      const whatsappUrl = whatsappPhone
        ? `https://wa.me/${whatsappPhone}?text=${encodeURIComponent('Hola, me gustaria recibir informacion sobre la oferta formativa.')}`
        : ''
      const phoneListItem = contactPhone
        ? `<li>Llamarnos al ${contactPhone}</li>`
        : ''
      const whatsappListItem = whatsappUrl
        ? '<li>Escribirnos por WhatsApp</li>'
        : ''
      const whatsappCta = whatsappUrl
        ? `<tr><td align="center" style="padding-bottom:10px;">
<a href="${whatsappUrl}" style="display:inline-block;background:#25D366;color:#fff;font-size:15px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;">Contactar por WhatsApp</a>
</td></tr>`
        : ''

      const emailHtml = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
<table width="100%" style="background:#f4f4f5;"><tr><td align="center" style="padding:40px 20px;">
<table width="600" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
<tr><td style="background:${tenantPrimaryColor};padding:28px;text-align:center;">
<table cellspacing="0" cellpadding="0" border="0" align="center"><tr><td align="center">
<table cellspacing="0" cellpadding="0" border="0"><tr>
<td width="80" height="80" align="center" valign="middle" style="background:#ffffff;border-radius:50%;width:80px;height:80px;">
<img src="${tenantLogoUrl}" alt="${academyName}" width="56" height="56" style="display:block;margin:0 auto;">
</td></tr></table></td></tr></table>
<p style="color:#fff;font-size:20px;font-weight:700;margin:14px 0 0;letter-spacing:1px;">${academyName}</p>
</td></tr>
<tr><td style="padding:0;"><img src="${heroImage}" alt="${academyName}" width="600" style="display:block;width:100%;height:auto;"></td></tr>
<tr><td style="padding:32px;">
<h1 style="font-size:22px;color:#111;margin:0 0 16px;">${title}</h1>
<p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 20px;">
Hola <strong>${firstName}</strong>, gracias por tu interes en <strong>${academyName}</strong>${courseName ? ` y en <strong>${courseName}</strong>` : ''}.
</p>
<p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 20px;">
Nuestro equipo revisara tu solicitud y te contactara en las proximas <strong>24-48 horas</strong> para darte toda la informacion que necesitas.
</p>
<table width="100%" style="background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;margin:0 0 20px;">
<tr><td style="padding:16px;">
<p style="font-size:14px;color:#166534;margin:0;font-weight:600;">Mientras tanto, puedes:</p>
<ul style="font-size:14px;color:#166534;margin:8px 0 0;padding-left:20px;">
<li>Visitar nuestra web para mas informacion</li>
${phoneListItem}
${whatsappListItem}
</ul>
</td></tr></table>
<table width="100%">
${whatsappCta}
<tr><td align="center">
<a href="${websiteUrl}" style="display:inline-block;background:${tenantPrimaryColor};color:#fff;font-size:15px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;">Ver oferta formativa</a>
</td></tr></table>
</td></tr>
<tr><td style="padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;">
<p style="font-size:12px;color:#9ca3af;margin:0;">${academyName} — Centro de Estudios Profesionales</p>
<p style="font-size:11px;color:#d1d5db;margin:4px 0 0;">Este email fue enviado automaticamente.</p>
</td></tr>
</table></td></tr></table></body></html>`

      // Send via Brevo SMTP (non-blocking)
      fetch(`${tenantBaseUrl}/api/email/send-welcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: firstName, email: body.email, password: '', role: '' }),
      }).catch(() => {})

      // Direct SMTP send for the custom lead confirmation (more reliable)
      const nodemailer = require('nodemailer')
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
        tls: { rejectUnauthorized: false },
      })
      transport.sendMail({
        from: process.env.SMTP_FROM || 'Akademate <noreply@akademate.com>',
        to: body.email,
        subject: `${academyName} — ${title}`,
        html: emailHtml,
        replyTo: contactEmail,
      }).catch((err: Error) => console.error('[leads] Email failed:', err.message))
    } catch { /* email is best-effort, don't block lead creation */ }

    return NextResponse.json(
      { success: true, id: created.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('[API][Leads] POST error:', error)
    return NextResponse.json(
      { error: 'No se pudo crear el lead' },
      { status: 500 }
    )
  }
}
