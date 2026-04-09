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
  'message_sent', 'email_sent', 'enrollment_started', 'status_changed',
] as const

function esc(s: string): string {
  return s.replace(/'/g, "''")
}

function toPositiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) return parseInt(value, 10)
  return null
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

    const leadId = toPositiveInt(id)
    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID invalido' }, { status: 400 })
    }

    const tenantFilter = authUser.tenantId ? ` AND li.tenant_id = ${authUser.tenantId}` : ''
    const result = await drizzle.execute(`
      SELECT li.*, u.first_name, u.last_name, u.email
      FROM lead_interactions li
      LEFT JOIN users u ON u.id = li.user_id
      WHERE li.lead_id = ${leadId}${tenantFilter}
      ORDER BY li.created_at DESC
    `)
    const rows = Array.isArray(result) ? result : (result?.rows ?? [])

    const interactions = rows.map((li: any) => ({
      ...li,
      user_first_name: li.first_name ?? null,
      user_last_name: li.last_name ?? null,
      user_email: li.email ?? null,
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
    await drizzle.execute(
      `INSERT INTO lead_interactions (lead_id, user_id, channel, result, note, tenant_id) VALUES (${leadId}, ${userId}, '${esc(channel)}', '${esc(result)}', ${noteEsc}, ${tenantId})`,
    )

    // 2. Update lead.last_contacted_at
    await drizzle.execute(`UPDATE leads SET last_contacted_at = NOW(), updated_at = NOW() WHERE id = ${leadId}`)

    // 3-4. Auto status transitions (skip for manual status changes and system events)
    const skipAutoTransition = ['status_changed', 'enrollment_started'].includes(result)

    if (!skipAutoTransition) {
      // If first contact interaction, auto-change to 'contacted'
      const countRes = await drizzle.execute(`SELECT COUNT(*) as cnt FROM lead_interactions WHERE lead_id = ${leadId} AND result != 'status_changed'`)
      const countRows = Array.isArray(countRes) ? countRes : (countRes?.rows ?? [])
      const count = parseInt(countRows[0]?.cnt ?? '0')

      if (count === 1) {
        await drizzle.execute(`UPDATE leads SET status = 'contacted' WHERE id = ${leadId} AND status = 'new'`)
      }

      // Auto transitions based on contact result
      if (result === 'positive') {
        await drizzle.execute(`UPDATE leads SET status = 'interested' WHERE id = ${leadId} AND status IN ('new', 'contacted', 'following_up')`)
      } else if (result === 'wrong_number') {
        await drizzle.execute(`UPDATE leads SET status = 'unreachable' WHERE id = ${leadId}`)
      } else if (result === 'callback') {
        await drizzle.execute(`UPDATE leads SET status = 'on_hold' WHERE id = ${leadId}`)
      } else if (result === 'negative') {
        await drizzle.execute(`UPDATE leads SET status = 'not_interested' WHERE id = ${leadId} AND status IN ('new', 'contacted', 'following_up', 'interested')`)
      }
    }

    const updatedLead = await payload.findByID({ collection: 'leads', id, depth: 0 })
    return NextResponse.json({ success: true, lead: updatedLead })
  } catch (error) {
    console.error('[API][LeadInteractions] POST error:', error)
    return NextResponse.json({ error: 'Failed to create interaction' }, { status: 500 })
  }
}
