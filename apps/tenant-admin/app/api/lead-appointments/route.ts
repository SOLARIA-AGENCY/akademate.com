import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import {
  APPOINTMENT_REASONS,
  APPOINTMENT_STATUSES,
  APPOINTMENT_TYPES,
  appointmentNote,
  esc,
  findLeadInTenant,
  findUserInTenant,
  getAppointmentContext,
  insertLeadInteraction,
  leadDisplayName,
  rowsFromResult,
  sqlStringOrNull,
  toPositiveInt,
  updateLeadNextAction,
} from './_lib'

export const dynamic = 'force-dynamic'

function parseDateParam(value: string | null): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function defaultRange() {
  const now = new Date()
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1),
    to: new Date(now.getFullYear(), now.getMonth() + 1, 1),
  }
}

function buildAppointmentSelect(where: string, order = 'la.starts_at ASC') {
  return `
    SELECT
      la.*,
      l.first_name AS lead_first_name,
      l.last_name AS lead_last_name,
      l.email AS lead_email,
      l.phone AS lead_phone,
      l.status AS lead_status,
      au.name AS assigned_to_name,
      au.email AS assigned_to_email,
      cu.name AS created_by_name,
      cu.email AS created_by_email
    FROM lead_appointments la
    INNER JOIN leads l ON l.id = la.lead_id AND l.tenant_id = la.tenant_id
    LEFT JOIN users au ON au.id = la.assigned_to_user_id
    LEFT JOIN users cu ON cu.id = la.created_by_user_id
    WHERE ${where}
    ORDER BY ${order}
  `
}

function mapAppointment(row: any) {
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    lead_id: row.lead_id,
    title: row.title,
    appointment_type: row.appointment_type,
    reason: row.reason,
    status: row.status,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    duration_minutes: row.duration_minutes,
    notes: row.notes,
    outcome_notes: row.outcome_notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    cancelled_at: row.cancelled_at,
    lead: {
      id: row.lead_id,
      first_name: row.lead_first_name,
      last_name: row.lead_last_name,
      email: row.lead_email,
      phone: row.lead_phone,
      status: row.lead_status,
    },
    assigned_to: {
      id: row.assigned_to_user_id,
      name: row.assigned_to_name,
      email: row.assigned_to_email,
    },
    created_by: {
      id: row.created_by_user_id,
      name: row.created_by_name,
      email: row.created_by_email,
    },
  }
}

async function loadCommercialUsers(drizzle: any, tenantId: number) {
  const result = await drizzle.execute(`
    SELECT id, name, email, role
    FROM users
    WHERE tenant_id = ${tenantId}
      AND role IN ('admin', 'gestor', 'marketing', 'asesor', 'superadmin')
    ORDER BY COALESCE(name, email) ASC
  `)
  return rowsFromResult(result).map((user: any) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  }))
}

export async function GET(request: NextRequest) {
  const ctx = await getAppointmentContext(request)
  if ('error' in ctx) return ctx.error

  const { searchParams } = new URL(request.url)
  const leadId = toPositiveInt(searchParams.get('leadId'))
  const assignedTo = toPositiveInt(searchParams.get('assignedTo'))
  const includeUsers = searchParams.get('includeUsers') === '1' || searchParams.get('includeUsers') === 'true'
  const fromParam = parseDateParam(searchParams.get('from'))
  const toParam = parseDateParam(searchParams.get('to'))

  const where: string[] = [`la.tenant_id = ${ctx.tenantId}`]
  let order = 'la.starts_at ASC'

  if (leadId) {
    const lead = await findLeadInTenant(ctx.drizzle, leadId, ctx.tenantId)
    if (!lead) return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })
    where.push(`la.lead_id = ${leadId}`)
    order = 'la.starts_at DESC'
  }

  if (assignedTo) where.push(`la.assigned_to_user_id = ${assignedTo}`)

  if (fromParam && toParam) {
    where.push(`la.starts_at >= '${fromParam.toISOString()}'`)
    where.push(`la.starts_at < '${toParam.toISOString()}'`)
  } else if (!leadId) {
    const { from, to } = defaultRange()
    where.push(`la.starts_at >= '${from.toISOString()}'`)
    where.push(`la.starts_at < '${to.toISOString()}'`)
  }

  const result = await ctx.drizzle.execute(buildAppointmentSelect(where.join(' AND '), order))
  const response: Record<string, unknown> = {
    appointments: rowsFromResult(result).map(mapAppointment),
  }
  if (includeUsers) response.users = await loadCommercialUsers(ctx.drizzle, ctx.tenantId)
  return NextResponse.json(response)
}

