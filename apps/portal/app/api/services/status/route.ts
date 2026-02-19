import { NextResponse } from 'next/server'

type ServiceKey = 'web' | 'ops' | 'tenant' | 'payload' | 'campus'
type ServiceState = 'online' | 'offline' | 'degraded'

interface ServiceStatus {
  key: ServiceKey
  label: string
  url: string
  state: ServiceState
  latencyMs: number | null
}

const timeoutMs = 4_000
const degradedThresholdMs = 2_000

const serviceUrls: Record<ServiceKey, string> = {
  web: process.env.INTERNAL_WEB_URL ?? 'http://web:3006',
  ops: process.env.INTERNAL_ADMIN_URL ?? 'http://admin:3004',
  tenant: process.env.INTERNAL_TENANT_URL ?? 'http://tenant:3009',
  payload: process.env.INTERNAL_PAYLOAD_URL ?? 'http://payload:3003',
  campus: process.env.INTERNAL_CAMPUS_URL ?? 'http://campus:3005',
}

const services: Array<{ key: ServiceKey; label: string; url: string }> = [
  { key: 'web', label: 'web', url: serviceUrls.web },
  { key: 'ops', label: 'ops', url: serviceUrls.ops },
  { key: 'tenant', label: 'tenant', url: serviceUrls.tenant },
  { key: 'payload', label: 'payload', url: `${serviceUrls.payload}/api/health` },
  { key: 'campus', label: 'campus', url: serviceUrls.campus },
]

async function checkService(
  service: { key: ServiceKey; label: string; url: string }
): Promise<ServiceStatus> {
  const startedAt = Date.now()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(service.url, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    })
    clearTimeout(timer)
    const latencyMs = Date.now() - startedAt
    if (!response.ok) {
      return { ...service, state: 'offline', latencyMs }
    }
    const state: ServiceState = latencyMs > degradedThresholdMs ? 'degraded' : 'online'
    return { ...service, state, latencyMs }
  } catch {
    clearTimeout(timer)
    return { ...service, state: 'offline', latencyMs: null }
  }
}

export async function GET() {
  const results = await Promise.all(services.map((service) => checkService(service)))

  return NextResponse.json(
    {
      generatedAt: new Date().toISOString(),
      services: results,
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  )
}
