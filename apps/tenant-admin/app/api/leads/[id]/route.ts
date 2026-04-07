import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const payload = await getPayloadHMR({ config: configPromise })
    const lead = await payload.findByID({ collection: 'leads', id, depth: 1 })
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

    // Fields updatable via Payload
    const payloadFields = ['status', 'priority', 'assigned_to', 'last_contacted_at', 'converted_at']
    const payloadData: Record<string, unknown> = {}
    for (const field of payloadFields) {
      if (body[field] !== undefined) payloadData[field] = body[field]
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
      if (body.enrollment_id !== undefined) sqlSets.push(`enrollment_id = ${parseInt(body.enrollment_id)}`)
      if (body.callback_notes !== undefined) sqlSets.push(`callback_notes = '${esc(String(body.callback_notes))}'`)

      if (sqlSets.length > 0) {
        sqlSets.push('updated_at = NOW()')
        await drizzle.execute(`UPDATE leads SET ${sqlSets.join(', ')} WHERE id = ${parseInt(id)}`).catch(() => {})
      }
    }

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error('[API][Leads] PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
  }
}
