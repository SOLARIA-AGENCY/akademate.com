import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { esc, hasColumn, requireTenantContext, resolvePhotoUrl, toPositiveInt } from './_lib/sql'

export const dynamic = 'force-dynamic'

function toNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayloadHMR({ config: configPromise })
    const drizzle = (payload as any).db?.drizzle || (payload as any).db?.pool
    if (!drizzle?.execute) {
      return NextResponse.json({ error: 'Motor SQL no disponible' }, { status: 500 })
    }

    const auth = await requireTenantContext(request, payload)
    if (!auth) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(Math.max(toNumber(searchParams.get('limit'), 25), 1), 200)
    const page = Math.max(toNumber(searchParams.get('page'), 1), 1)
    const status = searchParams.get('status')?.trim() || null
    const query = searchParams.get('q')?.trim() || null

    const hasDni = await hasColumn(drizzle, 'leads', 'dni')
    const hasAddress = await hasColumn(drizzle, 'leads', 'address')
    const hasCity = await hasColumn(drizzle, 'leads', 'city')
    const hasPostalCode = await hasColumn(drizzle, 'leads', 'postal_code')
    const hasBirthDate = await hasColumn(drizzle, 'leads', 'date_of_birth')
    const hasPhotoId = await hasColumn(drizzle, 'leads', 'photo_id')

    const conditions: string[] = []
    if (auth.tenantId) conditions.push(`l.tenant_id = ${auth.tenantId}`)
    if (status) conditions.push(`e.status = '${esc(status)}'`)
    if (query) {
      const q = esc(query)
      const searchParts = [
        `l.first_name ILIKE '%${q}%'`,
        `l.last_name ILIKE '%${q}%'`,
        `l.email ILIKE '%${q}%'`,
        `l.phone ILIKE '%${q}%'`,
        `c.name ILIKE '%${q}%'`,
        `cr.codigo ILIKE '%${q}%'`,
      ]
      if (hasDni) searchParts.push(`l.dni ILIKE '%${q}%'`)
      conditions.push(`(${searchParts.join(' OR ')})`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const countRes = await drizzle.execute(`
      SELECT COUNT(*)::int AS cnt
      FROM enrollments e
      INNER JOIN leads l ON l.id = e.student_id
      LEFT JOIN course_runs cr ON cr.id = e.course_run_id
      LEFT JOIN courses c ON c.id = cr.course_id
      ${whereClause}
    `)
    const countRows = Array.isArray(countRes) ? countRes : (countRes?.rows ?? [])
    const totalDocs = toNumber(countRows[0]?.cnt, 0)
    const offset = (page - 1) * limit

    const optionalProfileSelect = [
      hasDni ? 'l.dni AS dni' : 'NULL::text AS dni',
      hasAddress ? 'l.address AS address' : 'NULL::text AS address',
      hasCity ? 'l.city AS city' : 'NULL::text AS city',
      hasPostalCode ? 'l.postal_code AS postal_code' : 'NULL::text AS postal_code',
      hasBirthDate ? 'l.date_of_birth AS date_of_birth' : 'NULL::date AS date_of_birth',
      hasPhotoId ? 'l.photo_id AS photo_id' : 'NULL::int AS photo_id',
      hasPhotoId ? 'm.filename AS photo_filename' : 'NULL::text AS photo_filename',
      hasPhotoId ? 'm.url AS photo_url' : 'NULL::text AS photo_url',
    ]

    const mediaJoin = hasPhotoId ? 'LEFT JOIN media m ON m.id = l.photo_id' : ''

    const rowsRes = await drizzle.execute(`
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
        ${optionalProfileSelect.join(',\n        ')},
        cr.codigo AS course_run_code,
        cr.start_date AS course_run_start_date,
        cr.end_date AS course_run_end_date,
        cr.status AS course_run_status,
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
      ORDER BY e.created_at DESC, e.id DESC
      LIMIT ${limit} OFFSET ${offset}
    `)

    const rows = Array.isArray(rowsRes) ? rowsRes : (rowsRes?.rows ?? [])

    const docs = rows.map((row: Record<string, unknown>) => ({
      id: toPositiveInt(row.id) ?? row.id,
      status: String(row.status ?? 'pending'),
      payment_status: String(row.payment_status ?? 'pending'),
      total_amount: toNumber(row.total_amount, 0),
      amount_paid: toNumber(row.amount_paid, 0),
      financial_aid_applied: Boolean(row.financial_aid_applied ?? false),
      financial_aid_amount: toNumber(row.financial_aid_amount, 0),
      financial_aid_status: row.financial_aid_status ? String(row.financial_aid_status) : null,
      notes: typeof row.notes === 'string' ? row.notes : null,
      cancellation_reason: typeof row.cancellation_reason === 'string' ? row.cancellation_reason : null,
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
        id: toPositiveInt(row.course_run_id) ?? row.course_run_id,
        code: row.course_run_code ? String(row.course_run_code) : null,
        start_date: row.course_run_start_date,
        end_date: row.course_run_end_date,
        status: row.course_run_status ? String(row.course_run_status) : null,
      },
      course: {
        id: toPositiveInt(row.course_id) ?? row.course_id,
        name: row.course_name ? String(row.course_name) : 'Curso',
      },
      campus: {
        id: toPositiveInt(row.campus_id) ?? row.campus_id,
        name: row.campus_name ? String(row.campus_name) : 'Sin sede',
      },
    }))

    return NextResponse.json({
      docs,
      totalDocs,
      limit,
      page,
      totalPages: Math.ceil(totalDocs / limit),
      hasNextPage: page * limit < totalDocs,
      hasPrevPage: page > 1,
    })
  } catch (error) {
    console.error('[API][Matriculas] GET error:', error)
    return NextResponse.json({ error: 'No se pudieron cargar las matrículas' }, { status: 500 })
  }
}
