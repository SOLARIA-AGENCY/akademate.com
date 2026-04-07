import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string }>
}

const VALID_CHANNELS = ['phone', 'whatsapp', 'email', 'system'] as const
const VALID_RESULTS = [
  'no_answer', 'positive', 'negative', 'callback', 'wrong_number',
  'message_sent', 'email_sent', 'enrollment_started',
] as const

// GET /api/leads/[id]/interactions
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const payload = await getPayloadHMR({ config: configPromise })
    const db = payload.db as any

    const result = await db.execute({
      raw: `
        SELECT li.*, u.email as user_email, u.first_name as user_first_name, u.last_name as user_last_name
        FROM lead_interactions li
        LEFT JOIN users u ON u.id = li.user_id
        WHERE li.lead_id = $1
        ORDER BY li.created_at DESC
      `,
      values: [parseInt(id)],
    })

    return NextResponse.json({ interactions: result.rows ?? result ?? [] })
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
    const db = payload.db as any
    const leadId = parseInt(id)

    // Get current lead
    const lead = await payload.findByID({ collection: 'leads', id, depth: 0 }) as any
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const tenantId = lead.tenant_id ?? lead.tenant ?? 1
    const userId = body.user_id ?? 1

    // 1. Insert interaction (append-only)
    await db.execute({
      raw: `INSERT INTO lead_interactions (lead_id, user_id, channel, result, note, tenant_id) VALUES ($1, $2, $3, $4, $5, $6)`,
      values: [leadId, userId, channel, result, note ?? null, tenantId],
    })

    // 2. Update lead.last_contacted_at
    await db.execute({
      raw: `UPDATE leads SET last_contacted_at = NOW(), updated_at = NOW() WHERE id = $1`,
      values: [leadId],
    })

    // 3. If first interaction, auto-change status to 'contacted'
    const countResult = await db.execute({
      raw: `SELECT COUNT(*) as cnt FROM lead_interactions WHERE lead_id = $1`,
      values: [leadId],
    })
    const count = parseInt((countResult.rows ?? countResult)?.[0]?.cnt ?? '0')

    if (count === 1) {
      await db.execute({
        raw: `UPDATE leads SET status = 'contacted' WHERE id = $1 AND status = 'new'`,
        values: [leadId],
      })
    }

    // 4. Auto status transitions based on result
    const statusTransitions: Record<string, { to: string; from: string[] }> = {
      positive: { to: 'interested', from: ['new', 'contacted', 'following_up'] },
      wrong_number: { to: 'unreachable', from: ['new', 'contacted', 'following_up', 'on_hold'] },
      callback: { to: 'on_hold', from: ['new', 'contacted', 'following_up'] },
      negative: { to: 'not_interested', from: ['new', 'contacted', 'following_up', 'interested'] },
    }

    const transition = statusTransitions[result]
    if (transition) {
      const placeholders = transition.from.map((_, i) => `$${i + 2}`).join(', ')
      await db.execute({
        raw: `UPDATE leads SET status = $1 WHERE id = $${transition.from.length + 2} AND status IN (${placeholders})`,
        values: [transition.to, ...transition.from, leadId],
      })
    }

    // Return updated lead
    const updatedLead = await payload.findByID({ collection: 'leads', id, depth: 0 })
    return NextResponse.json({ success: true, lead: updatedLead })
  } catch (error) {
    console.error('[API][LeadInteractions] POST error:', error)
    return NextResponse.json({ error: 'Failed to create interaction' }, { status: 500 })
  }
}
