import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getAuthenticatedUserContext } from '../../_lib/auth'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string }>
}

const VALID_CHANNELS = ['phone', 'whatsapp', 'email', 'system'] as const
const VALID_RESULTS = [
  'no_answer', 'positive', 'negative', 'callback', 'wrong_number',
  'message_sent', 'email_sent', 'enrollment_started', 'status_changed', 'note_added',
] as const
const ADMIN_ROLES = new Set(['admin', 'superadmin'])

function esc(s: string): string {
  return s.replace(/'/g, "''")
}

function toPositiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) return parseInt(value, 10)
  return null
}

function isResultConstraintError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  return (
    message.includes('check constraint') &&
    message.includes('result')
  )
}

function buildInsertResultAttempts(result: string): string[] {
  if (result === 'note_added') return ['note_added', 'status_changed', 'message_sent', 'email_sent']
  if (result === 'status_changed') return ['status_changed', 'message_sent', 'email_sent']
  return [result]
}

async function resolveUserRole(drizzle: any, userId: number): Promise<string | null> {
  try {
    const usersRoleExists = await hasColumn(drizzle, 'users', 'role')
    if (!usersRoleExists) return null
    const result = await drizzle.execute(`SELECT role FROM users WHERE id = ${userId} LIMIT 1`)
    const rows = Array.isArray(result) ? result : (result?.rows ?? [])
    return typeof rows[0]?.role === 'string' ? rows[0].role : null
  } catch {
    return null
  }
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

// GET /api/leads/[id]/interactions
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const payload = await getPayloadHMR({ config: configPromise })
    const drizzle = (payload as any).db?.drizzle || (payload as any).db?.pool

    if (!drizzle?.execute) {
      return NextResponse.json({ interactions: [] })
    }

    const authUser = await getAuthenticatedUserContext(_request, payload)
    if (!authUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    const currentUserId = toPositiveInt(authUser.userId)

    const leadId = toPositiveInt(id)
    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID invalido' }, { status: 400 })
    }

    const lead = await payload.findByID({ collection: 'leads', id, depth: 0 }) as any
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const leadTenantId = toPositiveInt(lead.tenant_id ?? lead.tenant?.id ?? lead.tenant)
    if (leadTenantId && authUser.tenantId && leadTenantId !== authUser.tenantId) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    if (lead?.is_test === true) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const usersNameExists = await hasColumn(drizzle, 'users', 'name')
    const usersFirstNameExists = await hasColumn(drizzle, 'users', 'first_name')
    const usersLastNameExists = await hasColumn(drizzle, 'users', 'last_name')
    const usersEmailExists = await hasColumn(drizzle, 'users', 'email')

    const nameSelect = usersNameExists ? 'u.name' : 'NULL::text AS name'
    const firstNameSelect = usersFirstNameExists ? 'u.first_name' : 'NULL::text AS first_name'
    const lastNameSelect = usersLastNameExists ? 'u.last_name' : 'NULL::text AS last_name'
    const emailSelect = usersEmailExists ? 'u.email' : 'NULL::text AS email'

    const tenantFilter = authUser.tenantId ? ` AND li.tenant_id = ${authUser.tenantId}` : ''
    const result = await drizzle.execute(`
      SELECT li.*, ${nameSelect}, ${firstNameSelect}, ${lastNameSelect}, ${emailSelect}
      FROM lead_interactions li
      LEFT JOIN users u ON u.id = li.user_id
      WHERE li.lead_id = ${leadId}${tenantFilter}
      ORDER BY li.created_at DESC
    `)
    const rows = Array.isArray(result) ? result : (result?.rows ?? [])
    const currentUserRole = currentUserId ? await resolveUserRole(drizzle, currentUserId) : null
    const canAdminDeleteNotes = currentUserRole ? ADMIN_ROLES.has(currentUserRole) : false

    const interactions = rows.map((li: any) => ({
      ...li,
      user_name: li.name ?? null,
      user_first_name: li.first_name ?? null,
      user_last_name: li.last_name ?? null,
      user_email: li.email ?? null,
      can_delete:
        String(li?.result ?? '') === 'note_added' &&
        currentUserId !== null &&
        (toPositiveInt(li?.user_id) === currentUserId || canAdminDeleteNotes),
    }))

    return NextResponse.json({ interactions })
  } catch (error) {
    console.error('[API][LeadInteractions] GET error:', error)
    return NextResponse.json({ interactions: [] })
  }
}

