import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

const PAYLOAD_URL =
  process.env.PAYLOAD_CMS_URL?.trim() ||
  process.env.NEXT_PUBLIC_PAYLOAD_URL?.trim() ||
  'http://localhost:3003'

const S3_ENDPOINT = process.env.S3_ENDPOINT?.trim()

interface ServiceResult {
  name: string
  status: 'operational' | 'degraded' | 'outage'
  latencyMs: number | null
  message: string
  uptime: number
  url: string | null
}

async function checkHttp(
  name: string,
  url: string,
  timeoutMs = 5000
): Promise<ServiceResult> {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' })
    clearTimeout(timer)
    const latencyMs = Date.now() - start
    const status = res.ok ? 'operational' : latencyMs < 3000 ? 'degraded' : 'outage'
    return { name, status, latencyMs, message: `HTTP ${res.status}`, uptime: res.ok ? 100 : 95, url }
  } catch {
    return { name, status: 'outage', latencyMs: Date.now() - start, message: 'No responde', uptime: 0, url }
  }
}

async function checkDatabase(): Promise<ServiceResult> {
  const start = Date.now()
  try {
    const db = getDb()
    await db.query('SELECT 1')
    const latencyMs = Date.now() - start
    return {
      name: 'PostgreSQL',
      status: latencyMs < 500 ? 'operational' : 'degraded',
      latencyMs,
      message: 'Conexión OK',
      uptime: 100,
      url: null,
    }
  } catch (err) {
    return {
      name: 'PostgreSQL',
      status: 'outage',
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : 'Error de conexión',
      uptime: 0,
      url: null,
    }
  }
}

async function checkS3(): Promise<ServiceResult> {
  if (!S3_ENDPOINT) {
    return {
      name: 'S3 / Almacenamiento',
      status: 'operational',
      latencyMs: null,
      message: 'No configurado (sin almacenamiento externo)',
      uptime: 100,
      url: null,
    }
  }

  // Try to hit the S3 endpoint (typically returns 403 for root, which means it's reachable)
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(S3_ENDPOINT, { signal: controller.signal, cache: 'no-store' })
    clearTimeout(timer)
    const latencyMs = Date.now() - start
    // 403 = bucket exists but no list permission — operational
    const reachable = res.status < 500 || res.status === 403
    return {
      name: 'S3 / Almacenamiento',
      status: reachable ? 'operational' : 'degraded',
      latencyMs,
      message: `HTTP ${res.status}`,
      uptime: reachable ? 100 : 90,
      url: S3_ENDPOINT,
    }
  } catch {
    return {
      name: 'S3 / Almacenamiento',
      status: 'outage',
      latencyMs: Date.now() - start,
      message: 'No responde',
      uptime: 0,
      url: S3_ENDPOINT,
    }
  }
}

/** Self-check returns immediately healthy (we are running to serve this request). */
function checkSelf(): ServiceResult {
  return {
    name: 'Ops Dashboard',
    status: 'operational',
    latencyMs: 0,
    message: 'Self-check OK',
    uptime: 100,
    url: 'https://admin.akademate.com/api/ops/health',
  }
}

/** Fire-and-forget: persist check results to history table. */
function persistHistory(services: ServiceResult[]): void {
  setImmediate(async () => {
    try {
      const db = getDb()
      await db.query(`
        CREATE TABLE IF NOT EXISTS service_health_history (
          id BIGSERIAL PRIMARY KEY,
          service_name VARCHAR(128) NOT NULL,
          status VARCHAR(20) NOT NULL,
          latency_ms INTEGER,
          checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_health_history_service ON service_health_history(service_name);
        CREATE INDEX IF NOT EXISTS idx_health_history_checked ON service_health_history(checked_at);
      `)
      for (const s of services) {
        await db.query(
          `INSERT INTO service_health_history (service_name, status, latency_ms) VALUES ($1, $2, $3)`,
          [s.name, s.status, s.latencyMs]
        )
      }
    } catch {
      // History logging must never crash the health check
    }
  })
}

export async function GET() {
  const [db, payloadCms, payloadAuth, s3, web, appDashboard, cepSite, cepAdmin, uptimeKuma] =
    await Promise.all([
      checkDatabase(),
      checkHttp('Payload CMS', `${PAYLOAD_URL}/api/health`),
      checkHttp('Payload Auth', `${PAYLOAD_URL}/api/users/me`, 3000),
      checkS3(),
      checkHttp('Web (akademate.com)', 'https://akademate.com', 5000),
      checkHttp('App Dashboard', 'https://app.akademate.com/auth/login', 5000),
      checkHttp('CEP Comunicacion', 'https://cepcomunicacion.akademate.com', 5000),
      checkHttp('CEP Payload Admin', 'https://cepcomunicacion.akademate.com/admin', 5000),
      checkHttp('Uptime Kuma', 'https://status.akademate.com', 5000),
    ])

  const opsSelf = checkSelf()

  const services = [db, payloadCms, payloadAuth, s3, web, appDashboard, cepSite, cepAdmin, opsSelf, uptimeKuma]

  const overall =
    services.every((s) => s.status === 'operational')
      ? 'operational'
      : services.some((s) => s.status === 'outage')
      ? 'outage'
      : 'degraded'

  const operationalCount = services.filter((s) => s.status === 'operational').length

  // Persist to history (fire-and-forget)
  persistHistory(services)

  return NextResponse.json({
    overall,
    operationalCount,
    totalServices: services.length,
    services,
    checkedAt: new Date().toISOString(),
  })
}
