import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const db = getDb()
  const url = new URL(req.url)
  const hours = parseInt(url.searchParams.get('hours') ?? '24', 10)
  const type = url.searchParams.get('type') // byEndpoint | errorRate | summary | byHour | (null = all)

  try {
    // Ensure table exists before querying
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

    const since = `NOW() - INTERVAL '${hours} hours'`

    // --- Selective query types ---

    if (type === 'summary') {
      const [total, avgLatency, errorRateResult, uniqueIps] = await Promise.all([
        db.query(`SELECT COUNT(*) AS total FROM api_request_logs WHERE created_at >= ${since}`),
        db.query(`SELECT ROUND(AVG(latency_ms)) AS avg FROM api_request_logs WHERE created_at >= ${since}`),
        db.query(`
          SELECT
            COUNT(*) FILTER (WHERE status >= 400) AS errors,
            COUNT(*) FILTER (WHERE status >= 500) AS server_errors,
            COUNT(*) AS total
          FROM api_request_logs
          WHERE created_at >= ${since}
        `),
        db.query(`
          SELECT COUNT(DISTINCT ip_address) AS unique_ips
          FROM api_request_logs
          WHERE created_at >= ${since} AND ip_address IS NOT NULL
        `),
      ])

      const totalRequests = parseInt(total.rows[0]?.total ?? '0', 10)
      const errCount = parseInt(errorRateResult.rows[0]?.errors ?? '0', 10)
      const serverErrCount = parseInt(errorRateResult.rows[0]?.server_errors ?? '0', 10)
      const totalForRate = parseInt(errorRateResult.rows[0]?.total ?? '0', 10)

      return NextResponse.json({
        period: `${hours}h`,
        totalRequests,
        avgLatencyMs: parseInt(avgLatency.rows[0]?.avg ?? '0', 10),
        errorRate: totalForRate > 0 ? Math.round((errCount / totalForRate) * 10000) / 100 : 0,
        serverErrorRate: totalForRate > 0 ? Math.round((serverErrCount / totalForRate) * 10000) / 100 : 0,
        errorCount: errCount,
        serverErrorCount: serverErrCount,
        uniqueIps: parseInt(uniqueIps.rows[0]?.unique_ips ?? '0', 10),
      })
    }

    if (type === 'byEndpoint') {
      const result = await db.query(`
        SELECT
          path,
          method,
          COUNT(*) AS requests,
          ROUND(AVG(latency_ms)) AS avg_latency,
          COUNT(*) FILTER (WHERE status >= 400) AS errors,
          CASE WHEN COUNT(*) > 0
            THEN ROUND((COUNT(*) FILTER (WHERE status >= 400))::numeric / COUNT(*) * 100, 1)
            ELSE 0
          END AS error_rate
        FROM api_request_logs
        WHERE created_at >= ${since}
        GROUP BY path, method
        ORDER BY requests DESC
        LIMIT 10
      `)

      return NextResponse.json({
        period: `${hours}h`,
        endpoints: result.rows.map((r) => ({
          path: r.path,
          method: r.method,
          requests: parseInt(r.requests, 10),
          avgLatencyMs: parseInt(r.avg_latency, 10),
          errors: parseInt(r.errors, 10),
          errorRate: parseFloat(r.error_rate),
        })),
      })
    }

    if (type === 'errorRate') {
      const result = await db.query(`
        SELECT
          path,
          method,
          COUNT(*) AS total_requests,
          COUNT(*) FILTER (WHERE status >= 400) AS errors,
          CASE WHEN COUNT(*) > 0
            THEN ROUND((COUNT(*) FILTER (WHERE status >= 400))::numeric / COUNT(*) * 100, 1)
            ELSE 0
          END AS error_rate
        FROM api_request_logs
        WHERE created_at >= ${since}
        GROUP BY path, method
        HAVING COUNT(*) FILTER (WHERE status >= 400) > 0
        ORDER BY error_rate DESC, errors DESC
        LIMIT 10
      `)

      return NextResponse.json({
        period: `${hours}h`,
        endpoints: result.rows.map((r) => ({
          path: r.path,
          method: r.method,
          totalRequests: parseInt(r.total_requests, 10),
          errors: parseInt(r.errors, 10),
          errorRate: parseFloat(r.error_rate),
        })),
      })
    }

    // --- Default: return all stats (original behavior) ---

    const [total, avgLatency, errorRate, topPaths, topIps, byStatus, byHour] = await Promise.all([
      db.query(`SELECT COUNT(*) AS total FROM api_request_logs WHERE created_at >= ${since}`),
      db.query(`SELECT ROUND(AVG(latency_ms)) AS avg FROM api_request_logs WHERE created_at >= ${since}`),
      db.query(`
        SELECT
          COUNT(*) FILTER (WHERE status >= 500) AS errors,
          COUNT(*) AS total
        FROM api_request_logs
        WHERE created_at >= ${since}
      `),
      db.query(`
        SELECT path, method, COUNT(*) AS requests, ROUND(AVG(latency_ms)) AS avg_latency
        FROM api_request_logs
        WHERE created_at >= ${since}
        GROUP BY path, method
        ORDER BY requests DESC
        LIMIT 10
      `),
      db.query(`
        SELECT ip_address AS ip, COUNT(*) AS requests
        FROM api_request_logs
        WHERE created_at >= ${since} AND ip_address IS NOT NULL
        GROUP BY ip_address
        ORDER BY requests DESC
        LIMIT 10
      `),
      db.query(`
        SELECT status, COUNT(*) AS count
        FROM api_request_logs
        WHERE created_at >= ${since}
        GROUP BY status
        ORDER BY status
      `),
      db.query(`
        SELECT
          DATE_TRUNC('hour', created_at) AS hour,
          COUNT(*) AS requests
        FROM api_request_logs
        WHERE created_at >= ${since}
        GROUP BY hour
        ORDER BY hour
      `),
    ])

    const totalRequests = parseInt(total.rows[0]?.total ?? '0', 10)
    const errorCount = parseInt(errorRate.rows[0]?.errors ?? '0', 10)
    const totalForRate = parseInt(errorRate.rows[0]?.total ?? '0', 10)

    return NextResponse.json({
      period: `${hours}h`,
      summary: {
        totalRequests,
        avgLatencyMs: parseInt(avgLatency.rows[0]?.avg ?? '0', 10),
        errorRate: totalForRate > 0 ? Math.round((errorCount / totalForRate) * 10000) / 100 : 0,
        errorCount,
      },
      topEndpoints: topPaths.rows.map((r) => ({
        path: r.path,
        method: r.method,
        requests: parseInt(r.requests, 10),
        avgLatencyMs: parseInt(r.avg_latency, 10),
      })),
      topIps: topIps.rows.map((r) => ({
        ip: r.ip,
        requests: parseInt(r.requests, 10),
      })),
      byStatus: byStatus.rows.map((r) => ({
        status: parseInt(r.status, 10),
        count: parseInt(r.count, 10),
      })),
      byHour: byHour.rows.map((r) => ({
        hour: r.hour,
        requests: parseInt(r.requests, 10),
      })),
    })
  } catch (error) {
    console.error('[api-stats] error', error)
    return NextResponse.json(
      { error: 'Error al consultar estadísticas' },
      { status: 500 }
    )
  }
}
