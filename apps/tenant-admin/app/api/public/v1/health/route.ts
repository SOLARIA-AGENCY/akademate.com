import { NextResponse } from 'next/server'
import { correlationIdFrom, jsonHeaders } from '@/app/lib/server/public-api-headers'
import { getPublicContentVersion, resolvePublicCatalogHost } from '@/app/lib/server/public-catalog'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const correlationId = correlationIdFrom(request)
  const host = resolvePublicCatalogHost(request)
  let catalogVersion: string | null = null
  let tenant: string | null = null

  try {
    const version = await getPublicContentVersion(host)
    catalogVersion = version.version
    tenant = version.tenant
  } catch {
    catalogVersion = null
  }

  return NextResponse.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV ?? 'development',
      version: process.env.npm_package_version ?? '1.0.0',
      catalogVersion,
      tenant,
    },
    {
      status: 200,
      headers: jsonHeaders({
        'cache-control': 'no-store, no-cache, must-revalidate',
        'x-correlation-id': correlationId,
      }),
    },
  )
}
