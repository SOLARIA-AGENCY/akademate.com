import { NextResponse } from 'next/server'
import { requireV1Auth } from '@/lib/v1Auth'
import { consumePublicCatalogRateLimit } from '@/app/lib/server/public-api-rate-limit'
import { correlationIdFrom, jsonHeaders } from '@/app/lib/server/public-api-headers'
import {
  getPublicCatalog,
  getPublicCatalogSqlFallback,
  PublicCatalogError,
  PUBLIC_CATALOG_TTL_SECONDS,
  resolvePublicCatalogHost,
} from '@/app/lib/server/public-catalog'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const correlationId = correlationIdFrom(request)
  const auth = await requireV1Auth(request, 'catalog:read')
  if (!auth.ok) {
    auth.response.headers.set('x-correlation-id', correlationId)
    return auth.response
  }

  const rate = consumePublicCatalogRateLimit(auth.auth.keyId)
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', code: 'RATE_LIMITED' },
      {
        status: 429,
        headers: jsonHeaders({
          'retry-after': String(Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000))),
          'x-ratelimit-remaining': '0',
          'x-correlation-id': correlationId,
        }),
      },
    )
  }

  const host = resolvePublicCatalogHost(request)

  try {
    const snapshot = await getPublicCatalog(host)
    const etag = `"${snapshot.meta.version}"`
    if (request.headers.get('if-none-match') === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          etag,
          'x-content-version': snapshot.meta.version,
          'x-correlation-id': correlationId,
          'cache-control': `public, s-maxage=${PUBLIC_CATALOG_TTL_SECONDS}, stale-while-revalidate=600`,
        },
      })
    }

    return NextResponse.json(snapshot, {
      headers: jsonHeaders({
        etag,
        'x-content-version': snapshot.meta.version,
        'x-correlation-id': correlationId,
        'x-ratelimit-remaining': String(rate.remaining),
        'cache-control': `public, s-maxage=${PUBLIC_CATALOG_TTL_SECONDS}, stale-while-revalidate=600`,
      }),
    })
  } catch (error) {
    if (error instanceof PublicCatalogError && error.code === 'TENANT_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Tenant not found', code: 'TENANT_NOT_FOUND' },
        { status: 404, headers: jsonHeaders({ 'x-correlation-id': correlationId }) },
      )
    }

    try {
      const snapshot = await getPublicCatalogSqlFallback(host)
      const etag = `"${snapshot.meta.version}"`
      return NextResponse.json(snapshot, {
        headers: jsonHeaders({
          etag,
          'x-content-version': snapshot.meta.version,
          'x-catalog-source': 'sql-fallback',
          'x-correlation-id': correlationId,
          'x-ratelimit-remaining': String(rate.remaining),
          'cache-control': `public, s-maxage=${PUBLIC_CATALOG_TTL_SECONDS}, stale-while-revalidate=600`,
        }),
      })
    } catch {
      return NextResponse.json(
        { error: 'Catalog unavailable', code: 'CATALOG_UNAVAILABLE' },
        { status: 503, headers: jsonHeaders({ 'x-correlation-id': correlationId, 'cache-control': 'no-store' }) },
      )
    }
  }
}
