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
    const db = payload.db as any

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

    // Atomic transaction
    try {
      await db.execute({ raw: 'BEGIN' })

      // 1. Create enrollment
      const enrollment = await payload.create({
        collection: 'enrollments',
        data: {
          student_id: lead.id,
          status: 'pending',
          payment_status: 'unpaid',
          enrolled_at: new Date().toISOString(),
          ...(lead.course_id ? { course_run_id: lead.course_id } : {}),
          tenant: tenantId,
        },
      })

      // 2. Update lead
      await db.execute({
        raw: `UPDATE leads SET status = 'enrolling', enrollment_id = $1, updated_at = NOW() WHERE id = $2`,
        values: [enrollment.id, parseInt(id)],
      })

      // 3. Log interaction
      await db.execute({
        raw: `INSERT INTO lead_interactions (lead_id, user_id, channel, result, note, tenant_id) VALUES ($1, $2, 'system', 'enrollment_started', 'Ficha de matricula creada', $3)`,
        values: [parseInt(id), userId, tenantId],
      })

      await db.execute({ raw: 'COMMIT' })

      return NextResponse.json({ success: true, enrollmentId: enrollment.id })
    } catch (txError) {
      await db.execute({ raw: 'ROLLBACK' }).catch(() => {})
      throw txError
    }
  } catch (error) {
    console.error('[API][LeadEnroll] error:', error)
    return NextResponse.json({ error: 'Failed to create enrollment' }, { status: 500 })
  }
}
