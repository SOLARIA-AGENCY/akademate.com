import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { resolveMetaRequestContext } from '../_lib/integrations'
import { checkMetaHealth } from '../_lib/meta-graph'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const context = await resolveMetaRequestContext(request, request.nextUrl.searchParams.get('tenantId'))

  if (!context.authenticated) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Sesión no autenticada' } }, { status: 401 })
  }

  if (!context.tenantId) {
    return NextResponse.json(
      { error: { code: 'MISCONFIGURED', message: 'No se pudo resolver el tenant actual.' } },
      { status: 400 },
    )
  }

  const health = await checkMetaHealth({
    adAccountId: context.meta.adAccountIdNormalized,
    accessToken: context.meta.marketingApiToken,
    requireAdsManagement: false,
  })

  return NextResponse.json({
    tenant_id: context.tenantId,
    source: context.source,
    health,
    generated_at: new Date().toISOString(),
  })
}
