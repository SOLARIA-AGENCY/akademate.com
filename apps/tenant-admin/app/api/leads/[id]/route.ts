import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getAuthenticatedUserContext } from '../_lib/auth'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string }>
}

const ALLOWED_LEAD_STATUSES = new Set([
  'new',
  'contacted',
  'following_up',
  'interested',
  'on_hold',
  'enrolling',
  'enrolled',
  'not_interested',
  'unreachable',
  'discarded',
  // Legacy statuses (read/update compatibility)
  'qualified',
  'converted',
  'rejected',
  'spam',
])

const AUDIT_ROLES = new Set(['admin', 'gestor', 'marketing', 'asesor', 'lectura'])

function toPositiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) return parseInt(value, 10)
  return null
}

function esc(value: string): string {
  return value.replace(/'/g, "''")
}

function sqlStringOrNull(value: unknown): string {
  if (value === null || value === undefined) return 'NULL'
  const text = String(value).trim()
  if (!text) return 'NULL'
  return `'${esc(text)}'`
}

async function hasColumn(drizzle: any, tableName: string, columnName: string): Promise<boolean> {
  try {
    const result = await drizzle.execute(`
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = '${esc(tableName)}'
        AND column_name = '${esc(columnName)}'
      LIMIT 1
    `)
    const rows = Array.isArray(result) ? result : (result?.rows ?? [])
    return rows.length > 0
  } catch {
    return false
  }
}

function extractClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0]?.trim() || '127.0.0.1'
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return '127.0.0.1'
}

function buildLeadSnapshot(lead: any) {
  return {
    id: lead?.id ?? null,
    status: lead?.status ?? null,
    priority: lead?.priority ?? null,
    assigned_to: lead?.assigned_to ?? null,
    callback_notes: lead?.callback_notes ?? null,
    enrollment_id: lead?.enrollment_id ?? null,
  }
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function readNestedString(record: any, path: string[]): string | null {
  let current: any = record
  for (const key of path) {
    if (!current || typeof current !== 'object') return null
    current = current[key]
  }
  return typeof current === 'string' && current.trim().length > 0 ? current.trim() : null
}

function parseJsonObject(value: unknown): Record<string, unknown> | null {
  if (!value) return null
  if (typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      return null
    }
  }
  return null
}

function readFirstString(values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) return value.trim()
  }
  return null
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

