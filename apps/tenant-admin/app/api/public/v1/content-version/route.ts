import { NextResponse } from 'next/server'
import { correlationIdFrom, jsonHeaders } from '@/app/lib/server/public-api-headers'
import { getPublicContentVersion, resolvePublicCatalogHost } from '@/app/lib/server/public-catalog'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const correlationId = correlationIdFrom(request)
  const host = resolvePublicCatalogHost(request)

  try {
    const version = await getPublicContentVersion(host)
    return NextResponse.json(
      {
        version: version.version,
        generatedAt: version.generatedAt,
        tenant: version.tenant,
      },
      {
        headers: jsonHeaders({
          'cache-control': 'public, max-age=60',
          'x-content-version': version.version,
          'x-correlation-id': correlationId,
        }),
      },
    )
  } catch {
    return NextResponse.json(
      { error: 'Content version unavailable', code: 'VERSION_UNAVAILABLE' },
      {
        status: 503,
        headers: jsonHeaders({
          'cache-control': 'no-store',
          'x-correlation-id': correlationId,
        }),
      },
    )
  }
}
