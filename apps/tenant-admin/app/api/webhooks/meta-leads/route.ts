import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getTenantIntegrations } from '@/app/api/meta/_lib/integrations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const META_GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION || 'v25.0'

type MetaLeadgenPayload = {
  object?: string
  entry?: Array<{
    id?: string
    changes?: Array<{
      field?: string
      value?: {
        leadgen_id?: string
        ad_id?: string
        adgroup_id?: string
        campaign_id?: string
        form_id?: string
        created_time?: number
        page_id?: string
      }
    }>
  }>
}

type MetaLeadFieldData = { name?: string; values?: string[] }

function parseTenantId(input: string | null | undefined): string | null {
  if (!input) return null
  const normalized = input.trim()
  return normalized.length > 0 ? normalized : null
}

function toLeadFieldMap(fieldData: MetaLeadFieldData[] | undefined): Record<string, string> {
  const map: Record<string, string> = {}
  for (const field of fieldData ?? []) {
    const key = String(field?.name || '').trim().toLowerCase()
    const value = Array.isArray(field?.values) ? String(field.values[0] || '').trim() : ''
    if (!key || !value) continue
    map[key] = value
  }
  return map
}

function splitName(fullName: string, fallbackEmail: string): { firstName: string; lastName: string } {
  const normalized = fullName.trim()
  if (!normalized) {
    const localPart = fallbackEmail.split('@')[0] || 'Lead'
    return { firstName: localPart, lastName: '-' }
  }
  const pieces = normalized.split(/\s+/)
  return {
    firstName: pieces[0] || 'Lead',
    lastName: pieces.slice(1).join(' ') || '-',
  }
}

function normalizePhone(raw: string): string {
  let phone = raw.replace(/\s+/g, '').replace(/^0+/, '')
  if (phone && !phone.startsWith('+34')) phone = phone.startsWith('34') ? `+${phone}` : `+34${phone}`
  if (phone.startsWith('+34') && phone.length >= 12) {
    const digits = phone.replace('+34', '')
    phone = `+34 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`
  }
  if (!phone || phone.length < 10) return '+34 000 000 000'
  return phone
}

async function hasColumn(drizzle: any, tableName: string, columnName: string): Promise<boolean> {
  const result = await drizzle.execute(`
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = '${tableName.replace(/'/g, "''")}'
      AND column_name = '${columnName.replace(/'/g, "''")}'
    LIMIT 1
  `)
  const rows = Array.isArray(result) ? result : (result?.rows ?? [])
  return rows.length > 0
}

async function fetchMetaLead(leadgenId: string, accessToken: string): Promise<{
  id: string
  ad_id?: string
  adset_id?: string
  campaign_id?: string
  created_time?: string
  field_data?: MetaLeadFieldData[]
}> {
  const url = new URL(`https://graph.facebook.com/${META_GRAPH_API_VERSION}/${encodeURIComponent(leadgenId)}`)
  url.searchParams.set('fields', 'id,created_time,ad_id,adset_id,campaign_id,field_data')
  url.searchParams.set('access_token', accessToken)

  const response = await fetch(url.toString(), { cache: 'no-store' })
  const payload = await response.json()
  if (!response.ok || payload?.error) {
    throw new Error(payload?.error?.message || 'Meta lead fetch failed')
  }
  return payload
}

