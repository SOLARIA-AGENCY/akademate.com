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

function esc(s: string): string {
  return s.replace(/'/g, "''")
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

    const leadId = parseInt(id)
    // Fetch interactions
    const result = await drizzle.execute(`SELECT * FROM lead_interactions WHERE lead_id = ${leadId} ORDER BY created_at DESC`)
    const rows = Array.isArray(result) ? result : (result?.rows ?? [])

    // Enrich with user names
    const interactions = await Promise.all(rows.map(async (li: any) => {
      try {
        const uRes = await drizzle.execute(`SELECT first_name, last_name, email FROM users WHERE id = ${li.user_id} LIMIT 1`)
        const uRows = Array.isArray(uRes) ? uRes : (uRes?.rows ?? [])
        const u = uRows[0]
        return { ...li, user_first_name: u?.first_name ?? null, user_last_name: u?.last_name ?? null, user_email: u?.email ?? null }
      } catch {
        return { ...li, user_first_name: null, user_last_name: null, user_email: null }
      }
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

    const leadId = parseInt(id)

    // Get current lead
    const lead = await payload.findByID({ collection: 'leads', id, depth: 0 }) as any
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const tenantId = lead.tenant_id ?? lead.tenant ?? 1
    const userId = body.user_id ?? 1
    const noteEsc = note ? `'${esc(note)}'` : 'NULL'

    // 1. Insert interaction (append-only)
    await drizzle.execute(
      `INSERT INTO lead_interactions (lead_id, user_id, channel, result, note, tenant_id) VALUES (${leadId}, ${userId}, '${esc(channel)}', '${esc(result)}', ${noteEsc}, ${tenantId})`,
    )

    // 2. Update lead.last_contacted_at
    await drizzle.execute(`UPDATE leads SET last_contacted_at = NOW(), updated_at = NOW() WHERE id = ${leadId}`)

    // 3. If first interaction, auto-change to 'contacted'
    const countRes = await drizzle.execute(`SELECT COUNT(*) as cnt FROM lead_interactions WHERE lead_id = ${leadId}`)
    const countRows = Array.isArray(countRes) ? countRes : (countRes?.rows ?? [])
    const count = parseInt(countRows[0]?.cnt ?? '0')

    if (count === 1) {
      await drizzle.execute(`UPDATE leads SET status = 'contacted' WHERE id = ${leadId} AND status = 'new'`)
    }

    // 4. Auto status transitions
    if (result === 'positive') {
      await drizzle.execute(`UPDATE leads SET status = 'interested' WHERE id = ${leadId} AND status IN ('new', 'contacted', 'following_up')`)
    } else if (result === 'wrong_number') {
      await drizzle.execute(`UPDATE leads SET status = 'unreachable' WHERE id = ${leadId}`)
    } else if (result === 'callback') {
      await drizzle.execute(`UPDATE leads SET status = 'on_hold' WHERE id = ${leadId}`)
    } else if (result === 'negative') {
      await drizzle.execute(`UPDATE leads SET status = 'not_interested' WHERE id = ${leadId} AND status IN ('new', 'contacted', 'following_up', 'interested')`)
    }

    const updatedLead = await payload.findByID({ collection: 'leads', id, depth: 0 })
    return NextResponse.json({ success: true, lead: updatedLead })
  } catch (error) {
    console.error('[API][LeadInteractions] POST error:', error)
    return NextResponse.json({ error: 'Failed to create interaction' }, { status: 500 })
  }
}
