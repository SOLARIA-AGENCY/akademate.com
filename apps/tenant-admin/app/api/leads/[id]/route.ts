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

    // Only allow specific fields to be updated
    const allowedFields = [
      'status', 'priority', 'assigned_to',
      'last_contacted_at', 'converted_at',
    ]

    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) updateData[field] = body[field]
    }

    const updated = await payload.update({
      collection: 'leads',
      id,
      data: updateData as any,
    })

    // Update extra fields via raw SQL (fields not in Payload collection)
    try {
      const extraFields: string[] = []
      if (body.contact_attempts !== undefined) extraFields.push(`contact_attempts = ${parseInt(body.contact_attempts)}`)
      if (body.last_contact_result) extraFields.push(`last_contact_result = '${body.last_contact_result.replace(/'/g, "''")}'`)
      if (body.contacted_phone !== undefined) extraFields.push(`contacted_phone = ${body.contacted_phone}`)
      if (body.contacted_phone_date) extraFields.push(`contacted_phone_date = '${body.contacted_phone_date}'`)
      if (body.contacted_phone_result) extraFields.push(`contacted_phone_result = '${body.contacted_phone_result.replace(/'/g, "''")}'`)
      if (body.contacted_email !== undefined) extraFields.push(`contacted_email = ${body.contacted_email}`)
      if (body.contacted_email_date) extraFields.push(`contacted_email_date = '${body.contacted_email_date}'`)
      if (body.contacted_whatsapp !== undefined) extraFields.push(`contacted_whatsapp = ${body.contacted_whatsapp}`)
      if (body.contacted_whatsapp_date) extraFields.push(`contacted_whatsapp_date = '${body.contacted_whatsapp_date}'`)
      if (body.callback_notes !== undefined) extraFields.push(`callback_notes = '${(body.callback_notes || '').replace(/'/g, "''")}'`)
      if (body.next_callback_date) extraFields.push(`next_callback_date = '${body.next_callback_date}'`)
      if (body.rejection_reason) extraFields.push(`rejection_reason = '${body.rejection_reason.replace(/'/g, "''")}'`)

      if (extraFields.length > 0) {
        const sql = `UPDATE leads SET ${extraFields.join(', ')}, updated_at = NOW() WHERE id = ${id}`
        await (payload.db as any).execute({ raw: sql }).catch(() => {})
      }
    } catch { /* extra fields optional */ }

    return NextResponse.json({ success: true, id: updated.id })
  } catch (error) {
    console.error('[API][Leads] PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
  }
}