// POST /api/leads/[id]/interactions
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { channel, result, note } = body

    if (!channel || !result) {
      return NextResponse.json({ error: 'channel and result are required' }, { status: 400 })
    }
    if (!VALID_CHANNELS.includes(channel)) {
      return NextResponse.json({ error: `Invalid channel: ${channel}` }, { status: 400 })
    }
    if (!VALID_RESULTS.includes(result)) {
      return NextResponse.json({ error: `Invalid result: ${result}` }, { status: 400 })
    }

    const payload = await getPayloadHMR({ config: configPromise })
    const drizzle = (payload as any).db?.drizzle || (payload as any).db?.pool
    if (!drizzle?.execute) throw new Error('DB not available')

    const authUser = await getAuthenticatedUserContext(request, payload)
    if (!authUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const leadId = toPositiveInt(id)
    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID invalido' }, { status: 400 })
    }

    // Get current lead
    const lead = await payload.findByID({ collection: 'leads', id, depth: 0 }) as any
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const leadTenantId = toPositiveInt(lead.tenant_id ?? lead.tenant?.id ?? lead.tenant)
    if (leadTenantId && authUser.tenantId && leadTenantId !== authUser.tenantId) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    if (lead?.is_test === true) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const tenantId =
      toPositiveInt(lead.tenant_id ?? lead.tenant?.id ?? lead.tenant) ??
      authUser.tenantId ??
      1
    const userId = toPositiveInt(authUser.userId)
    if (!userId) {
      return NextResponse.json({ error: 'Usuario autenticado invalido' }, { status: 401 })
    }
    const noteEsc = note ? `'${esc(note)}'` : 'NULL'

    // 1. Insert interaction (append-only)
    // Backward-compatible retry when old DB constraints don't support newer result values.
    const resultAttempts = buildInsertResultAttempts(result)
    let persistedResult: string | null = null
    let persistedInteraction: Record<string, any> | null = null
    let lastInsertError: unknown = null

    for (const candidateResult of resultAttempts) {
      try {
        const insertRes = await drizzle.execute(
          `INSERT INTO lead_interactions (lead_id, user_id, channel, result, note, tenant_id)
           VALUES (${leadId}, ${userId}, '${esc(channel)}', '${esc(candidateResult)}', ${noteEsc}, ${tenantId})
           RETURNING id, lead_id, user_id, channel, result, note, tenant_id, created_at`,
        )
        const insertRows = Array.isArray(insertRes) ? insertRes : (insertRes?.rows ?? [])
        persistedInteraction = (insertRows[0] ?? null) as Record<string, any> | null
        persistedResult = candidateResult
        break
      } catch (error) {
        lastInsertError = error
        if (!isResultConstraintError(error)) {
          throw error
        }
      }
    }

    if (!persistedResult) {
      throw lastInsertError instanceof Error
        ? lastInsertError
        : new Error('No se pudo registrar la interacción')
    }

    // 2. Update lead.last_contacted_at and assign advisor only on real contact channels.
    const shouldAssignAdvisor =
      channel === 'phone' || channel === 'whatsapp' || channel === 'email'

    if (shouldAssignAdvisor) {
      const hasAssignedToIdColumn = await hasColumn(drizzle, 'leads', 'assigned_to_id')
      const hasAssignedToLegacyColumn = hasAssignedToIdColumn
        ? false
        : await hasColumn(drizzle, 'leads', 'assigned_to')

      if (hasAssignedToIdColumn) {
        await drizzle.execute(
          `UPDATE leads
           SET last_contacted_at = NOW(),
               updated_at = NOW(),
               assigned_to_id = COALESCE(assigned_to_id, ${userId})
           WHERE id = ${leadId}`,
        )
      } else if (hasAssignedToLegacyColumn) {
        await drizzle.execute(
          `UPDATE leads
           SET last_contacted_at = NOW(),
               updated_at = NOW(),
               assigned_to = COALESCE(assigned_to, ${userId})
           WHERE id = ${leadId}`,
        )
      } else {
        await drizzle.execute(`UPDATE leads SET last_contacted_at = NOW(), updated_at = NOW() WHERE id = ${leadId}`)
      }
    } else {
      await drizzle.execute(`UPDATE leads SET last_contacted_at = NOW(), updated_at = NOW() WHERE id = ${leadId}`)
    }

    // 3-4. Auto status transitions (skip for manual status changes and system events)
    const skipAutoTransition = ['status_changed', 'enrollment_started', 'note_added'].includes(persistedResult)

    if (!skipAutoTransition) {
      // If first contact interaction, auto-change to 'contacted'
      const countRes = await drizzle.execute(`SELECT COUNT(*) as cnt FROM lead_interactions WHERE lead_id = ${leadId} AND result != 'status_changed'`)
      const countRows = Array.isArray(countRes) ? countRes : (countRes?.rows ?? [])
      const count = parseInt(countRows[0]?.cnt ?? '0')

      if (count === 1) {
        await drizzle.execute(`UPDATE leads SET status = 'contacted' WHERE id = ${leadId} AND status = 'new'`)
      }

      // Auto transitions based on contact result
      if (persistedResult === 'positive') {
        await drizzle.execute(`UPDATE leads SET status = 'interested' WHERE id = ${leadId} AND status IN ('new', 'contacted', 'following_up')`)
      } else if (persistedResult === 'wrong_number') {
        await drizzle.execute(`UPDATE leads SET status = 'unreachable' WHERE id = ${leadId}`)
      } else if (persistedResult === 'callback') {
        await drizzle.execute(`UPDATE leads SET status = 'on_hold' WHERE id = ${leadId}`)
      } else if (persistedResult === 'negative') {
        await drizzle.execute(`UPDATE leads SET status = 'not_interested' WHERE id = ${leadId} AND status IN ('new', 'contacted', 'following_up', 'interested')`)
      }
    }

    const usersNameExists = await hasColumn(drizzle, 'users', 'name')
    const usersFirstNameExists = await hasColumn(drizzle, 'users', 'first_name')
    const usersLastNameExists = await hasColumn(drizzle, 'users', 'last_name')
    const usersEmailExists = await hasColumn(drizzle, 'users', 'email')
    const userProfileRes = await drizzle.execute(`
      SELECT
        ${usersNameExists ? 'name' : 'NULL::text AS name'},
        ${usersFirstNameExists ? 'first_name' : 'NULL::text AS first_name'},
        ${usersLastNameExists ? 'last_name' : 'NULL::text AS last_name'},
        ${usersEmailExists ? 'email' : 'NULL::text AS email'}
      FROM users
      WHERE id = ${userId}
      LIMIT 1
    `)
    const userProfileRows = Array.isArray(userProfileRes) ? userProfileRes : (userProfileRes?.rows ?? [])
    const userProfile = userProfileRows[0] ?? {}

    const updatedLead = await payload.findByID({ collection: 'leads', id, depth: 0 })
    return NextResponse.json({
      success: true,
      lead: updatedLead,
      result: persistedResult,
      interaction: persistedInteraction
        ? {
            ...persistedInteraction,
            user_name: userProfile.name ?? null,
            user_first_name: userProfile.first_name ?? null,
            user_last_name: userProfile.last_name ?? null,
            user_email: userProfile.email ?? null,
            can_delete: true,
          }
        : null,
    })
  } catch (error) {
    console.error('[API][LeadInteractions] POST error:', error)
    const message = error instanceof Error ? error.message : 'Failed to create interaction'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/leads/[id]/interactions
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const payload = await getPayloadHMR({ config: configPromise })
    const drizzle = (payload as any).db?.drizzle || (payload as any).db?.pool
    if (!drizzle?.execute) throw new Error('DB not available')

    const authUser = await getAuthenticatedUserContext(request, payload)
    if (!authUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const leadId = toPositiveInt(id)
    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID invalido' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({} as Record<string, unknown>))
    const interactionId = toPositiveInt(body?.interactionId)
    if (!interactionId) {
      return NextResponse.json({ error: 'interactionId es obligatorio' }, { status: 400 })
    }

    const lead = await payload.findByID({ collection: 'leads', id, depth: 0 }) as any
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const leadTenantId = toPositiveInt(lead.tenant_id ?? lead.tenant?.id ?? lead.tenant)
    if (leadTenantId && authUser.tenantId && leadTenantId !== authUser.tenantId) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    if (lead?.is_test === true) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const tenantFilter = authUser.tenantId ? ` AND tenant_id = ${authUser.tenantId}` : ''
    const interactionRes = await drizzle.execute(
      `SELECT id, lead_id, user_id, result
       FROM lead_interactions
       WHERE id = ${interactionId}
         AND lead_id = ${leadId}${tenantFilter}
       LIMIT 1`,
    )
    const interactionRows = Array.isArray(interactionRes) ? interactionRes : (interactionRes?.rows ?? [])
    const interaction = interactionRows[0]
    if (!interaction) {
      return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 })
    }

    if (String(interaction.result ?? '') !== 'note_added') {
      return NextResponse.json({ error: 'Solo se pueden eliminar notas manuales del asesor' }, { status: 400 })
    }

    const currentUserId = toPositiveInt(authUser.userId)
    if (!currentUserId) {
      return NextResponse.json({ error: 'Usuario autenticado invalido' }, { status: 401 })
    }
    const role = await resolveUserRole(drizzle, currentUserId)
    const canAdminDelete = role ? ADMIN_ROLES.has(role) : false
    const ownerId = toPositiveInt(interaction.user_id)

    if (!canAdminDelete && ownerId !== currentUserId) {
      return NextResponse.json({ error: 'No tienes permisos para eliminar esta nota' }, { status: 403 })
    }

    await drizzle.execute(
      `DELETE FROM lead_interactions
       WHERE id = ${interactionId}
         AND lead_id = ${leadId}${tenantFilter}`,
    )

    return NextResponse.json({ success: true, interactionId })
  } catch (error) {
    console.error('[API][LeadInteractions] DELETE error:', error)
    const message = error instanceof Error ? error.message : 'Failed to delete interaction'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
