import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS service_health_history (
    id BIGSERIAL PRIMARY KEY,
    service_name VARCHAR(128) NOT NULL,
    status VARCHAR(20) NOT NULL,
    latency_ms INTEGER,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_health_history_service ON service_health_history(service_name);
  CREATE INDEX IF NOT EXISTS idx_health_history_checked ON service_health_history(checked_at);
`

let tableReady = false

async function ensureTable() {
  if (tableReady) return
  const db = getDb()
  await db.query(CREATE_TABLE_SQL)
  tableReady = true
}

/**
 * GET /api/ops/service-health/history?service=PostgreSQL&limit=20
 *
 * Returns the last N health checks per service.
 * If `service` query param is provided, returns only that service.
 * Default limit: 20.
 */
export async function GET(req: Request) {
  try {
    await ensureTable()
    const db = getDb()
    const url = new URL(req.url)
    const serviceName = url.searchParams.get('service')
    const limit = Math.min(Number(url.searchParams.get('limit')) || 20, 100)

    if (serviceName) {
      const { rows } = await db.query(
        `SELECT service_name, status, latency_ms, checked_at
         FROM service_health_history
         WHERE service_name = $1
         ORDER BY checked_at DESC
         LIMIT $2`,
        [serviceName, limit]
      )
      return NextResponse.json({ service: serviceName, history: rows })
    }

    // Return grouped by service — last N entries each
    const { rows } = await db.query(
      `SELECT service_name, status, latency_ms, checked_at
       FROM (
         SELECT *,
           ROW_NUMBER() OVER (PARTITION BY service_name ORDER BY checked_at DESC) AS rn
         FROM service_health_history
       ) sub
       WHERE rn <= $1
       ORDER BY service_name, checked_at ASC`,
      [limit]
    )

    // Group by service
    const grouped: Record<string, typeof rows> = {}
    for (const row of rows) {
      const key = row.service_name
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(row)
    }

    return NextResponse.json({ history: grouped })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error fetching history' },
      { status: 500 }
    )
  }
}
