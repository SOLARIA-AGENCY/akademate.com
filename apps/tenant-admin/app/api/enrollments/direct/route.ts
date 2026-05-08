import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getAuthenticatedUserContext } from '../../leads/_lib/auth'

export const dynamic = 'force-dynamic'

interface DirectEnrollmentBody {
  firstName?: string
  first_name?: string
  lastName?: string
  last_name?: string
  email?: string
  phone?: string
  courseRunId?: string | number
  course_run_id?: string | number
}

const NON_ENROLLABLE_COURSE_RUN_STATUSES = new Set([
  'enrollment_closed',
  'closed',
  'cancelled',
  'inactive',
  'archived',
  'draft',
  'published',
])

function toPositiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) return parseInt(value, 10)
  return null
}

function normalizeName(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.trim().replace(/\s+/g, ' ')
}

function normalizeEmail(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.trim().toLowerCase()
}

function normalizePhone(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  const digits = raw.replace(/[^\d]/g, '')
  if (!digits) return ''

  const core =
    digits.length === 9
      ? digits
      : digits.startsWith('34') && digits.length >= 11
      ? digits.slice(2, 11)
      : digits.slice(-9)

  if (core.length !== 9) return ''
  return `+34 ${core.slice(0, 3)} ${core.slice(3, 6)} ${core.slice(6, 9)}`
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const drizzle = (payload as any).db?.drizzle || (payload as any).db?.pool

    const authUser = await getAuthenticatedUserContext(request, payload)
    if (!authUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    let body: DirectEnrollmentBody
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 })
    }

    const firstName = normalizeName(body.firstName ?? body.first_name)
    const lastName = normalizeName(body.lastName ?? body.last_name)
    const email = normalizeEmail(body.email)
    const phone = normalizePhone(body.phone)
    const courseRunId = toPositiveInt(body.courseRunId ?? body.course_run_id)

    const missingFields: string[] = []
    if (!firstName) missingFields.push('firstName')
    if (!lastName) missingFields.push('lastName')
    if (!email) missingFields.push('email')
    if (!phone) missingFields.push('phone')
    if (!courseRunId) missingFields.push('courseRunId')

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Faltan campos requeridos: ${missingFields.join(', ')}` },
        { status: 400 },
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    const courseRun = (await payload.findByID({
      collection: 'course-runs',
      id: courseRunId,
      depth: 0,
      overrideAccess: true,
    })) as any

    if (!courseRun) {
      return NextResponse.json({ error: 'Convocatoria no encontrada' }, { status: 404 })
    }

    const courseRunTenantId = toPositiveInt(courseRun.tenant?.id ?? courseRun.tenant)
    if (courseRunTenantId && authUser.tenantId && courseRunTenantId !== authUser.tenantId) {
      return NextResponse.json({ error: 'Convocatoria no encontrada' }, { status: 404 })
    }

    const courseRunStatus = String(courseRun.status ?? '')
      .trim()
      .toLowerCase()

    if (courseRunStatus && NON_ENROLLABLE_COURSE_RUN_STATUSES.has(courseRunStatus)) {
      return NextResponse.json(
        { error: 'La convocatoria no está abierta para matrícula' },
        { status: 422 },
      )
    }

    const userId = toPositiveInt(authUser.userId)
    if (!userId) {
      return NextResponse.json({ error: 'Usuario autenticado invalido' }, { status: 401 })
    }

    const tenantId = courseRunTenantId ?? authUser.tenantId ?? 1
    const courseId = toPositiveInt(courseRun.course?.id ?? courseRun.course)

    const existingLeadQuery =
      typeof (payload as any).find === 'function'
        ? await payload.find({
            collection: 'leads',
            where: {
              and: [{ email: { equals: email } }, { tenant: { equals: tenantId } }],
            } as any,
            depth: 0,
            limit: 1,
            overrideAccess: true,
          })
        : { docs: [] as any[] }

    let lead = existingLeadQuery.docs?.[0] as any
    if (!lead) {
      const leadData: Record<string, unknown> = {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        status: 'enrolling',
        priority: 'high',
        gdpr_consent: true,
        privacy_policy_accepted: true,
        consent_timestamp: new Date().toISOString(),
        tenant: tenantId,
        ...(courseId ? { course: courseId } : {}),
      }

      lead = await payload.create({
        collection: 'leads',
        overrideAccess: true,
        data: leadData as any,
      })
    } else {
      const leadId = toPositiveInt(lead.id)
      if (leadId && drizzle?.execute) {
        await drizzle.execute(`
          UPDATE leads
          SET first_name = '${firstName.replace(/'/g, "''")}',
              last_name = '${lastName.replace(/'/g, "''")}',
              phone = '${phone.replace(/'/g, "''")}',
              status = 'enrolling',
              updated_at = NOW()
          WHERE id = ${leadId}
        `).catch(() => {})
      }
    }

    const existingEnrollment =
      typeof (payload as any).find === 'function'
        ? await payload.find({
            collection: 'enrollments',
            where: {
              and: [{ student: { equals: lead.id } }, { course_run: { equals: courseRunId } }],
            } as any,
            depth: 0,
            limit: 1,
            overrideAccess: true,
          })
        : { docs: [] as any[] }
    const existing = existingEnrollment.docs?.[0] as any
    if (existing?.id) {
      return NextResponse.json({
        success: true,
        alreadyExists: true,
        mode: 'direct',
        leadId: lead.id,
        enrollmentId: existing.id,
      })
    }

    const enrollment = await payload.create({
      collection: 'enrollments',
      overrideAccess: true,
      data: {
        student: lead.id,
        course_run: courseRunId,
        status: 'pending',
        payment_status: 'pending',
        total_amount: 0,
        amount_paid: 0,
        enrolled_at: new Date().toISOString(),
      } as any,
    })

    const leadId = toPositiveInt(lead.id)
    if (leadId && drizzle?.execute) {
      try {
        await drizzle.execute(`UPDATE leads SET status = 'enrolling', enrollment_id = ${enrollment.id}, updated_at = NOW() WHERE id = ${leadId}`)
        await drizzle.execute(`INSERT INTO lead_interactions (lead_id, user_id, channel, result, note, tenant_id) VALUES (${leadId}, ${userId}, 'system', 'enrollment_started', 'Matricula directa creada', ${tenantId})`)
      } catch (sqlError) {
        console.warn('[API][DirectEnrollment] SQL enrichment failed:', sqlError)
        await payload.update({
          collection: 'leads',
          id: lead.id,
          data: { status: 'enrolling' } as any,
          overrideAccess: true,
        })
      }
    } else {
      await payload.update({
        collection: 'leads',
        id: lead.id,
        data: { status: 'enrolling' } as any,
        overrideAccess: true,
      })
    }

    return NextResponse.json({
      success: true,
      mode: 'direct',
      leadId: lead.id,
      enrollmentId: enrollment.id,
    })
  } catch (error) {
    console.error('[API][DirectEnrollment] error:', error)
    return NextResponse.json({ error: 'No se pudo crear la matrícula directa' }, { status: 500 })
  }
}
