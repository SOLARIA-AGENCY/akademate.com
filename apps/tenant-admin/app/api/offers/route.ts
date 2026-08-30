import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getAuthenticatedUserContext } from '@/app/api/leads/_lib/auth'
import { withTenantScope } from '@/app/lib/server/tenant-scope'
import { findOfferByCourseRun, findTenantPaymentProvider, saveOffer } from '@/app/lib/offers/store'
import { projectCourseRunToOffer, publicOfferPath } from '@/src/domain/activity-offer'
import { isLearnerStripeConnected, toPublicConnection } from '@/src/domain/tenant-learner-stripe'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function canWrite(role: string | null): boolean {
  return ['marketing', 'gestor', 'admin', 'superadmin'].includes(role ?? '')
}

function serializeOffer(offer: ReturnType<typeof projectCourseRunToOffer> & { id?: number | string }) {
  return {
    ...offer,
    publicPath: publicOfferPath(offer.publicSlug),
    publicUrl: publicOfferPath(offer.publicSlug),
  }
}

export async function GET(request: NextRequest) {
  const payload = await getPayload({ config: configPromise })
  const auth = await getAuthenticatedUserContext(request, payload as any)
  if (!auth?.tenantId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const courseRunId = request.nextUrl.searchParams.get('courseRunId')
  if (!courseRunId) {
    return NextResponse.json({ success: false, error: 'courseRunId is required' }, { status: 400 })
  }

  const stripe = await findTenantPaymentProvider(payload as any, auth.tenantId)
  const offer = await findOfferByCourseRun(payload as any, auth.tenantId, courseRunId)
  return NextResponse.json({
    success: true,
    data: {
      stripe: toPublicConnection(stripe ? { ...stripe, tenantId: auth.tenantId } : null),
      offer: offer ? serializeOffer(offer) : null,
    },
  })
}

export async function POST(request: NextRequest) {
  const payload = await getPayload({ config: configPromise })
  const auth = await getAuthenticatedUserContext(request, payload as any)
  if (!auth?.tenantId || !canWrite(auth.role)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as { courseRunId?: string | number }
  if (!body.courseRunId) {
    return NextResponse.json({ success: false, error: 'courseRunId is required' }, { status: 400 })
  }

  const existing = await findOfferByCourseRun(payload as any, auth.tenantId, body.courseRunId)
  if (existing) {
    return NextResponse.json({ success: true, data: { offer: serializeOffer(existing) } })
  }

  const runs = await payload.find({
    collection: 'course-runs',
    where: withTenantScope({ id: { equals: body.courseRunId } }, auth.tenantId),
    limit: 1,
    depth: 2,
    overrideAccess: true,
  })
  const run = runs.docs[0] as Record<string, unknown> | undefined
  if (!run) {
    return NextResponse.json({ success: false, error: 'Convocatoria no encontrada' }, { status: 404 })
  }

  const projected = projectCourseRunToOffer(run as any, auth.tenantId)
  const saved = await saveOffer(payload as any, projected)
  return NextResponse.json({
    success: true,
    data: {
      offer: serializeOffer(saved),
      stripeConnected: isLearnerStripeConnected(await findTenantPaymentProvider(payload as any, auth.tenantId)),
    },
  }, { status: 201 })
}
