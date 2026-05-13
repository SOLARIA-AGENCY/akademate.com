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
  rowsFromResult,
  sqlStringOrNull,
  toPositiveInt,
  updateLeadNextAction,
} from '../_lib'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string }>
}

async function loadAppointment(drizzle: any, id: number, tenantId: number) {
  const result = await drizzle.execute(`
    SELECT la.*, l.first_name, l.last_name, l.email, l.phone
    FROM lead_appointments la
    INNER JOIN leads l ON l.id = la.lead_id AND l.tenant_id = la.tenant_id
    WHERE la.id = ${id}
      AND la.tenant_id = ${tenantId}
    LIMIT 1
  `)
  return rowsFromResult(result)[0] ?? null
}

function parseStartsAt(value: unknown): Date | null {
  if (value === undefined) return null
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const ctx = await getAppointmentContext(request)
  if ('error' in ctx) return ctx.error

  const { id } = await context.params
  const appointmentId = toPositiveInt(id)
  if (!appointmentId) return NextResponse.json({ error: 'ID invalido' }, { status: 400 })

  const existing = await loadAppointment(ctx.drizzle, appointmentId, ctx.tenantId)
  if (!existing) return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })

  const body = await request.json()
  const sets: string[] = []
  let interactionLabel = 'Cita actualizada'
  let nextActionDate: Date | null | undefined = undefined

  if (body.title !== undefined) sets.push(`title = ${sqlStringOrNull(body.title)}`)
  if (body.notes !== undefined) sets.push(`notes = ${sqlStringOrNull(body.notes)}`)
  if (body.outcome_notes !== undefined || body.outcomeNotes !== undefined) {
    sets.push(`outcome_notes = ${sqlStringOrNull(body.outcome_notes ?? body.outcomeNotes)}`)
  }

  const type = body.appointment_type ?? body.appointmentType
  if (type !== undefined) {
    if (!APPOINTMENT_TYPES.includes(String(type) as any)) {
      return NextResponse.json({ error: 'Tipo de cita invalido' }, { status: 400 })
    }
    sets.push(`appointment_type = '${esc(String(type))}'`)
  }

  const reason = body.reason
  if (reason !== undefined) {
    if (!APPOINTMENT_REASONS.includes(String(reason) as any)) {
      return NextResponse.json({ error: 'Motivo invalido' }, { status: 400 })
    }
    sets.push(`reason = '${esc(String(reason))}'`)
  }

  const status = body.status
  if (status !== undefined) {
    if (!APPOINTMENT_STATUSES.includes(String(status) as any)) {
      return NextResponse.json({ error: 'Estado invalido' }, { status: 400 })
    }
    sets.push(`status = '${esc(String(status))}'`)
    if (status === 'cancelled') {
      sets.push('cancelled_at = COALESCE(cancelled_at, NOW())')
      interactionLabel = 'Cita cancelada'
      nextActionDate = null
    } else {
      sets.push('cancelled_at = NULL')
      if (status === 'completed') interactionLabel = 'Cita completada'
      if (status === 'no_show') interactionLabel = 'Cita marcada como no atendida'
      if (status === 'rescheduled') interactionLabel = 'Cita reprogramada'
    }
  }

  const assignedTo = toPositiveInt(body.assigned_to_user_id ?? body.assignedToUserId)
  if (assignedTo) {
    const assignedUser = await findUserInTenant(ctx.drizzle, assignedTo, ctx.tenantId)
    if (!assignedUser) return NextResponse.json({ error: 'Asesor asignado no valido' }, { status: 400 })
    sets.push(`assigned_to_user_id = ${assignedTo}`)
    interactionLabel = 'Cita reasignada'
  }

  const startsAt = parseStartsAt(body.starts_at ?? body.startsAt)
  const duration = toPositiveInt(body.duration_minutes ?? body.durationMinutes)
  if ((body.starts_at ?? body.startsAt) !== undefined && !startsAt) {
    return NextResponse.json({ error: 'starts_at invalido' }, { status: 400 })
  }
  if (startsAt || duration) {
    const baseStartsAt = startsAt ?? new Date(existing.starts_at)
    const baseDuration = Math.min(Math.max(duration ?? toPositiveInt(existing.duration_minutes) ?? 30, 5), 480)
    const endsAt = new Date(baseStartsAt.getTime() + baseDuration * 60_000)
    sets.push(`starts_at = '${baseStartsAt.toISOString()}'`)
    sets.push(`ends_at = '${endsAt.toISOString()}'`)
    sets.push(`duration_minutes = ${baseDuration}`)
    nextActionDate = baseStartsAt
    interactionLabel = 'Cita reprogramada'
  }

  if (!sets.length) return NextResponse.json({ error: 'Sin cambios' }, { status: 400 })
  sets.push('updated_at = NOW()')

  await ctx.drizzle.execute(`
    UPDATE lead_appointments
    SET ${sets.join(', ')}
    WHERE id = ${appointmentId}
      AND tenant_id = ${ctx.tenantId}
  `)

  const updated = await loadAppointment(ctx.drizzle, appointmentId, ctx.tenantId)
  const lead = await findLeadInTenant(ctx.drizzle, toPositiveInt(updated.lead_id)!, ctx.tenantId)
  await insertLeadInteraction(
    ctx.drizzle,
    toPositiveInt(updated.lead_id)!,
    ctx.userId,
    ctx.tenantId,
    'status_changed',
    appointmentNote(interactionLabel, updated, lead),
  )

  if (nextActionDate !== undefined) {
    await updateLeadNextAction(
      ctx.drizzle,
      toPositiveInt(updated.lead_id)!,
      nextActionDate,
      nextActionDate ? `${interactionLabel}: ${updated.title}` : null,
    )
  }

  return NextResponse.json({ appointment: updated })
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const ctx = await getAppointmentContext(request)
  if ('error' in ctx) return ctx.error

  const { id } = await context.params
  const appointmentId = toPositiveInt(id)
  if (!appointmentId) return NextResponse.json({ error: 'ID invalido' }, { status: 400 })

  const existing = await loadAppointment(ctx.drizzle, appointmentId, ctx.tenantId)
  if (!existing) return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })

  let body: any = {}
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  await ctx.drizzle.execute(`
    UPDATE lead_appointments
    SET status = 'cancelled',
        cancelled_at = COALESCE(cancelled_at, NOW()),
        outcome_notes = COALESCE(${sqlStringOrNull(body.outcome_notes ?? body.outcomeNotes)}, outcome_notes),
        updated_at = NOW()
    WHERE id = ${appointmentId}
      AND tenant_id = ${ctx.tenantId}
  `)

  const lead = await findLeadInTenant(ctx.drizzle, toPositiveInt(existing.lead_id)!, ctx.tenantId)
  await insertLeadInteraction(
    ctx.drizzle,
    toPositiveInt(existing.lead_id)!,
    ctx.userId,
    ctx.tenantId,
    'status_changed',
    appointmentNote('Cita cancelada', existing, lead),
  )

  return NextResponse.json({ ok: true })
}
