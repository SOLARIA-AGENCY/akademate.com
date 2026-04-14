import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { esc, hasColumn, requireTenantContext, resolvePhotoUrl, toNullableNumber, toPositiveInt } from '../_lib/sql'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string }>
}

const ENROLLMENT_STATUSES = new Set(['pending', 'confirmed', 'waitlisted', 'cancelled', 'completed', 'withdrawn'])
const PAYMENT_STATUSES = new Set(['pending', 'partial', 'paid', 'refunded', 'waived'])
const FINANCIAL_AID_STATUSES = new Set(['none', 'pending', 'approved', 'rejected'])

function toBoolean(value: unknown): boolean | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    if (value === 'true') return true
    if (value === 'false') return false
  }
  return null
}

function normalizeNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  return text.length > 0 ? text : null
}

async function getMatriculaDetail(
  drizzle: any,
  matriculaId: number,
  tenantId: number | null,
  profileColumns: {
    hasDni: boolean
    hasAddress: boolean
    hasCity: boolean
    hasPostalCode: boolean
    hasBirthDate: boolean
    hasPhotoId: boolean
  },
): Promise<Record<string, unknown> | null> {
  const conditions = [`e.id = ${matriculaId}`]
  if (tenantId) conditions.push(`l.tenant_id = ${tenantId}`)

  const whereClause = `WHERE ${conditions.join(' AND ')}`
  const optionalProfileSelect = [
    profileColumns.hasDni ? 'l.dni AS dni' : 'NULL::text AS dni',
    profileColumns.hasAddress ? 'l.address AS address' : 'NULL::text AS address',
    profileColumns.hasCity ? 'l.city AS city' : 'NULL::text AS city',
    profileColumns.hasPostalCode ? 'l.postal_code AS postal_code' : 'NULL::text AS postal_code',
    profileColumns.hasBirthDate ? 'l.date_of_birth AS date_of_birth' : 'NULL::date AS date_of_birth',
    profileColumns.hasPhotoId ? 'l.photo_id AS photo_id' : 'NULL::int AS photo_id',
    profileColumns.hasPhotoId ? 'm.filename AS photo_filename' : 'NULL::text AS photo_filename',
    profileColumns.hasPhotoId ? 'm.url AS photo_url' : 'NULL::text AS photo_url',
  ]

  const mediaJoin = profileColumns.hasPhotoId ? 'LEFT JOIN media m ON m.id = l.photo_id' : ''

  const detailRes = await drizzle.execute(`
    SELECT
      e.id,
      e.student_id,
      e.course_run_id,
      e.status,
      e.payment_status,
      e.total_amount,
      e.amount_paid,
      e.financial_aid_applied,
      e.financial_aid_amount,
      e.financial_aid_status,
      e.notes,
      e.cancellation_reason,
      e.attendance_percentage,
      e.final_grade,
      e.certificate_issued,
      e.certificate_url,
      e.enrolled_at,
      e.confirmed_at,
      e.completed_at,
      e.cancelled_at,
      e.created_at,
      e.updated_at,
      l.first_name,
      l.last_name,
      l.email,
      l.phone,
      ${optionalProfileSelect.join(',\n      ')},
      cr.id AS course_run_id_fk,
      cr.codigo AS course_run_code,
      cr.start_date AS course_run_start_date,
      cr.end_date AS course_run_end_date,
      cr.status AS course_run_status,
      cr.max_students,
      cr.current_enrollments,
      c.id AS course_id,
      c.name AS course_name,
      cp.id AS campus_id,
      cp.name AS campus_name
    FROM enrollments e
    INNER JOIN leads l ON l.id = e.student_id
    LEFT JOIN course_runs cr ON cr.id = e.course_run_id
    LEFT JOIN courses c ON c.id = cr.course_id
    LEFT JOIN campuses cp ON cp.id = cr.campus_id
    ${mediaJoin}
    ${whereClause}
    LIMIT 1
  `)

  const rows = Array.isArray(detailRes) ? detailRes : (detailRes?.rows ?? [])
  if (!rows[0]) return null

  const row = rows[0] as Record<string, unknown>

  const runsRes = await drizzle.execute(`
    SELECT
      cr.id,
      cr.codigo,
      cr.status,
      cr.start_date,
      cr.end_date,
      c.name AS course_name,
      cp.name AS campus_name
    FROM course_runs cr
    LEFT JOIN courses c ON c.id = cr.course_id
    LEFT JOIN campuses cp ON cp.id = cr.campus_id
    ${tenantId ? `WHERE cr.tenant_id = ${tenantId}` : ''}
    ORDER BY cr.start_date DESC, cr.id DESC
    LIMIT 300
  `)
  const runRows = Array.isArray(runsRes) ? runsRes : (runsRes?.rows ?? [])

  return {
    id: toPositiveInt(row.id) ?? row.id,
    status: String(row.status ?? 'pending'),
    payment_status: String(row.payment_status ?? 'pending'),
    total_amount: toNullableNumber(row.total_amount) ?? 0,
    amount_paid: toNullableNumber(row.amount_paid) ?? 0,
    financial_aid_applied: Boolean(row.financial_aid_applied ?? false),
    financial_aid_amount: toNullableNumber(row.financial_aid_amount) ?? 0,
    financial_aid_status: row.financial_aid_status ? String(row.financial_aid_status) : null,
    notes: typeof row.notes === 'string' ? row.notes : null,
    cancellation_reason: typeof row.cancellation_reason === 'string' ? row.cancellation_reason : null,
    attendance_percentage: toNullableNumber(row.attendance_percentage),
    final_grade: toNullableNumber(row.final_grade),
    certificate_issued: Boolean(row.certificate_issued ?? false),
    certificate_url: typeof row.certificate_url === 'string' ? row.certificate_url : null,
    enrolled_at: row.enrolled_at,
    confirmed_at: row.confirmed_at,
    completed_at: row.completed_at,
    cancelled_at: row.cancelled_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    lead: {
      id: toPositiveInt(row.student_id) ?? row.student_id,
      first_name: String(row.first_name ?? ''),
      last_name: String(row.last_name ?? ''),
      email: String(row.email ?? ''),
      phone: String(row.phone ?? ''),
      dni: row.dni ? String(row.dni) : null,
      address: row.address ? String(row.address) : null,
      city: row.city ? String(row.city) : null,
      postal_code: row.postal_code ? String(row.postal_code) : null,
      date_of_birth: row.date_of_birth,
      photo_id: toPositiveInt(row.photo_id),
      photo_url: resolvePhotoUrl(row),
    },
    course_run: {
      id: toPositiveInt(row.course_run_id_fk) ?? toPositiveInt(row.course_run_id),
      code: row.course_run_code ? String(row.course_run_code) : null,
      start_date: row.course_run_start_date,
      end_date: row.course_run_end_date,
      status: row.course_run_status ? String(row.course_run_status) : null,
      max_students: toNullableNumber(row.max_students),
      current_enrollments: toNullableNumber(row.current_enrollments),
    },
    course: {
      id: toPositiveInt(row.course_id) ?? row.course_id,
      name: row.course_name ? String(row.course_name) : 'Curso',
    },
    campus: {
      id: toPositiveInt(row.campus_id) ?? row.campus_id,
      name: row.campus_name ? String(row.campus_name) : 'Sin sede',
    },
    available_course_runs: runRows.map((run: Record<string, unknown>) => ({
      id: toPositiveInt(run.id) ?? run.id,
      code: run.codigo ? String(run.codigo) : null,
      status: run.status ? String(run.status) : null,
      start_date: run.start_date,
      end_date: run.end_date,
      course_name: run.course_name ? String(run.course_name) : 'Curso',
      campus_name: run.campus_name ? String(run.campus_name) : 'Sin sede',
    })),
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const matriculaId = toPositiveInt(id)
    if (!matriculaId) {
      return NextResponse.json({ error: 'ID de matrícula inválido' }, { status: 400 })
    }

    const payload = await getPayloadHMR({ config: configPromise })
    const drizzle = (payload as any).db?.drizzle || (payload as any).db?.pool
    if (!drizzle?.execute) {
      return NextResponse.json({ error: 'Motor SQL no disponible' }, { status: 500 })
    }

    const auth = await requireTenantContext(request, payload)
    if (!auth) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const profileColumns = {
      hasDni: await hasColumn(drizzle, 'leads', 'dni'),
      hasAddress: await hasColumn(drizzle, 'leads', 'address'),
      hasCity: await hasColumn(drizzle, 'leads', 'city'),
      hasPostalCode: await hasColumn(drizzle, 'leads', 'postal_code'),
      hasBirthDate: await hasColumn(drizzle, 'leads', 'date_of_birth'),
      hasPhotoId: await hasColumn(drizzle, 'leads', 'photo_id'),
    }

    const detail = await getMatriculaDetail(drizzle, matriculaId, auth.tenantId, profileColumns)
    if (!detail) {
      return NextResponse.json({ error: 'Matrícula no encontrada' }, { status: 404 })
    }

    return NextResponse.json(detail)
  } catch (error) {
    console.error('[API][Matriculas][GET] error:', error)
    return NextResponse.json({ error: 'No se pudo obtener la matrícula' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const matriculaId = toPositiveInt(id)
    if (!matriculaId) {
      return NextResponse.json({ error: 'ID de matrícula inválido' }, { status: 400 })
    }

    const payload = await getPayloadHMR({ config: configPromise })
    const drizzle = (payload as any).db?.drizzle || (payload as any).db?.pool
    if (!drizzle?.execute) {
      return NextResponse.json({ error: 'Motor SQL no disponible' }, { status: 500 })
    }

    const auth = await requireTenantContext(request, payload)
    if (!auth) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const profileColumns = {
      hasDni: await hasColumn(drizzle, 'leads', 'dni'),
      hasAddress: await hasColumn(drizzle, 'leads', 'address'),
      hasCity: await hasColumn(drizzle, 'leads', 'city'),
      hasPostalCode: await hasColumn(drizzle, 'leads', 'postal_code'),
      hasBirthDate: await hasColumn(drizzle, 'leads', 'date_of_birth'),
      hasPhotoId: await hasColumn(drizzle, 'leads', 'photo_id'),
    }

    const baseRes = await drizzle.execute(`
      SELECT e.id, e.student_id
      FROM enrollments e
      INNER JOIN leads l ON l.id = e.student_id
      WHERE e.id = ${matriculaId}
      ${auth.tenantId ? `AND l.tenant_id = ${auth.tenantId}` : ''}
      LIMIT 1
    `)
    const baseRows = Array.isArray(baseRes) ? baseRes : (baseRes?.rows ?? [])
    const baseRow = baseRows[0] as Record<string, unknown> | undefined
    if (!baseRow) {
      return NextResponse.json({ error: 'Matrícula no encontrada' }, { status: 404 })
    }

    const studentId = toPositiveInt(baseRow.student_id)
    if (!studentId) {
      return NextResponse.json({ error: 'Alumno de matrícula inválido' }, { status: 500 })
    }

    const body = await request.json().catch(() => ({} as Record<string, unknown>))
    const enrollmentBody = (body.enrollment && typeof body.enrollment === 'object'
      ? body.enrollment
      : body) as Record<string, unknown>
    const leadBody = (body.lead && typeof body.lead === 'object' ? body.lead : {}) as Record<string, unknown>

    const enrollmentSets: string[] = []
    const leadSets: string[] = []

    const status = normalizeNullableString(enrollmentBody.status)
    if (status !== null) {
      if (!ENROLLMENT_STATUSES.has(status)) {
        return NextResponse.json({ error: 'Estado de matrícula inválido' }, { status: 400 })
      }
      enrollmentSets.push(`status = '${esc(status)}'`)
    }

    const paymentStatus = normalizeNullableString(enrollmentBody.payment_status)
    if (paymentStatus !== null) {
      if (!PAYMENT_STATUSES.has(paymentStatus)) {
        return NextResponse.json({ error: 'Estado de pago inválido' }, { status: 400 })
      }
      enrollmentSets.push(`payment_status = '${esc(paymentStatus)}'`)
    }

    const totalAmount = toNullableNumber(enrollmentBody.total_amount)
    if (totalAmount !== null) enrollmentSets.push(`total_amount = ${totalAmount}`)

    const amountPaid = toNullableNumber(enrollmentBody.amount_paid)
    if (amountPaid !== null) enrollmentSets.push(`amount_paid = ${amountPaid}`)

    const financialAidApplied = toBoolean(enrollmentBody.financial_aid_applied)
    if (financialAidApplied !== null) enrollmentSets.push(`financial_aid_applied = ${financialAidApplied ? 'TRUE' : 'FALSE'}`)

    const financialAidAmount = toNullableNumber(enrollmentBody.financial_aid_amount)
    if (financialAidAmount !== null) enrollmentSets.push(`financial_aid_amount = ${financialAidAmount}`)

    const financialAidStatus = normalizeNullableString(enrollmentBody.financial_aid_status)
    if (financialAidStatus !== null) {
      if (!FINANCIAL_AID_STATUSES.has(financialAidStatus)) {
        return NextResponse.json({ error: 'Estado de ayuda financiera inválido' }, { status: 400 })
      }
      enrollmentSets.push(`financial_aid_status = '${esc(financialAidStatus)}'`)
    }

    const notes = normalizeNullableString(enrollmentBody.notes)
    if (notes !== null || enrollmentBody.notes === '') {
      enrollmentSets.push(notes === null ? 'notes = NULL' : `notes = '${esc(notes)}'`)
    }

    const cancellationReason = normalizeNullableString(enrollmentBody.cancellation_reason)
    if (cancellationReason !== null || enrollmentBody.cancellation_reason === '') {
      enrollmentSets.push(
        cancellationReason === null
          ? 'cancellation_reason = NULL'
          : `cancellation_reason = '${esc(cancellationReason)}'`,
      )
    }

    const courseRunId = toPositiveInt(enrollmentBody.course_run_id ?? enrollmentBody.courseRunId)
    if (courseRunId) {
      const runRes = await drizzle.execute(`
        SELECT id, tenant_id
        FROM course_runs
        WHERE id = ${courseRunId}
        LIMIT 1
      `)
      const runRows = Array.isArray(runRes) ? runRes : (runRes?.rows ?? [])
      const run = runRows[0] as Record<string, unknown> | undefined
      const runTenantId = toPositiveInt(run?.tenant_id)
      if (!run || (auth.tenantId && runTenantId && runTenantId !== auth.tenantId)) {
        return NextResponse.json({ error: 'Convocatoria inválida' }, { status: 400 })
      }
      enrollmentSets.push(`course_run_id = ${courseRunId}`)
    }

    const firstName = normalizeNullableString(leadBody.first_name)
    if (firstName !== null) leadSets.push(`first_name = '${esc(firstName)}'`)

    const lastName = normalizeNullableString(leadBody.last_name)
    if (lastName !== null) leadSets.push(`last_name = '${esc(lastName)}'`)

    const email = normalizeNullableString(leadBody.email)
    if (email !== null) leadSets.push(`email = '${esc(email.toLowerCase())}'`)

    const phone = normalizeNullableString(leadBody.phone)
    if (phone !== null) leadSets.push(`phone = '${esc(phone)}'`)

    if (profileColumns.hasDni) {
      const dni = normalizeNullableString(leadBody.dni)
      if (dni !== null || leadBody.dni === '') {
        leadSets.push(dni === null ? 'dni = NULL' : `dni = '${esc(dni)}'`)
      }
    }

    if (profileColumns.hasAddress) {
      const address = normalizeNullableString(leadBody.address)
      if (address !== null || leadBody.address === '') {
        leadSets.push(address === null ? 'address = NULL' : `address = '${esc(address)}'`)
      }
    }

    if (profileColumns.hasCity) {
      const city = normalizeNullableString(leadBody.city)
      if (city !== null || leadBody.city === '') {
        leadSets.push(city === null ? 'city = NULL' : `city = '${esc(city)}'`)
      }
    }

    if (profileColumns.hasPostalCode) {
      const postalCode = normalizeNullableString(leadBody.postal_code)
      if (postalCode !== null || leadBody.postal_code === '') {
        leadSets.push(postalCode === null ? 'postal_code = NULL' : `postal_code = '${esc(postalCode)}'`)
      }
    }

    if (profileColumns.hasBirthDate) {
      const birthDate = normalizeNullableString(leadBody.date_of_birth)
      if (birthDate !== null || leadBody.date_of_birth === '') {
        leadSets.push(birthDate === null ? 'date_of_birth = NULL' : `date_of_birth = '${esc(birthDate)}'`)
      }
    }

    if (profileColumns.hasPhotoId) {
      const photoId = toPositiveInt(leadBody.photo_id)
      if (photoId) {
        leadSets.push(`photo_id = ${photoId}`)
      } else if (leadBody.photo_id === null || leadBody.photo_id === '') {
        leadSets.push('photo_id = NULL')
      }
    }

    if (enrollmentSets.length > 0) {
      enrollmentSets.push('updated_at = NOW()')
      await drizzle.execute(`
        UPDATE enrollments
        SET ${enrollmentSets.join(', ')}
        WHERE id = ${matriculaId}
      `)
    }

    if (leadSets.length > 0) {
      leadSets.push('updated_at = NOW()')
      await drizzle.execute(`
        UPDATE leads
        SET ${leadSets.join(', ')}
        WHERE id = ${studentId}
      `)
    }

    const detail = await getMatriculaDetail(drizzle, matriculaId, auth.tenantId, profileColumns)
    return NextResponse.json({ success: true, doc: detail })
  } catch (error) {
    console.error('[API][Matriculas][PATCH] error:', error)
    return NextResponse.json({ error: 'No se pudo actualizar la matrícula' }, { status: 500 })
  }
}