function extractConvocatoriaCode(pathLike: string): string | null {
  const match = pathLike.match(/\/(?:p\/)?convocatorias\/([^/?#]+)/i)
  return match?.[1] || null
}

function normalizeLeadOrigin(
  lead: any,
  originRow?: Record<string, unknown> | null,
): Record<string, unknown> {
  const sourceDetails =
    parseJsonObject(originRow?.source_details) ||
    parseJsonObject(lead?.source_details) ||
    {}

  const sourcePage = readFirstString([
    originRow?.source_page,
    lead?.source_page,
    sourceDetails.source_page,
    sourceDetails.path,
  ])

  const sourceForm =
    readFirstString([
      originRow?.source_form,
      lead?.source_form,
      sourceDetails.source_form,
    ]) || (sourcePage ? inferSourceForm(sourcePage) : null)

  const leadType =
    readFirstString([
      originRow?.lead_type,
      lead?.lead_type,
      sourceDetails.lead_type,
    ]) || (sourcePage ? inferLeadType(sourcePage) : null)

  const campaignCode = readFirstString([
    originRow?.campaign_code,
    lead?.campaign_code,
    sourceDetails.campaign_code,
    sourceDetails.utm_campaign,
    lead?.utm_campaign,
    lead?.meta_campaign_id,
  ])

  return {
    source_form: sourceForm,
    source_page: sourcePage,
    lead_type: leadType,
    campaign_code: campaignCode,
    convocatoria_id: toPositiveInt(originRow?.convocatoria_id ?? lead?.convocatoria_id ?? sourceDetails.convocatoria_id),
    cycle_id: toPositiveInt(originRow?.cycle_id ?? lead?.cycle_id ?? sourceDetails.cycle_id),
    meta_campaign_id: readFirstString([
      originRow?.meta_campaign_id,
      lead?.meta_campaign_id,
      sourceDetails.meta_campaign_id,
    ]),
    utm_source: readFirstString([sourceDetails.utm_source, lead?.utm_source]),
    utm_medium: readFirstString([sourceDetails.utm_medium, lead?.utm_medium]),
    utm_campaign: readFirstString([sourceDetails.utm_campaign, lead?.utm_campaign]),
    utm_term: readFirstString([sourceDetails.utm_term, lead?.utm_term]),
    utm_content: readFirstString([sourceDetails.utm_content, lead?.utm_content]),
    fbc: readFirstString([sourceDetails.fbc, lead?.fbc]),
    fbp: readFirstString([sourceDetails.fbp, lead?.fbp]),
    fbclid: readFirstString([sourceDetails.fbclid, lead?.fbclid]),
    source_details: sourceDetails,
  }
}

async function readLeadOriginFromDB(
  drizzle: any,
  leadId: number,
  tenantId: number | null,
): Promise<Record<string, unknown> | null> {
  if (!drizzle?.execute) return null
  const tenantFilter = tenantId ? ` AND l.tenant_id = ${tenantId}` : ''
  const result = await drizzle.execute(`
    SELECT
      to_jsonb(l)->>'source_form' AS source_form,
      to_jsonb(l)->>'source_page' AS source_page,
      to_jsonb(l)->>'lead_type' AS lead_type,
      to_jsonb(l)->>'campaign_code' AS campaign_code,
      to_jsonb(l)->>'convocatoria_id' AS convocatoria_id,
      to_jsonb(l)->>'cycle_id' AS cycle_id,
      to_jsonb(l)->>'meta_campaign_id' AS meta_campaign_id,
      to_jsonb(l)->'source_details' AS source_details
    FROM leads l
    WHERE l.id = ${leadId}${tenantFilter}
    LIMIT 1
  `)
  const rows = Array.isArray(result) ? result : (result?.rows ?? [])
  return rows[0] ?? null
}

function extractFallbackProgramName(lead: any, origin: Record<string, unknown>): string | null {
  const sourceDetails = parseJsonObject(origin?.source_details) || {}
  return readFirstString([
    sourceDetails.course_name,
    sourceDetails.program_name,
    lead?.course_name,
    lead?.message,
    lead?.callback_notes,
    typeof lead?.notes === 'string' ? lead.notes : null,
  ])
}

async function resolveLeadProgramContext(
  payload: any,
  lead: any,
  origin: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  const sourceDetails = parseJsonObject(origin?.source_details) || {}
  const convocatoriaId =
    toPositiveInt(lead?.convocatoria_id) ||
    toPositiveInt(origin?.convocatoria_id) ||
    toPositiveInt(sourceDetails.convocatoria_id)
  const sourcePage = readFirstString([origin?.source_page, lead?.source_page, sourceDetails.source_page, sourceDetails.path]) || ''
  const convocatoriaCode = extractConvocatoriaCode(sourcePage)

  let courseRun: any = null

  if (convocatoriaId) {
    try {
      courseRun = await payload.findByID({
        collection: 'course-runs',
        id: convocatoriaId,
        depth: 2,
        overrideAccess: true,
      })
    } catch {
      courseRun = null
    }
  }

  if (!courseRun && convocatoriaCode) {
    try {
      const found = await payload.find({
        collection: 'course-runs',
        where: { codigo: { equals: convocatoriaCode } },
        limit: 1,
        depth: 2,
        overrideAccess: true,
      })
      courseRun = Array.isArray(found?.docs) ? found.docs[0] : null
    } catch {
      courseRun = null
    }
  }

  if (!courseRun) {
    const fallbackProgramName = extractFallbackProgramName(lead, origin)
    if (!fallbackProgramName) return null

    return {
      source: convocatoriaId ? 'convocatoria_id' : convocatoriaCode ? 'source_page_codigo' : 'source_details',
      convocatoria_id: convocatoriaId ?? null,
      convocatoria_codigo: convocatoriaCode,
      name: fallbackProgramName,
      course_name: fallbackProgramName,
      cycle_name: readFirstString([sourceDetails.cycle_name]),
      campus_name: readFirstString([sourceDetails.campus_name]),
      modality: readFirstString([sourceDetails.modality]),
      schedule: readFirstString([sourceDetails.schedule]),
      class_frequency: readFirstString([sourceDetails.class_frequency]),
      total_hours: toNumberOrNull(sourceDetails.total_hours),
      practice_hours: toNumberOrNull(sourceDetails.practice_hours),
      start_date: readFirstString([sourceDetails.start_date]),
      price: toNumberOrNull(sourceDetails.price),
      financial_aid_available: Boolean(sourceDetails.financial_aid_available ?? false),
    }
  }

  const course = typeof courseRun?.course === 'object' && courseRun.course !== null ? courseRun.course : null
  const cycleFromRun = typeof courseRun?.cycle === 'object' && courseRun.cycle !== null ? courseRun.cycle : null
  const cycleFromCourse = typeof course?.cycle === 'object' && course?.cycle !== null ? course.cycle : null
  const cycle = cycleFromRun || cycleFromCourse
  const campus = typeof courseRun?.campus === 'object' && courseRun.campus !== null ? courseRun.campus : null

  const priceOverride = toNumberOrNull(courseRun?.price_override)
  const basePrice = toNumberOrNull(course?.base_price)
  const resolvedPrice = priceOverride ?? basePrice

  return {
    source: convocatoriaId ? 'convocatoria_id' : 'source_page_codigo',
    convocatoria_id: convocatoriaId ?? null,
    convocatoria_codigo: (typeof courseRun?.codigo === 'string' && courseRun.codigo.trim()) || convocatoriaCode,
    name:
      readNestedString(cycle, ['name']) ||
      readNestedString(course, ['title']) ||
      readNestedString(course, ['name']) ||
      null,
    course_name: readNestedString(course, ['name']) || readNestedString(course, ['title']),
    cycle_name: readNestedString(cycle, ['name']),
    campus_name: readNestedString(campus, ['name']),
    modality:
      readNestedString(cycle, ['duration', 'modality']) ||
      readNestedString(course, ['modality']) ||
      null,
    schedule: readNestedString(cycle, ['duration', 'schedule']) || null,
    class_frequency: readNestedString(cycle, ['duration', 'classFrequency']) || null,
    total_hours:
      toNumberOrNull((cycle as any)?.duration?.totalHours) ??
      toNumberOrNull(course?.duration_hours),
    practice_hours: toNumberOrNull((cycle as any)?.duration?.practiceHours),
    start_date: readNestedString(courseRun, ['start_date']),
    price: resolvedPrice,
    financial_aid_available: Boolean(
      courseRun?.financial_aid_available ?? course?.financial_aid_available ?? false,
    ),
  }
}

async function getUserAuditIdentity(payload: any, userId: string | number) {
  const user = await payload.findByID({
    collection: 'users',
    id: userId,
    depth: 0,
    overrideAccess: true,
  }).catch(() => null) as any

  const userEmail =
    typeof user?.email === 'string' && user.email.trim().length > 0
      ? user.email
      : `user-${String(userId)}@local.invalid`
  const roleCandidate = String(user?.role || '').trim().toLowerCase()
  const userRole = AUDIT_ROLES.has(roleCandidate) ? roleCandidate : 'admin'

  return {
    userId: String(userId),
    userEmail,
    userRole,
  }
}

async function createLeadAuditLog(args: {
  payload: any
  request: NextRequest
  userId: string | number
  action: 'update' | 'delete'
  leadId: string
  changes?: Record<string, unknown>
  status?: 'success' | 'failure' | 'blocked'
  errorMessage?: string
}) {
  try {
    const identity = await getUserAuditIdentity(args.payload, args.userId)
    await args.payload.create({
      collection: 'audit-logs',
      data: {
        action: args.action,
        collection_name: 'leads',
        document_id: String(args.leadId),
        user_id: identity.userId,
        user_email: identity.userEmail,
        user_role: identity.userRole,
        ip_address: extractClientIp(args.request),
        user_agent: args.request.headers.get('user-agent') || 'unknown',
        changes: args.changes,
        status: args.status || 'success',
        error_message: args.errorMessage || undefined,
      },
    })
  } catch (error) {
    console.error('[API][Leads] Failed to write audit-log entry:', error)
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const includeTests = ['1', 'true', 'yes'].includes((searchParams.get('include_tests') || '').toLowerCase())
    const payload = await getPayload({ config: configPromise })
    const drizzle = (payload as any).db?.drizzle || (payload as any).db?.pool
    const tenantId = (await getAuthenticatedUserContext(request, payload))?.tenantId ?? null
    if (tenantId === null) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const lead = await payload.findByID({ collection: 'leads', id, depth: 1 })

    const leadTenantId = toPositiveInt((lead as any)?.tenant_id ?? (lead as any)?.tenant?.id ?? (lead as any)?.tenant)
    if (leadTenantId && leadTenantId !== tenantId) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    if (!includeTests && drizzle?.execute) {
      const leadId = toPositiveInt(id)
      if (leadId) {
        const isTestColumnExists = await hasColumn(drizzle, 'leads', 'is_test')
        if (isTestColumnExists) {
          const checkRes = await drizzle.execute(
            `SELECT COALESCE(is_test, false) AS is_test FROM leads WHERE id = ${leadId} AND tenant_id = ${tenantId} LIMIT 1`,
          )
          const checkRows = Array.isArray(checkRes) ? checkRes : (checkRes?.rows ?? [])
          const isTestLead = checkRows[0]?.is_test === true
          if (isTestLead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
          }
        }
      }
    }

    const leadId = toPositiveInt(id)
    const originRow = leadId ? await readLeadOriginFromDB(drizzle, leadId, tenantId).catch(() => null) : null
    const leadOrigin = normalizeLeadOrigin(lead, originRow)
    const leadProgram = await resolveLeadProgramContext(payload, lead, leadOrigin).catch(() => null)

    const normalizedLead = {
      ...lead,
      source_form: (lead as any)?.source_form ?? leadOrigin.source_form,
      source_page: (lead as any)?.source_page ?? leadOrigin.source_page,
      lead_type: (lead as any)?.lead_type ?? leadOrigin.lead_type,
      campaign_code: (lead as any)?.campaign_code ?? leadOrigin.campaign_code,
      convocatoria_id: (lead as any)?.convocatoria_id ?? leadOrigin.convocatoria_id,
      cycle_id: (lead as any)?.cycle_id ?? leadOrigin.cycle_id,
      meta_campaign_id: (lead as any)?.meta_campaign_id ?? leadOrigin.meta_campaign_id,
      source_details: (lead as any)?.source_details ?? leadOrigin.source_details,
    }

    return NextResponse.json({
      ...normalizedLead,
      lead_origin: leadOrigin,
      lead_program: leadProgram,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const payload = await getPayload({ config: configPromise })
    const authUser = await getAuthenticatedUserContext(request, payload)
    const tenantId = authUser?.tenantId ?? null
    if (tenantId === null) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const lead = await payload.findByID({ collection: 'leads', id, depth: 0 }) as any
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const leadTenantId = toPositiveInt(lead?.tenant_id ?? lead?.tenant?.id ?? lead?.tenant)
    if (leadTenantId && leadTenantId !== tenantId) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Fields updatable via Payload
    const payloadFields = [
      'status',
      'priority',
      'assigned_to',
      'last_contacted_at',
      'converted_at',
      'preferred_contact_method',
      'preferred_contact_time',
      'source_details',
    ]
    const payloadData: Record<string, unknown> = {}
    for (const field of payloadFields) {
      if (body[field] !== undefined) payloadData[field] = body[field]
    }

    if (payloadData.status !== undefined && !ALLOWED_LEAD_STATUSES.has(String(payloadData.status))) {
      return NextResponse.json(
        { error: `Estado inválido "${String(payloadData.status)}"` },
        { status: 400 },
      )
    }

    if (Object.keys(payloadData).length > 0) {
      await payload.update({ collection: 'leads', id, data: payloadData as any })
    }

    // Extra fields via drizzle raw SQL
    const drizzle = (payload as any).db?.drizzle || (payload as any).db?.pool
    if (drizzle?.execute) {
      const sqlSets: string[] = []
      const hasNextCallbackDateColumn =
        body.next_callback_date !== undefined ? await hasColumn(drizzle, 'leads', 'next_callback_date') : false
      const hasLastContactResultColumn =
        body.last_contact_result !== undefined ? await hasColumn(drizzle, 'leads', 'last_contact_result') : false

      if (body.next_action_date !== undefined) sqlSets.push(`next_action_date = ${sqlStringOrNull(body.next_action_date)}`)
      if (body.next_action_note !== undefined) sqlSets.push(`next_action_note = ${sqlStringOrNull(body.next_action_note)}`)
      if (body.next_callback_date !== undefined && hasNextCallbackDateColumn) {
        sqlSets.push(`next_callback_date = ${sqlStringOrNull(body.next_callback_date)}`)
      }
      if (body.last_contact_result !== undefined && hasLastContactResultColumn) {
        sqlSets.push(`last_contact_result = ${sqlStringOrNull(body.last_contact_result)}`)
      }
      if (body.enrollment_id !== undefined) {
        const enrollmentId = toPositiveInt(body.enrollment_id)
        if (enrollmentId) sqlSets.push(`enrollment_id = ${enrollmentId}`)
      }
      if (body.callback_notes !== undefined) sqlSets.push(`callback_notes = ${sqlStringOrNull(body.callback_notes)}`)

      if (sqlSets.length > 0) {
        sqlSets.push('updated_at = NOW()')
        await drizzle.execute(`UPDATE leads SET ${sqlSets.join(', ')} WHERE id = ${toPositiveInt(id) ?? 0}`)
      }
    }

    const updatedLead = await payload.findByID({ collection: 'leads', id, depth: 0 })

    if (drizzle?.execute && authUser?.userId) {
      const changedFieldNames = Object.keys(body).filter((fieldName) => body[fieldName] !== undefined)
      if (changedFieldNames.length > 0) {
        const customStatusNote = typeof body.status_change_note === 'string' ? body.status_change_note.trim() : ''
        const note = body.status !== undefined
          ? (customStatusNote.length > 0
            ? customStatusNote
            : `Estado actualizado: ${String(lead?.status ?? 'sin_estado')} -> ${String(body.status)}`)
          : `Ficha actualizada: ${changedFieldNames.join(', ')}`
        const leadId = toPositiveInt(id)
        const userId = toPositiveInt(authUser.userId)
        if (leadId && userId) {
          await drizzle.execute(
            `INSERT INTO lead_interactions (lead_id, user_id, channel, result, note, tenant_id) VALUES (${leadId}, ${userId}, 'system', 'status_changed', '${esc(note)}', ${tenantId})`,
          ).catch(() => {})
        }
      }
    }

    if (authUser?.userId) {
      await createLeadAuditLog({
        payload,
        request,
        userId: authUser.userId,
        action: 'update',
        leadId: String(id),
        changes: {
          before: buildLeadSnapshot(lead),
          after: buildLeadSnapshot(updatedLead),
          updated_fields: Object.keys(body).filter((fieldName) => body[fieldName] !== undefined),
        },
      })
    }

    return NextResponse.json({ success: true, id, lead: updatedLead })
  } catch (error) {
    console.error('[API][Leads] PATCH error:', error)
    const message = error instanceof Error ? error.message : 'Failed to update lead'
    if (/invalid input value for enum/i.test(message) || /enum_leads_status/i.test(message)) {
      return NextResponse.json(
        { error: `No se pudo guardar el estado. Falta migración de estados CRM en base de datos. (${message})` },
        { status: 400 },
      )
    }
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const payload = await getPayload({ config: configPromise })
    const authUser = await getAuthenticatedUserContext(request, payload)
    const tenantId = authUser?.tenantId ?? null
    if (tenantId === null || !authUser?.userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const lead = await payload.findByID({ collection: 'leads', id, depth: 0 }) as any
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const leadTenantId = toPositiveInt(lead?.tenant_id ?? lead?.tenant?.id ?? lead?.tenant)
    if (leadTenantId && leadTenantId !== tenantId) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const drizzle = (payload as any).db?.drizzle || (payload as any).db?.pool
    const leadId = toPositiveInt(id)
    if (drizzle?.execute && leadId) {
      // Clean pending enrollment records tied to this invalid lead (legacy FK: enrollments.student_id -> leads.id).
      await drizzle.execute(
        `DELETE FROM enrollments WHERE tenant_id = ${tenantId} AND student_id = ${leadId} AND status IN ('pending', 'draft')`,
      ).catch(() => {})
    }

    await payload.delete({
      collection: 'leads',
      id,
    })

    await createLeadAuditLog({
      payload,
      request,
      userId: authUser.userId,
      action: 'delete',
      leadId: String(id),
      changes: {
        before: buildLeadSnapshot(lead),
      },
    })

    return NextResponse.json({ success: true, id: String(id) })
  } catch (error) {
    console.error('[API][Leads] DELETE error:', error)
    const message = error instanceof Error ? error.message : 'Failed to delete lead'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