export async function POST(request: NextRequest) {
  const ctx = await getAppointmentContext(request)
  if ('error' in ctx) return ctx.error

  const body = await request.json()
  const leadId = toPositiveInt(body.lead_id ?? body.leadId)
  if (!leadId) return NextResponse.json({ error: 'lead_id requerido' }, { status: 400 })

  const lead = await findLeadInTenant(ctx.drizzle, leadId, ctx.tenantId)
  if (!lead) return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })

  const startsAt = new Date(String(body.starts_at ?? body.startsAt ?? ''))
  if (Number.isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: 'starts_at invalido' }, { status: 400 })
  }

  const duration = Math.min(Math.max(toPositiveInt(body.duration_minutes ?? body.durationMinutes) ?? 30, 5), 480)
  const endsAt = new Date(startsAt.getTime() + duration * 60_000)
  const type = String(body.appointment_type ?? body.appointmentType ?? 'call')
  const reason = String(body.reason ?? 'follow_up')
  const status = String(body.status ?? 'pending')
  if (!APPOINTMENT_TYPES.includes(type as any)) return NextResponse.json({ error: 'Tipo de cita invalido' }, { status: 400 })
  if (!APPOINTMENT_REASONS.includes(reason as any)) return NextResponse.json({ error: 'Motivo invalido' }, { status: 400 })
  if (!APPOINTMENT_STATUSES.includes(status as any)) return NextResponse.json({ error: 'Estado invalido' }, { status: 400 })

  const assignedTo = toPositiveInt(body.assigned_to_user_id ?? body.assignedToUserId) ?? ctx.userId
  const assignedUser = await findUserInTenant(ctx.drizzle, assignedTo, ctx.tenantId)
  if (!assignedUser) return NextResponse.json({ error: 'Asesor asignado no valido' }, { status: 400 })

  const title = String(body.title ?? '').trim() || `Cita con ${leadDisplayName(lead)}`
  const insert = await ctx.drizzle.execute(`
    INSERT INTO lead_appointments (
      tenant_id, lead_id, created_by_user_id, assigned_to_user_id, title,
      appointment_type, reason, status, starts_at, ends_at, duration_minutes,
      notes, outcome_notes, cancelled_at, created_at, updated_at
    )
    VALUES (
      ${ctx.tenantId}, ${leadId}, ${ctx.userId}, ${assignedTo}, '${esc(title)}',
      '${esc(type)}', '${esc(reason)}', '${esc(status)}', '${startsAt.toISOString()}',
      '${endsAt.toISOString()}', ${duration}, ${sqlStringOrNull(body.notes)},
      ${sqlStringOrNull(body.outcome_notes ?? body.outcomeNotes)},
      ${status === 'cancelled' ? 'NOW()' : 'NULL'}, NOW(), NOW()
    )
    RETURNING *
  `)
  const created = rowsFromResult(insert)[0]
  const hydrated = await ctx.drizzle.execute(buildAppointmentSelect(`la.id = ${created.id} AND la.tenant_id = ${ctx.tenantId}`))
  const appointment = mapAppointment(rowsFromResult(hydrated)[0])

  await insertLeadInteraction(ctx.drizzle, leadId, ctx.userId, ctx.tenantId, 'callback', appointmentNote('Cita programada', created, lead))
  if (status !== 'cancelled') {
    await updateLeadNextAction(ctx.drizzle, leadId, startsAt, `Cita programada: ${title}`)
  }

  return NextResponse.json({ appointment }, { status: 201 })
}
