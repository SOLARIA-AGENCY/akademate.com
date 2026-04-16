import { getPayloadHMR } from '@payloadcms/next/utilities'
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
    const payload = await getPayloadHMR({ config: configPromise })
    const tenantId = (await getAuthenticatedUserContext(request, payload))?.tenantId ?? null
    if (tenantId === null) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const lead = await payload.findByID({ collection: 'leads', id, depth: 1 })

    const leadTenantId = toPositiveInt((lead as any)?.tenant_id ?? (lead as any)?.tenant?.id ?? (lead as any)?.tenant)
    if (leadTenantId && leadTenantId !== tenantId) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    return NextResponse.json(lead)
  } catch (error) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const payload = await getPayloadHMR({ config: configPromise })
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
    const payloadFields = ['status', 'priority', 'assigned_to', 'last_contacted_at', 'converted_at']
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

      if (body.next_action_date !== undefined) sqlSets.push(`next_action_date = '${esc(String(body.next_action_date))}'`)
      if (body.next_action_note !== undefined) sqlSets.push(`next_action_note = '${esc(String(body.next_action_note))}'`)
      if (body.enrollment_id !== undefined) {
        const enrollmentId = toPositiveInt(body.enrollment_id)
        if (enrollmentId) sqlSets.push(`enrollment_id = ${enrollmentId}`)
      }
      if (body.callback_notes !== undefined) sqlSets.push(`callback_notes = '${esc(String(body.callback_notes))}'`)

      if (sqlSets.length > 0) {
        sqlSets.push('updated_at = NOW()')
        await drizzle.execute(`UPDATE leads SET ${sqlSets.join(', ')} WHERE id = ${toPositiveInt(id) ?? 0}`)
      }
    }

    const updatedLead = await payload.findByID({ collection: 'leads', id, depth: 0 })

    if (drizzle?.execute && authUser?.userId) {
      const changedFieldNames = Object.keys(body).filter((fieldName) => body[fieldName] !== undefined)
      if (changedFieldNames.length > 0) {
        const note = body.status !== undefined
          ? `Estado actualizado: ${String(lead?.status ?? 'sin_estado')} -> ${String(body.status)}`
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
    const payload = await getPayloadHMR({ config: configPromise })
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
