import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const db = getDb()
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') ?? '100', 10)
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const offset = (page - 1) * limit

  try {
    const [countResult, rowsResult] = await Promise.all([
      db.query('SELECT COUNT(*) AS total FROM tenants'),
      db.query(
        `SELECT id, name, slug, domain, active,
                contact_email, contact_phone,
                limits_max_users, limits_max_courses, limits_max_leads_per_month,
                limits_storage_quota_m_b, notes,
                created_at, updated_at
         FROM tenants
         ORDER BY created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset],
      ),
    ])

    const total = parseInt(countResult.rows[0]?.total ?? '0', 10)
    const docs = rowsResult.rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      domain: r.domain,
      active: r.active,
      contactEmail: r.contact_email,
      contactPhone: r.contact_phone,
      limits: {
        maxUsers: r.limits_max_users,
        maxCourses: r.limits_max_courses,
        maxLeadsPerMonth: r.limits_max_leads_per_month,
        storageQuotaMB: r.limits_storage_quota_m_b,
      },
      notes: r.notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }))

    return NextResponse.json({ docs, totalDocs: total, limit, page })
  } catch (error) {
    console.error('[ops/tenants] DB error', error)
    return NextResponse.json({ error: 'Error al consultar tenants' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const db = getDb()
  try {
    const body = await request.json()
    const {
      name,
      slug,
      domain,
      contactEmail,
      contactPhone,
      notes,
      limitsMaxUsers = 50,
      limitsMaxCourses = 100,
      limitsMaxLeadsPerMonth = 5000,
      limitsStorageQuotaMB = 10240,
    } = body as {
      name: string
      slug: string
      domain?: string
      contactEmail?: string
      contactPhone?: string
      notes?: string
      limitsMaxUsers?: number
      limitsMaxCourses?: number
      limitsMaxLeadsPerMonth?: number
      limitsStorageQuotaMB?: number
    }

    if (!name || !slug) {
      return NextResponse.json({ error: 'name y slug son requeridos' }, { status: 400 })
    }

    const result = await db.query(
      `INSERT INTO tenants (name, slug, domain, contact_email, contact_phone, notes,
        limits_max_users, limits_max_courses, limits_max_leads_per_month, limits_storage_quota_m_b,
        active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, NOW(), NOW())
       RETURNING id, name, slug`,
      [name, slug, domain ?? null, contactEmail ?? null, contactPhone ?? null, notes ?? null,
       limitsMaxUsers, limitsMaxCourses, limitsMaxLeadsPerMonth, limitsStorageQuotaMB],
    )

    return NextResponse.json({ doc: result.rows[0] }, { status: 201 })
  } catch (error: unknown) {
    const pgError = error as { code?: string }
    if (pgError.code === '23505') {
      return NextResponse.json({ error: 'El slug ya existe' }, { status: 409 })
    }
    console.error('[ops/tenants POST] DB error', error)
    return NextResponse.json({ error: 'Error al crear tenant' }, { status: 500 })
  }
}
