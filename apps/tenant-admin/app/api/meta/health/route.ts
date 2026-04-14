import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { resolveMetaRequestContext } from '../_lib/integrations'
import { checkMetaHealth } from '../_lib/meta-graph'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const context = await resolveMetaRequestContext(request, searchParams.get('tenantId'))

  if (!context.authenticated) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Sesión no autenticada' },
      },
      { status: 401 }
    )
  }

  if (!context.tenantId) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'MISCONFIGURED', message: 'No se pudo resolver el tenant actual.' },
      },
      { status: 400 }
    )
  }

  const health = await checkMetaHealth({
    adAccountId: context.meta.adAccountIdNormalized,
    accessToken: context.meta.marketingApiToken,
    requireAdsManagement: false,
  })

  return NextResponse.json({
    success: health.status === 'ok',
    data: health,
  })
}
