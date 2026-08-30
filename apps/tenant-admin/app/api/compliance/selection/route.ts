import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getAuthenticatedUserContext } from '@/app/api/leads/_lib/auth'
import { withTenantScope } from '@/app/lib/server/tenant-scope'
import { learnerCanSeeRoster, normalizeSelectionStage, staffCanSeeRoster } from '@/src/domain/compliance-ops'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const payload = await getPayload({ config: configPromise })
  const auth = await getAuthenticatedUserContext(request, payload as never)
  if (!auth?.tenantId || !staffCanSeeRoster(auth.role) || learnerCanSeeRoster(auth.role)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const courseRunId = request.nextUrl.searchParams.get('courseRunId')
  const where = courseRunId
    ? withTenantScope({ course_run: { equals: courseRunId } }, auth.tenantId)
    : withTenantScope({}, auth.tenantId)

  const result = await payload.find({
    collection: 'selection-candidacies',
    where,
    limit: 200,
    overrideAccess: true,
  })

  return NextResponse.json({
    success: true,
    data: result.docs.map((doc) => ({
      id: doc.id,
      displayName: doc.display_name,
      stage: doc.stage,
      captureChannel: doc.capture_channel,
      motivationScore: doc.motivation_score,
      theoryScore: doc.theory_score,
      sourceLabel: doc.source_label,
      courseRunId: typeof doc.course_run === 'object' && doc.course_run && 'id' in doc.course_run
        ? doc.course_run.id
        : doc.course_run,
    })),
  })
}

export async function POST(request: NextRequest) {
  const payload = await getPayload({ config: configPromise })
  const auth = await getAuthenticatedUserContext(request, payload as never)
  if (!auth?.tenantId || !staffCanSeeRoster(auth.role) || learnerCanSeeRoster(auth.role)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    courseRunId?: string | number
    displayName?: string
    stage?: string
    captureChannel?: string
    motivationScore?: number
    theoryScore?: number
    sourceLabel?: string
  }

  if (!body.courseRunId || !body.displayName) {
    return NextResponse.json({ success: false, error: 'courseRunId and displayName are required' }, { status: 400 })
  }

  const created = await payload.create({
    collection: 'selection-candidacies',
    data: {
      tenant: auth.tenantId,
      course_run: body.courseRunId,
      display_name: body.displayName,
      stage: normalizeSelectionStage(body.stage ?? 'prospect'),
      capture_channel: body.captureChannel ?? 'other',
      motivation_score: body.motivationScore,
      theory_score: body.theoryScore,
      source_label: body.sourceLabel ?? 'synthetic',
    },
    overrideAccess: true,
  })

  return NextResponse.json({ success: true, data: { id: created.id } })
}
