import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const payload = await getPayloadHMR({ config: configPromise })
    const drizzle = (payload as any).db?.drizzle || (payload as any).db?.pool

    const lead = await payload.findByID({ collection: 'leads', id, depth: 0 }) as any
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const allowedStatuses = ['interested', 'following_up']
    if (!allowedStatuses.includes(lead.status)) {
      return NextResponse.json(
        { error: `Status "${lead.status}" no permite matriculacion. Debe ser: ${allowedStatuses.join(', ')}` },
        { status: 400 },
      )
    }

    if (lead.enrollment_id) {
      return NextResponse.json(
        { error: 'Lead ya tiene ficha de matricula', enrollmentId: lead.enrollment_id },
        { status: 409 },
      )
    }

    const userId = body.user_id ?? 1
    const tenantId = lead.tenant_id ?? lead.tenant ?? 1
    const leadId = parseInt(id)

    // Create enrollment via Payload, then update lead + log via raw SQL
    const enrollment = await payload.create({
      collection: 'enrollments',
      data: {
        student_id: lead.id,
        status: 'pending',
        payment_status: 'pending',
        enrolled_at: new Date().toISOString(),
        ...(lead.course_id ? { course_run_id: lead.course_id } : {}),
      } as any,
    })

    if (drizzle?.execute) {
      await drizzle.execute(`UPDATE leads SET status = 'enrolling', enrollment_id = ${enrollment.id}, updated_at = NOW() WHERE id = ${leadId}`)
      await drizzle.execute(`INSERT INTO lead_interactions (lead_id, user_id, channel, result, note, tenant_id) VALUES (${leadId}, ${userId}, 'system', 'enrollment_started', 'Ficha de matricula creada', ${tenantId})`)
    }

    return NextResponse.json({ success: true, enrollmentId: enrollment.id })
  } catch (error) {
    console.error('[API][LeadEnroll] error:', error)
    return NextResponse.json({ error: 'Failed to create enrollment' }, { status: 500 })
  }
}
