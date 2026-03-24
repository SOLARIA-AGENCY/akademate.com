import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface LeadsWhere {
  status?: { equals: string }
  or?: Array<Record<string, { like: string }>>
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const limit = Math.min(parseInt(searchParams.get('limit') ?? '25', 10), 200)
    const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10), 1)
    const sort = searchParams.get('sort') ?? '-createdAt'
    const status = searchParams.get('status')
    const search = searchParams.get('q')?.trim()

    const where: LeadsWhere = {}

    if (status) {
      where.status = { equals: status }
    }

    if (search) {
      where.or = [
        { first_name: { like: search } },
        { last_name: { like: search } },
        { email: { like: search } },
        { phone: { like: search } },
      ]
    }

    const payload = await getPayloadHMR({ config: configPromise })
    const leads = await payload.find({
      collection: 'leads',
      where: Object.keys(where).length > 0 ? (where as unknown as Record<string, unknown>) : undefined,
      limit,
      page,
      sort,
      depth: 1,
    })

    return NextResponse.json(leads)
  } catch (error) {
    console.error('[API][Leads] Failed to fetch leads:', error)

    // Degrade gracefully to avoid breaking dashboard pages in partially migrated envs.
    return NextResponse.json({
      docs: [],
      totalDocs: 0,
      limit: 25,
      page: 1,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
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
      tenant: 1,
    }

    // Remove undefined/null values to avoid Payload validation errors
    Object.keys(leadData).forEach(key => {
      if (leadData[key] === undefined || leadData[key] === null) delete leadData[key]
    })

    const created = await payload.create({
      collection: 'leads',
      data: leadData as any,
    })

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
