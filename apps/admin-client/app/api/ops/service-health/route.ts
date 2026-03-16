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
    return { name, status, latencyMs, message: `HTTP ${res.status}`, uptime: res.ok ? 100 : 95 }
  } catch {
    return { name, status: 'outage', latencyMs: Date.now() - start, message: 'No responde', uptime: 0 }
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
    }
  } catch (err) {
    return {
      name: 'PostgreSQL',
      status: 'outage',
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : 'Error de conexión',
      uptime: 0,
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
    }
  } catch {
    return {
      name: 'S3 / Almacenamiento',
      status: 'outage',
      latencyMs: Date.now() - start,
      message: 'No responde',
      uptime: 0,
    }
  }
}

export async function GET() {
  const [db, payloadCms, payloadAuth, s3, web, appDashboard] = await Promise.all([
    checkDatabase(),
    checkHttp('Payload CMS', `${PAYLOAD_URL}/api/health`),
    checkHttp('Payload Auth', `${PAYLOAD_URL}/api/users/me`, 3000),
    checkS3(),
    checkHttp('Web (akademate.com)', 'https://akademate.com', 5000),
    checkHttp('App Dashboard', 'https://app.akademate.com/auth/login', 5000),
  ])

  const services = [db, payloadCms, payloadAuth, s3, web, appDashboard]

  const overall =
    services.every((s) => s.status === 'operational')
      ? 'operational'
      : services.some((s) => s.status === 'outage')
      ? 'outage'
      : 'degraded'

  const operationalCount = services.filter((s) => s.status === 'operational').length

  return NextResponse.json({
    overall,
    operationalCount,
    totalServices: services.length,
    services,
    checkedAt: new Date().toISOString(),
  })
}
