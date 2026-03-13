import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const db = getDb()

  try {
    const [
      tenantsResult,
      activeTenantsResult,
      usersResult,
      coursesResult,
      enrollmentsResult,
    ] = await Promise.all([
      db.query('SELECT COUNT(*) AS total FROM tenants'),
      db.query('SELECT COUNT(*) AS total FROM tenants WHERE active = true'),
      db.query('SELECT COUNT(*) AS total FROM users'),
      db.query('SELECT COUNT(*) AS total FROM courses').catch(() => ({ rows: [{ total: '0' }] })),
      db.query('SELECT COUNT(*) AS total FROM enrollments').catch(() => ({ rows: [{ total: '0' }] })),
    ])

    const tenantsTotal = parseInt(tenantsResult.rows[0]?.total ?? '0', 10)
    const activeTenantsTotal = parseInt(activeTenantsResult.rows[0]?.total ?? '0', 10)
    const usersTotal = parseInt(usersResult.rows[0]?.total ?? '0', 10)
    const coursesTotal = parseInt(coursesResult.rows[0]?.total ?? '0', 10)
    const enrollmentsTotal = parseInt(enrollmentsResult.rows[0]?.total ?? '0', 10)

    return NextResponse.json({
      tenants: {
        total: tenantsTotal,
        active: activeTenantsTotal,
        trial: tenantsTotal - activeTenantsTotal,
      },
      users: { total: usersTotal },
      courses: { total: coursesTotal },
      enrollments: { total: enrollmentsTotal },
    })
  } catch (error) {
    console.error('[ops/metrics] DB error', error)
    return NextResponse.json({ error: 'Error al consultar métricas' }, { status: 500 })
  }
}
