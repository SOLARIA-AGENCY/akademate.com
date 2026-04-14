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

function toPositiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) return parseInt(value, 10)
  return null
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
    const tenantId = (await getAuthenticatedUserContext(request, payload))?.tenantId ?? null
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
      const esc = (s: string) => s.replace(/'/g, "''")

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
