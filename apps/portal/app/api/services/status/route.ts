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

const services: Array<{ key: ServiceKey; label: string; url: string; fallbackUrl?: string }> = [
  { key: 'web', label: 'web', url: serviceUrls.web },
  { key: 'ops', label: 'ops', url: `${serviceUrls.ops}/api/health`, fallbackUrl: serviceUrls.ops },
  { key: 'tenant', label: 'tenant', url: `${serviceUrls.tenant}/api/health` },
  { key: 'payload', label: 'payload', url: `${serviceUrls.payload}/api/health` },
  { key: 'campus', label: 'campus', url: `${serviceUrls.campus}/api/health`, fallbackUrl: serviceUrls.campus },
]

async function probe(url: string): Promise<{ ok: boolean; latencyMs: number | null; state: ServiceState }> {
  const startedAt = Date.now()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    })
    clearTimeout(timer)
    const latencyMs = Date.now() - startedAt

    if (!response.ok) return { ok: false, latencyMs, state: 'offline' }

    return {
      ok: true,
      latencyMs,
      state: latencyMs > degradedThresholdMs ? 'degraded' : 'online',
    }
  } catch {
    clearTimeout(timer)
    return { ok: false, latencyMs: null, state: 'offline' }
  }
}

async function checkService(
  service: { key: ServiceKey; label: string; url: string; fallbackUrl?: string }
): Promise<ServiceStatus> {
  const primaryResult = await probe(service.url)

  if (primaryResult.ok) {
    return {
      key: service.key,
      label: service.label,
      url: service.url,
      state: primaryResult.state,
      latencyMs: primaryResult.latencyMs,
    }
  }

  if (service.fallbackUrl) {
    const fallbackResult = await probe(service.fallbackUrl)
    if (fallbackResult.ok) {
      return {
        key: service.key,
        label: service.label,
        url: service.fallbackUrl,
        state: fallbackResult.state,
        latencyMs: fallbackResult.latencyMs,
      }
    }
  }

  return {
    key: service.key,
    label: service.label,
    url: service.url,
    state: 'offline',
    latencyMs: primaryResult.latencyMs,
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
