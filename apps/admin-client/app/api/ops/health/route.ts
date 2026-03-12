import { NextResponse } from 'next/server'

const PAYLOAD_URL =
  process.env.PAYLOAD_CMS_URL?.trim() ||
  process.env.NEXT_PUBLIC_PAYLOAD_URL?.trim() ||
  'http://localhost:3003'

interface ServiceCheck {
  name: string
  status: 'operational' | 'degraded' | 'outage'
  latencyMs: number | null
  message: string
}

async function checkService(name: string, url: string, timeoutMs = 5000): Promise<ServiceCheck> {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
    })
    clearTimeout(timer)

    const latencyMs = Date.now() - start

    if (res.ok) {
      return { name, status: 'operational', latencyMs, message: `${res.status} OK` }
    }
    return {
      name,
      status: latencyMs < 3000 ? 'degraded' : 'outage',
      latencyMs,
      message: `HTTP ${res.status}`,
    }
  } catch (err) {
    const latencyMs = Date.now() - start
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { name, status: 'outage', latencyMs, message }
  }
}

export async function GET() {
  const checks = await Promise.all([
    checkService('Payload CMS', `${PAYLOAD_URL}/api/health`),
    checkService('Payload Auth', `${PAYLOAD_URL}/api/users/me`),
  ])

  const overall = checks.every((c) => c.status === 'operational')
    ? 'operational'
    : checks.some((c) => c.status === 'outage')
    ? 'outage'
    : 'degraded'

  return NextResponse.json({
    overall,
    services: checks,
    checkedAt: new Date().toISOString(),
  })
}
