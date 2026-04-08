import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

const PAYLOAD_URL =
  process.env.PAYLOAD_CMS_URL?.trim() ||
  process.env.NEXT_PUBLIC_PAYLOAD_URL?.trim() ||
  'http://localhost:3003'

const S3_ENDPOINT = process.env.S3_ENDPOINT?.trim()

type ServiceState = 'operational' | 'degraded' | 'outage'

interface ServiceResult {
  name: string
  status: ServiceState
  latencyMs: number | null
  message: string
  uptime: number
  url: string | null
}

interface HttpCheckConfig {
  name: string
  url: string
  timeoutMs?: number
}

function normalizePublicUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return trimmed
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  return `https://${trimmed}`
}

function parseExtraChecksFromEnv(): HttpCheckConfig[] {
  const raw = process.env.OPS_HEALTH_EXTRA_CHECKS?.trim()
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as Array<{ name?: string; url?: string; timeoutMs?: number }>
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item) => item?.name && item?.url)
      .map((item) => ({
        name: String(item.name),
        url: normalizePublicUrl(String(item.url)),
        timeoutMs: typeof item.timeoutMs === 'number' ? item.timeoutMs : undefined,
      }))
  } catch {
    return []
  }
}

async function loadTenantChecks(): Promise<HttpCheckConfig[]> {
  const db = getDb()
  const tenantBaseDomain = process.env.OPS_TENANT_BASE_DOMAIN?.trim() || 'akademate.com'
  const result = await db.query<{
    name: string
    slug: string
    domain: string | null
    active: boolean
  }>(
    `SELECT name, slug, domain, active
     FROM tenants
     WHERE active = true
     ORDER BY created_at DESC
     LIMIT 10`
  )

  const checks: HttpCheckConfig[] = []
  for (const tenant of result.rows) {
    const domain = tenant.domain?.trim() || `${tenant.slug}.${tenantBaseDomain}`
    if (!domain) continue
    const baseUrl = normalizePublicUrl(domain)
    checks.push(
      { name: `${tenant.name} (tenant)`, url: baseUrl, timeoutMs: 5000 },
      { name: `${tenant.name} /admin`, url: `${baseUrl.replace(/\/$/, '')}/admin`, timeoutMs: 5000 }
    )
  }
  return checks
}

async function loadConfiguredHttpChecks(): Promise<HttpCheckConfig[]> {
  const defaults: HttpCheckConfig[] = [
    { name: 'Web (akademate.com)', url: normalizePublicUrl(process.env.OPS_WEB_URL || 'https://akademate.com'), timeoutMs: 5000 },
    { name: 'App Dashboard', url: normalizePublicUrl(process.env.OPS_APP_URL || 'https://app.akademate.com/auth/login'), timeoutMs: 5000 },
    { name: 'Uptime Kuma', url: normalizePublicUrl(process.env.OPS_STATUS_URL || 'https://status.akademate.com'), timeoutMs: 5000 },
  ]

  let tenantChecks: HttpCheckConfig[] = []
  try {
    tenantChecks = await loadTenantChecks()
  } catch {
    // Tenant checks are best effort; core checks still execute.
  }

  const combined = [...defaults, ...tenantChecks, ...parseExtraChecksFromEnv()]
  const deduped = new Map<string, HttpCheckConfig>()
  for (const check of combined) {
    const key = `${check.name}::${check.url}`
    if (!deduped.has(key)) deduped.set(key, check)
  }
  return Array.from(deduped.values())
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
    const status: ServiceState = res.ok ? 'operational' : latencyMs < 3000 ? 'degraded' : 'outage'
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
      message: 'Conexion OK',
      uptime: 100,
      url: null,
    }
  } catch (err) {
    return {
      name: 'PostgreSQL',
      status: 'outage',
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : 'Error de conexion',
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

  const start = Date.now()
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(S3_ENDPOINT, { signal: controller.signal, cache: 'no-store' })
    clearTimeout(timer)
    const latencyMs = Date.now() - start
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

function checkSelf(request: Request): ServiceResult {
  const url = new URL(request.url)
  return {
    name: 'Ops Dashboard',
    status: 'operational',
    latencyMs: 0,
    message: 'Self-check OK',
    uptime: 100,
    url: `${url.origin}${url.pathname}`,
  }
}

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

export async function GET(request: Request) {
  const configuredChecks = await loadConfiguredHttpChecks()

  const [db, payloadCms, payloadAuth, s3, ...httpChecks] =
    await Promise.all([
      checkDatabase(),
      checkHttp('Payload CMS', `${PAYLOAD_URL}/api/health`),
      checkHttp('Payload Auth', `${PAYLOAD_URL}/api/users/me`, 3000),
      checkS3(),
      ...configuredChecks.map((check) => checkHttp(check.name, check.url, check.timeoutMs ?? 5000)),
    ])

  const opsSelf = checkSelf(request)
  const services = [db, payloadCms, payloadAuth, s3, ...httpChecks, opsSelf]

  const overall =
    services.every((s) => s.status === 'operational')
      ? 'operational'
      : services.some((s) => s.status === 'outage')
      ? 'outage'
      : 'degraded'

  const operationalCount = services.filter((s) => s.status === 'operational').length
  persistHistory(services)

  return NextResponse.json({
    overall,
    operationalCount,
    totalServices: services.length,
    services,
    checkedAt: new Date().toISOString(),
  })
}
