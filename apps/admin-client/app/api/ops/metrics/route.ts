import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { logRequest } from '@/lib/api-logger'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const start = Date.now()
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined
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

    const body = {
      tenants: {
        total: tenantsTotal,
        active: activeTenantsTotal,
        trial: tenantsTotal - activeTenantsTotal,
      },
      users: { total: usersTotal },
      courses: { total: coursesTotal },
      enrollments: { total: enrollmentsTotal },
    }
    logRequest({ method: 'GET', path: '/api/ops/metrics', status: 200, latencyMs: Date.now() - start, ip })
    return NextResponse.json(body)
  } catch (error) {
    console.error('[ops/metrics] DB error', error)
    logRequest({ method: 'GET', path: '/api/ops/metrics', status: 500, latencyMs: Date.now() - start, ip })
    return NextResponse.json({ error: 'Error al consultar métricas' }, { status: 500 })
  }
}
