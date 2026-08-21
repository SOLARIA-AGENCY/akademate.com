import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { resolveMetaRequestContext } from '../_lib/integrations'
import { checkMetaHealth } from '../_lib/meta-graph'

/**
 * Legacy POST /api/meta/ads.
 * New automatic ads must use /api/meta/ads/preflight + preview + publish (workflow).
 * Simple-image-only publish is disabled so it cannot create PHONE/legacy creatives.
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const metaContext = await resolveMetaRequestContext(request, searchParams.get('tenantId'))

    if (!metaContext.authenticated) {
      return NextResponse.json(
        { error: 'Sesion no autenticada', code: 'UNAUTHORIZED' },
        { status: 401 },
      )
    }

    if (!metaContext.tenantId) {
      return NextResponse.json(
        { error: 'No se pudo resolver el tenant actual', code: 'MISCONFIGURED' },
        { status: 400 },
      )
    }

    const health = await checkMetaHealth({
      adAccountId: metaContext.meta.adAccountIdNormalized,
      accessToken: metaContext.meta.marketingApiToken,
      requireAdsManagement: true,
    })

    if (health.status !== 'ok') {
      const httpStatus = health.error?.code === 'MISSING_PERMISSIONS' ? 403 : 400
      return NextResponse.json(
        {
          error:
            health.error?.message ||
            'No se pudo validar la integracion Meta para crear la campaña.',
          code: health.error?.code || 'META_API_ERROR',
          source_health: health,
        },
        { status: httpStatus },
      )
    }

    return NextResponse.json(
      {
        error: 'Este endpoint legado no publica anuncios. Usa el wizard / workflow flexible (preflight, preview, publish).',
        code: 'LEGACY_SIMPLE_PUBLISH_DISABLED',
        next: {
          preflight: '/api/meta/ads/preflight',
          preview: '/api/meta/ads/preview',
          publish: '/api/meta/ads/publish',
          activate: '/api/meta/ads/activate',
        },
      },
      { status: 409 },
    )
  } catch (error) {
    console.error('[meta-ads] POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error creating Meta campaign' },
      { status: 500 },
    )
  }
}
