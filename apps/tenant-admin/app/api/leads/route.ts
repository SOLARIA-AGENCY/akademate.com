import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getAuthenticatedUserContext } from './_lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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
    const body = await request.json()

    if (!body.email) {
      return NextResponse.json(
        { error: 'Email es obligatorio' },
        { status: 400 }
      )
    }

    const payload = await getPayloadHMR({ config: configPromise })
    const tenantQuery = await payload.find({ collection: 'tenants', limit: 1, depth: 0 })
    const tenant = tenantQuery.docs[0] as unknown as Record<string, unknown> | undefined
    const tenantIdRaw = tenant?.id
    const tenantIdNumeric =
      typeof tenantIdRaw === 'number'
        ? tenantIdRaw
        : typeof tenantIdRaw === 'string' && /^\d+$/.test(tenantIdRaw)
        ? parseInt(tenantIdRaw, 10)
        : 1
    const academyName =
      (typeof tenant?.name === 'string' && tenant.name.trim()) ||
      process.env.NEXT_PUBLIC_TENANT_NAME ||
      'Akademate'
    const tenantPrimaryColor =
      (typeof tenant?.branding_primary_color === 'string' && tenant.branding_primary_color.trim()) ||
      process.env.NEXT_PUBLIC_TENANT_PRIMARY_COLOR ||
      '#0066CC'
    const tenantLogoUrl =
      (typeof tenant?.branding_logo_url === 'string' && tenant.branding_logo_url.trim()) ||
      `${process.env.NEXT_PUBLIC_TENANT_URL?.trim() || request.nextUrl.origin}/logos/akademate-logo-official.png`
    const tenantDomain =
      (typeof tenant?.domain === 'string' && tenant.domain.trim()) || null
    const tenantBaseUrl =
      process.env.NEXT_PUBLIC_TENANT_URL?.trim() ||
      (tenantDomain ? `https://${tenantDomain}` : request.nextUrl.origin)
    const contactEmail =
      (typeof tenant?.contact_email === 'string' && tenant.contact_email.trim()) ||
      process.env.SMTP_REPLY_TO ||
      'soporte@akademate.com'
    const contactPhone =
      (typeof tenant?.contact_phone === 'string' && tenant.contact_phone.trim()) || ''
    const websiteUrl =
      (typeof tenant?.contact_website === 'string' && tenant.contact_website.trim()) ||
      tenantBaseUrl
    const whatsappPhone = normalizeWhatsAppPhone(contactPhone)

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
      gdpr_consent: body.gdpr_consent ?? true,
      consent_timestamp: body.consent_timestamp || new Date().toISOString(),
      privacy_policy_accepted: true,
      status: 'new',
      lead_score: 0,
      utm_source: body.utm_source || undefined,
      utm_medium: body.utm_medium || undefined,
      utm_campaign: body.utm_campaign || undefined,
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

    // Store extra tracking data directly in DB (fields that Payload collection doesn't know about)
    try {
      const { db } = payload
      const extraFields: Record<string, string | null> = {}
      if (body.source_form) extraFields.source_form = body.source_form
      if (body.source_page) extraFields.source_page = body.source_page
      if (body.lead_type) extraFields.lead_type = body.lead_type
      if (body.message) extraFields.message = String(body.message)
      if (body.notes) extraFields.callback_notes = body.notes
      if (body.campaign_code) extraFields.campaign_code = body.campaign_code

      if (Object.keys(extraFields).length > 0) {
        const sets = Object.entries(extraFields).map(([k, v]) => `${k} = '${(v || '').replace(/'/g, "''")}'`).join(', ')
        await (db as any).execute({ raw: `UPDATE leads SET ${sets} WHERE id = ${created.id}` }).catch(() => {})
      }
    } catch { /* extra fields are optional */ }

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
