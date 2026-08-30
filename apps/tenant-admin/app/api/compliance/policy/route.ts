import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getAuthenticatedUserContext } from '@/app/api/leads/_lib/auth'
import { loadResolvedPolicy } from '@/app/lib/compliance/store'
import { learnerCanSeeRoster, staffCanSeeRoster, REGION_PACK_CATALOG } from '@/src/domain/compliance-ops'
import { OFFICIAL_PROFESSIONAL_FAMILIES } from '@/src/domain/official-families'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const payload = await getPayload({ config: configPromise })
  const auth = await getAuthenticatedUserContext(request, payload as never)
  if (!auth?.tenantId || !staffCanSeeRoster(auth.role) || learnerCanSeeRoster(auth.role)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const courseRunId = request.nextUrl.searchParams.get('courseRunId') ?? undefined
  const resolved = await loadResolvedPolicy(payload as never, auth.tenantId, { courseRunId })
  return NextResponse.json({
    success: true,
    data: {
      ...resolved,
      catalog: REGION_PACK_CATALOG.map((pack) => ({
        id: pack.id,
        country: pack.country,
        region: pack.region,
        program: pack.program,
      })),
      families: OFFICIAL_PROFESSIONAL_FAMILIES,
    },
  })
}
