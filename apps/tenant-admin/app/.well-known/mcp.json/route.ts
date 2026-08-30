import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { AKADEMATE_SAAS_ORIGIN, CEP_PUBLIC_ORIGIN, buildMcpDiscovery } from '@/src/domain/academy-mcp'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin || AKADEMATE_SAAS_ORIGIN
  return NextResponse.json(
    {
      ...buildMcpDiscovery(origin),
      akademateSaasReady: {
        origin: AKADEMATE_SAAS_ORIGIN,
        mcp: `${AKADEMATE_SAAS_ORIGIN}/mcp`,
        rest: `${AKADEMATE_SAAS_ORIGIN}/api/v1`,
      },
    },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      },
    },
  )
}
