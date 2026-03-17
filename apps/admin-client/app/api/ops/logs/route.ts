import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const db = getDb()
  const url = new URL(req.url)

  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, Math.max(10, parseInt(url.searchParams.get('limit') ?? '50', 10)))
  const offset = (page - 1) * limit

  const path = url.searchParams.get('path') ?? ''
  const method = url.searchParams.get('method') ?? ''
  const status = url.searchParams.get('status') ?? ''
  const ip = url.searchParams.get('ip') ?? ''
  const hours = parseInt(url.searchParams.get('hours') ?? '24', 10)

  const conditions: string[] = [`created_at >= NOW() - INTERVAL '${hours} hours'`]
  const params: (string | number)[] = []

  if (path) {
    params.push(`%${path}%`)
    conditions.push(`path ILIKE $${params.length}`)
  }
  if (method) {
    params.push(method.toUpperCase())
    conditions.push(`method = $${params.length}`)
  }
  if (status) {
    const s = parseInt(status, 10)
    if (!isNaN(s)) {
      params.push(s)
      conditions.push(`status = $${params.length}`)
    }
  }
  if (ip) {
    params.push(`%${ip}%`)
    conditions.push(`ip_address ILIKE $${params.length}`)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS api_request_logs (
        id BIGSERIAL PRIMARY KEY,
        method VARCHAR(10) NOT NULL,
        path VARCHAR(512) NOT NULL,
        status SMALLINT NOT NULL,
        latency_ms INTEGER NOT NULL,
        ip_address VARCHAR(64),
        user_agent TEXT,
        tenant_id VARCHAR(64),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    const [rows, countResult] = await Promise.all([
      db.query(
        `SELECT id, method, path, status, latency_ms, ip_address, user_agent, tenant_id, created_at
         FROM api_request_logs
         ${where}
         ORDER BY created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      db.query(
        `SELECT COUNT(*) AS total FROM api_request_logs ${where}`,
        params
      ),
    ])

    const total = parseInt(countResult.rows[0]?.total ?? '0', 10)

    return NextResponse.json({
      docs: rows.rows.map((r) => ({
        id: r.id.toString(),
        method: r.method,
        path: r.path,
        status: r.status,
        latencyMs: r.latency_ms,
        ip: r.ip_address,
        userAgent: r.user_agent,
        tenantId: r.tenant_id,
        createdAt: r.created_at,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('[ops/logs] error', error)
    return NextResponse.json({ error: 'Error al consultar logs' }, { status: 500 })
  }
}
