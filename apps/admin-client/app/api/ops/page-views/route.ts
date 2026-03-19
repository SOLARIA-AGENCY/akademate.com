import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { logRequest } from '@/lib/api-logger'

export const dynamic = 'force-dynamic'

const INIT_SQL = `
CREATE TABLE IF NOT EXISTS page_views (
  id BIGSERIAL PRIMARY KEY,
  path VARCHAR(512) NOT NULL,
  ip VARCHAR(64),
  user_agent TEXT,
  referrer TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pv_path ON page_views(path);
CREATE INDEX IF NOT EXISTS idx_pv_viewed_at ON page_views(viewed_at);
`

let tableReady = false

async function ensureTable() {
  if (tableReady) return
  const db = getDb()
  await db.query(INIT_SQL)
  tableReady = true
}

export async function GET(req: Request) {
  const start = Date.now()
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined
  const db = getDb()

  try {
    await ensureTable()

    const url = new URL(req.url)
    const hours = parseInt(url.searchParams.get('hours') ?? '24', 10)
    const pathFilter = url.searchParams.get('path') ?? null

    const params: (number | string)[] = [hours]
    let pathClause = ''
    if (pathFilter) {
      pathClause = ' AND path LIKE $2'
      params.push(`%${pathFilter}%`)
    }

    // Total views and unique IPs in the time window
    const totalsQuery = `
      SELECT
        COUNT(*) AS total_views,
        COUNT(DISTINCT ip) AS unique_ips
      FROM page_views
      WHERE viewed_at > NOW() - INTERVAL '1 hour' * $1${pathClause}
    `
    const totalsResult = await db.query(totalsQuery, params)

    // Top pages by views
    const topPagesQuery = `
      SELECT
        path,
        COUNT(*) AS views,
        COUNT(DISTINCT ip) AS unique_ips
      FROM page_views
      WHERE viewed_at > NOW() - INTERVAL '1 hour' * $1${pathClause}
      GROUP BY path
      ORDER BY views DESC
      LIMIT 10
    `
    const topPagesResult = await db.query(topPagesQuery, params)

    // Views per day (last 7 days max)
    const perDayQuery = `
      SELECT
        DATE(viewed_at) AS day,
        COUNT(*) AS views
      FROM page_views
      WHERE viewed_at > NOW() - INTERVAL '1 hour' * $1${pathClause}
      GROUP BY DATE(viewed_at)
      ORDER BY day DESC
      LIMIT 7
    `
    const perDayResult = await db.query(perDayQuery, params)

    const body = {
      hours,
      totalViews: parseInt(totalsResult.rows[0]?.total_views ?? '0', 10),
      uniqueIps: parseInt(totalsResult.rows[0]?.unique_ips ?? '0', 10),
      topPages: topPagesResult.rows.map((r: Record<string, string | undefined>) => ({
        path: r.path ?? '',
        views: parseInt(r.views ?? '0', 10),
        uniqueIps: parseInt(r.unique_ips ?? '0', 10),
      })),
      perDay: perDayResult.rows.map((r: Record<string, string | undefined>) => ({
        day: r.day ?? '',
        views: parseInt(r.views ?? '0', 10),
      })),
    }

    logRequest({ method: 'GET', path: '/api/ops/page-views', status: 200, latencyMs: Date.now() - start, ip })
    return NextResponse.json(body)
  } catch (error) {
    console.error('[ops/page-views] GET error', error)
    logRequest({ method: 'GET', path: '/api/ops/page-views', status: 500, latencyMs: Date.now() - start, ip })
    return NextResponse.json({ error: 'Error al consultar page views' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const start = Date.now()
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined
  const db = getDb()

  try {
    await ensureTable()

    const body = await req.json()
    const path = body.path
    if (!path || typeof path !== 'string') {
      logRequest({ method: 'POST', path: '/api/ops/page-views', status: 400, latencyMs: Date.now() - start, ip })
      return NextResponse.json({ error: 'path is required' }, { status: 400 })
    }

    const viewIp = body.ip ?? ip ?? null
    const userAgent = body.userAgent ?? null
    const referrer = body.referrer ?? null

    await db.query(
      'INSERT INTO page_views (path, ip, user_agent, referrer) VALUES ($1, $2, $3, $4)',
      [path.substring(0, 512), viewIp?.substring(0, 64) ?? null, userAgent, referrer]
    )

    logRequest({ method: 'POST', path: '/api/ops/page-views', status: 201, latencyMs: Date.now() - start, ip })
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    console.error('[ops/page-views] POST error', error)
    logRequest({ method: 'POST', path: '/api/ops/page-views', status: 500, latencyMs: Date.now() - start, ip })
    return NextResponse.json({ error: 'Error al registrar page view' }, { status: 500 })
  }
}