async function persistMetaLead(options: {
  payload: any
  tenantIdRaw: string
  leadgenId: string
  adId: string | null
  adsetId: string | null
  campaignId: string | null
  formId: string | null
  sourcePage: string
  fields: Record<string, string>
}): Promise<number | string> {
  const tenantIdParsed = /^\d+$/.test(options.tenantIdRaw) ? parseInt(options.tenantIdRaw, 10) : options.tenantIdRaw
  const email = options.fields.email || options.fields.contact_email || ''
  if (!email) throw new Error('Lead sin email utilizable')

  const fullName =
    options.fields.full_name ||
    options.fields.nombre_completo ||
    [options.fields.first_name, options.fields.last_name].filter(Boolean).join(' ').trim()
  const name = splitName(fullName, email)
  const phone = normalizePhone(options.fields.phone_number || options.fields.phone || options.fields.telefono || '')

  const created = await options.payload.create({
    collection: 'leads',
    data: {
      email,
      first_name: name.firstName,
      last_name: name.lastName,
      phone,
      gdpr_consent: true,
      privacy_policy_accepted: true,
      consent_timestamp: new Date().toISOString(),
      status: 'new',
      priority: 'high',
      tenant: tenantIdParsed,
      utm_source: options.fields.utm_source || 'facebook',
      utm_medium: options.fields.utm_medium || 'paid_social',
      utm_campaign: options.fields.utm_campaign || undefined,
      utm_term: options.fields.utm_term || undefined,
      utm_content: options.fields.utm_content || undefined,
    },
  })

  const drizzle = (options.payload.db as any).drizzle || (options.payload.db as any).pool
  if (drizzle?.execute) {
    const optionalColumns = [
      'source_form',
      'source_page',
      'lead_type',
      'meta_campaign_id',
      'ad_id',
      'adset_id',
      'fbclid',
      'fbc',
      'fbp',
      'is_test',
      'source_details',
    ]
    const existing = new Set<string>()
    for (const column of optionalColumns) {
      if (await hasColumn(drizzle, 'leads', column)) existing.add(column)
    }

    const updates: string[] = []
    const safe = (value: string) => value.replace(/'/g, "''")
    if (existing.has('source_form')) updates.push(`source_form = 'meta_lead_ads'`)
    if (existing.has('source_page')) updates.push(`source_page = '${safe(options.sourcePage)}'`)
    if (existing.has('lead_type')) updates.push(`lead_type = 'inscripcion'`)
    if (existing.has('meta_campaign_id') && options.campaignId) updates.push(`meta_campaign_id = '${safe(options.campaignId)}'`)
    if (existing.has('ad_id') && options.adId) updates.push(`ad_id = '${safe(options.adId)}'`)
    if (existing.has('adset_id') && options.adsetId) updates.push(`adset_id = '${safe(options.adsetId)}'`)
    if (existing.has('fbclid') && options.fields.fbclid) updates.push(`fbclid = '${safe(options.fields.fbclid)}'`)
    if (existing.has('fbc') && options.fields.fbc) updates.push(`fbc = '${safe(options.fields.fbc)}'`)
    if (existing.has('fbp') && options.fields.fbp) updates.push(`fbp = '${safe(options.fields.fbp)}'`)
    if (existing.has('is_test')) updates.push(`is_test = false`)
    if (existing.has('source_details')) {
      const sourceDetails = {
        leadgen_id: options.leadgenId,
        campaign_id: options.campaignId,
        ad_id: options.adId,
        adset_id: options.adsetId,
        form_id: options.formId,
        field_data: options.fields,
      }
      updates.push(`source_details = '${safe(JSON.stringify(sourceDetails))}'::jsonb`)
    }
    if (updates.length > 0) {
      await drizzle.execute(`UPDATE leads SET ${updates.join(', ')} WHERE id = ${created.id}`)
    }
  }

  return created.id
}

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('hub.mode')
  const token = request.nextUrl.searchParams.get('hub.verify_token')
  const challenge = request.nextUrl.searchParams.get('hub.challenge')
  const verifyToken = process.env.META_LEADS_VERIFY_TOKEN || ''

  if (mode === 'subscribe' && token && challenge && verifyToken && token === verifyToken) {
    return new Response(challenge, { status: 200 })
  }

  return NextResponse.json({ ok: false, error: 'Webhook verification failed' }, { status: 403 })
}

export async function POST(request: NextRequest) {
  try {
    const tenantIdRaw =
      parseTenantId(request.nextUrl.searchParams.get('tenantId')) ||
      parseTenantId(process.env.DEFAULT_TENANT_ID)
    if (!tenantIdRaw) {
      return NextResponse.json({ ok: false, error: 'tenantId requerido en query o DEFAULT_TENANT_ID' }, { status: 400 })
    }

    const integrations = await getTenantIntegrations(tenantIdRaw)
    const accessToken = integrations?.metaMarketingApiToken || ''
    if (!accessToken) {
      return NextResponse.json({ ok: false, error: 'Meta Marketing API token no configurado para el tenant' }, { status: 400 })
    }

    const payload = await getPayload({ config: configPromise })
    const body = (await request.json()) as MetaLeadgenPayload
    const changes = body.entry?.flatMap((entry) => entry.changes ?? []) ?? []
    const leadChanges = changes.filter((change) => String(change.field || '').toLowerCase() === 'leadgen')

    const results: Array<{ leadgen_id: string; created: boolean; lead_id?: number | string; error?: string }> = []
    for (const change of leadChanges) {
      const value = change.value
      const leadgenId = String(value?.leadgen_id || '').trim()
      if (!leadgenId) continue

      try {
        const metaLead = await fetchMetaLead(leadgenId, accessToken)
        const fields = toLeadFieldMap(metaLead.field_data)
        const sourcePage = fields.source_page || fields.url || `meta://leadgen/${leadgenId}`
        const leadId = await persistMetaLead({
          payload,
          tenantIdRaw,
          leadgenId,
          adId: value?.ad_id || metaLead.ad_id || null,
          adsetId: value?.adgroup_id || metaLead.adset_id || null,
          campaignId: value?.campaign_id || metaLead.campaign_id || null,
          formId: value?.form_id || null,
          sourcePage,
          fields,
        })
        results.push({ leadgen_id: leadgenId, created: true, lead_id: leadId })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'unknown error'
        results.push({ leadgen_id: leadgenId, created: false, error: message })
      }
    }

    return NextResponse.json({
      ok: true,
      processed: leadChanges.length,
      created: results.filter((item) => item.created).length,
      failed: results.filter((item) => !item.created).length,
      results,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
