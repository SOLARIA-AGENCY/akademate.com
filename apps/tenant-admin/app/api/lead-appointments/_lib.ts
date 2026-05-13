import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getAuthenticatedUserContext } from '../leads/_lib/auth'

export const APPOINTMENT_TYPES = ['call', 'whatsapp', 'video', 'presential', 'email_followup'] as const
export const APPOINTMENT_REASONS = ['follow_up', 'info_meeting', 'lead_recovery', 'send_information', 'enrollment_close', 'other'] as const
export const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'completed', 'no_show', 'rescheduled', 'cancelled'] as const

const COMMERCIAL_ROLES = new Set(['admin', 'gestor', 'marketing', 'asesor', 'superadmin'])

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number]

export function esc(value: string): string {
  return value.replace(/'/g, "''")
}

export function toPositiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) return parseInt(value, 10)
  return null
}

export function rowsFromResult(result: any): any[] {
  return Array.isArray(result) ? result : (result?.rows ?? [])
}

export function sqlStringOrNull(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'NULL'
  return `'${esc(String(value))}'`
}

export async function hasTable(drizzle: any, tableName: string): Promise<boolean> {
  try {
    const result = await drizzle.execute(`
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = '${esc(tableName)}'
      LIMIT 1
    `)
    return rowsFromResult(result).length > 0
  } catch {
    return false
  }
}

export async function hasColumn(drizzle: any, tableName: string, columnName: string): Promise<boolean> {
  try {
    const result = await drizzle.execute(`
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = '${esc(tableName)}'
        AND column_name = '${esc(columnName)}'
      LIMIT 1
    `)
    return rowsFromResult(result).length > 0
  } catch {
    return false
  }
}

export async function getAppointmentContext(request: NextRequest) {
  const payload = await getPayload({ config: configPromise })
  const drizzle = (payload as any).db?.drizzle || (payload as any).db?.pool
  if (!drizzle?.execute) {
    return { error: NextResponse.json({ error: 'DB no disponible' }, { status: 503 }) }
  }

  const authUser = await getAuthenticatedUserContext(request, payload)
  const userId = toPositiveInt(authUser?.userId)
  const tenantId = toPositiveInt(authUser?.tenantId)
  if (!authUser || !userId || !tenantId) {
    return { error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) }
  }

  const roleResult = await drizzle.execute(`
    SELECT role, name, email
    FROM users
    WHERE id = ${userId}
      AND tenant_id = ${tenantId}
    LIMIT 1
  `)
  const user = rowsFromResult(roleResult)[0]
  const role = String(user?.role ?? '')
  if (!COMMERCIAL_ROLES.has(role)) {
    return { error: NextResponse.json({ error: 'No autorizado' }, { status: 403 }) }
  }

  const tableReady = await hasTable(drizzle, 'lead_appointments')
  if (!tableReady) {
    return { error: NextResponse.json({ error: 'Modulo de calendario pendiente de migracion' }, { status: 503 }) }
  }

  return { payload, drizzle, userId, tenantId, role }
}

export async function findLeadInTenant(drizzle: any, leadId: number, tenantId: number) {
  const result = await drizzle.execute(`
    SELECT id, first_name, last_name, email, phone, lead_type, status, callback_notes
    FROM leads
    WHERE id = ${leadId}
      AND tenant_id = ${tenantId}
      AND COALESCE(is_test, false) = false
    LIMIT 1
  `)
  return rowsFromResult(result)[0] ?? null
}

export async function findUserInTenant(drizzle: any, userId: number, tenantId: number) {
  const result = await drizzle.execute(`
    SELECT id, name, email, role
    FROM users
    WHERE id = ${userId}
      AND tenant_id = ${tenantId}
      AND role IN ('admin', 'gestor', 'marketing', 'asesor', 'superadmin')
    LIMIT 1
  `)
  return rowsFromResult(result)[0] ?? null
}

export function leadDisplayName(lead: any): string {
  const name = [lead?.first_name, lead?.last_name].filter(Boolean).join(' ').trim()
  return name || lead?.email || lead?.phone || `Lead #${lead?.id}`
}

export function appointmentNote(action: string, appointment: any, lead: any): string {
  const startsAt = appointment?.starts_at ? new Date(appointment.starts_at) : new Date()
  const formatted = startsAt.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${action}: ${appointment?.title || `cita con ${leadDisplayName(lead)}`} para el ${formatted}.`
}

export async function insertLeadInteraction(
  drizzle: any,
  leadId: number,
  userId: number,
  tenantId: number,
  result: 'callback' | 'status_changed',
  note: string,
) {
  try {
    if (!(await hasTable(drizzle, 'lead_interactions'))) return
    await drizzle.execute(`
      INSERT INTO lead_interactions (lead_id, user_id, channel, result, note, tenant_id)
      VALUES (${leadId}, ${userId}, 'system', '${result}', '${esc(note)}', ${tenantId})
    `)
  } catch (error) {
    console.warn('[LeadAppointments] No se pudo registrar interaccion automatica:', error)
  }
}

export async function updateLeadNextAction(
  drizzle: any,
  leadId: number,
  startsAt: Date | null,
  note: string | null,
) {
  try {
    const hasNextActionDate = await hasColumn(drizzle, 'leads', 'next_action_date')
    const hasNextActionNote = await hasColumn(drizzle, 'leads', 'next_action_note')
    const hasNextCallbackDate = await hasColumn(drizzle, 'leads', 'next_callback_date')
    const sets: string[] = []
    if (hasNextActionDate) sets.push(`next_action_date = ${startsAt ? `'${startsAt.toISOString()}'` : 'NULL'}`)
    if (hasNextActionNote) sets.push(`next_action_note = ${sqlStringOrNull(note)}`)
    if (hasNextCallbackDate) sets.push(`next_callback_date = ${startsAt ? `'${startsAt.toISOString()}'` : 'NULL'}`)
    if (!sets.length) return
    sets.push('updated_at = NOW()')
    await drizzle.execute(`UPDATE leads SET ${sets.join(', ')} WHERE id = ${leadId}`)
  } catch (error) {
    console.warn('[LeadAppointments] No se pudo actualizar proxima accion del lead:', error)
  }
}
