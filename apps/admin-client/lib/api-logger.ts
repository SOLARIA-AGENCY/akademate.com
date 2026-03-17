import { getDb } from '@/lib/db'

export interface RequestLogEntry {
  method: string
  path: string
  status: number
  latencyMs: number
  ip?: string
  userAgent?: string
  tenantId?: string
}

const CREATE_TABLE_SQL = `
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
  );
  CREATE INDEX IF NOT EXISTS idx_api_logs_path ON api_request_logs(path);
  CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_request_logs(created_at);
  CREATE INDEX IF NOT EXISTS idx_api_logs_status ON api_request_logs(status);
`

let tableReady = false

async function ensureTable() {
  if (tableReady) return
  const db = getDb()
  await db.query(CREATE_TABLE_SQL)
  tableReady = true
}

export function logRequest(entry: RequestLogEntry): void {
  // Fire-and-forget — never block the response
  setImmediate(async () => {
    try {
      await ensureTable()
      const db = getDb()
      await db.query(
        `INSERT INTO api_request_logs (method, path, status, latency_ms, ip_address, user_agent, tenant_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          entry.method.toUpperCase(),
          entry.path,
          entry.status,
          entry.latencyMs,
          entry.ip ?? null,
          entry.userAgent ?? null,
          entry.tenantId ?? null,
        ]
      )
    } catch {
      // Logging must never crash the app
    }
  })
}

/**
 * Wraps a route handler to automatically log request and response.
 * Usage: export const GET = withLogging(async (req) => { ... })
 */
export function withLogging(
  handler: (req: Request) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    const start = Date.now()
    const url = new URL(req.url)

    let res: Response
    try {
      res = await handler(req)
    } catch (err) {
      logRequest({
        method: req.method,
        path: url.pathname,
        status: 500,
        latencyMs: Date.now() - start,
        ip: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined,
        userAgent: req.headers.get('user-agent') ?? undefined,
      })
      throw err
    }

    logRequest({
      method: req.method,
      path: url.pathname,
      status: res.status,
      latencyMs: Date.now() - start,
      ip: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
    })

    return res
  }
}
