import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface Alert {
  type: 'rate_abuse' | 'high_error_rate' | 'traffic_domination'
  severity: 'warning' | 'critical'
  message: string
  metadata: Record<string, unknown>
}

export async function GET() {
  const db = getDb()
  const alerts: Alert[] = []

  try {
    // Ensure table exists
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

    // 1. Any IP with >200 requests in the last 5 minutes
    const rateAbuse = await db.query(`
      SELECT ip_address AS ip, COUNT(*) AS requests
      FROM api_request_logs
      WHERE created_at >= NOW() - INTERVAL '5 minutes'
        AND ip_address IS NOT NULL
      GROUP BY ip_address
      HAVING COUNT(*) > 200
      ORDER BY requests DESC
    `)

    for (const row of rateAbuse.rows) {
      const requests = parseInt(row.requests, 10)
      alerts.push({
        type: 'rate_abuse',
        severity: requests > 500 ? 'critical' : 'warning',
        message: `IP ${row.ip} ha realizado ${requests} requests en los ultimos 5 minutos`,
        metadata: { ip: row.ip, requests, window: '5m' },
      })
    }

    // 2. Any endpoint with >50% error rate in the last hour (min 10 requests)
    const highErrorRate = await db.query(`
      SELECT
        path,
        method,
        COUNT(*) AS total_requests,
        COUNT(*) FILTER (WHERE status >= 400) AS errors,
        ROUND((COUNT(*) FILTER (WHERE status >= 400))::numeric / COUNT(*) * 100, 1) AS error_rate
      FROM api_request_logs
      WHERE created_at >= NOW() - INTERVAL '1 hour'
      GROUP BY path, method
      HAVING COUNT(*) >= 10
        AND (COUNT(*) FILTER (WHERE status >= 400))::numeric / COUNT(*) > 0.5
      ORDER BY error_rate DESC
    `)

    for (const row of highErrorRate.rows) {
      const errorRate = parseFloat(row.error_rate)
      alerts.push({
        type: 'high_error_rate',
        severity: errorRate > 80 ? 'critical' : 'warning',
        message: `${row.method} ${row.path} tiene ${errorRate}% de tasa de error (${row.errors}/${row.total_requests} requests)`,
        metadata: {
          path: row.path,
          method: row.method,
          errorRate,
          errors: parseInt(row.errors, 10),
          totalRequests: parseInt(row.total_requests, 10),
          window: '1h',
        },
      })
    }

    // 3. Any single IP responsible for >30% of all traffic in the last hour
    const trafficDomination = await db.query(`
      WITH hourly_total AS (
        SELECT COUNT(*) AS total
        FROM api_request_logs
        WHERE created_at >= NOW() - INTERVAL '1 hour'
      ),
      ip_counts AS (
        SELECT ip_address AS ip, COUNT(*) AS requests
        FROM api_request_logs
        WHERE created_at >= NOW() - INTERVAL '1 hour'
          AND ip_address IS NOT NULL
        GROUP BY ip_address
      )
      SELECT
        ic.ip,
        ic.requests,
        ht.total AS total_requests,
        ROUND(ic.requests::numeric / NULLIF(ht.total, 0) * 100, 1) AS traffic_pct
      FROM ip_counts ic
      CROSS JOIN hourly_total ht
      WHERE ht.total > 0
        AND ic.requests::numeric / ht.total > 0.3
      ORDER BY ic.requests DESC
    `)

    for (const row of trafficDomination.rows) {
      const pct = parseFloat(row.traffic_pct)
      alerts.push({
        type: 'traffic_domination',
        severity: pct > 60 ? 'critical' : 'warning',
        message: `IP ${row.ip} representa el ${pct}% del trafico total (${row.requests}/${row.total_requests} requests en 1h)`,
        metadata: {
          ip: row.ip,
          requests: parseInt(row.requests, 10),
          totalRequests: parseInt(row.total_requests, 10),
          trafficPct: pct,
          window: '1h',
        },
      })
    }

    return NextResponse.json({ alerts })
  } catch (error) {
    console.error('[api-stats/alerts] error', error)
    return NextResponse.json(
      { error: 'Error al verificar alertas' },
      { status: 500 }
    )
  }
}
