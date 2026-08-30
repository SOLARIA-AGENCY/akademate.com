import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getAuthenticatedUserContext } from '@/app/api/leads/_lib/auth'
import { listEvents, listRoster, loadResolvedPolicy, persistEvents, upsertRosterEntry } from '@/app/lib/compliance/store'
import { evaluateAttendance, learnerCanSeeRoster, staffCanSeeRoster } from '@/src/domain/compliance-ops'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const payload = await getPayload({ config: configPromise })
  const auth = await getAuthenticatedUserContext(request, payload as never)
  if (!auth?.tenantId || !staffCanSeeRoster(auth.role) || learnerCanSeeRoster(auth.role)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const courseRunId = request.nextUrl.searchParams.get('courseRunId')
  if (!courseRunId) {
    return NextResponse.json({ success: false, error: 'courseRunId is required' }, { status: 400 })
  }

  const [policy, marks, events] = await Promise.all([
    loadResolvedPolicy(payload as never, auth.tenantId, { courseRunId }),
    listRoster(payload as never, auth.tenantId, courseRunId),
    listEvents(payload as never, auth.tenantId),
  ])

  return NextResponse.json({
    success: true,
    data: { packId: policy.packId, policy: policy.policy, marks, events },
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
    enrollmentId?: string | number
    date?: string
    code?: string
    scheduledHours?: number
    plannedHours?: number
  }

  if (!body.courseRunId || !body.enrollmentId || !body.date || !body.code) {
    return NextResponse.json({ success: false, error: 'Missing roster fields' }, { status: 400 })
  }

  const resolved = await loadResolvedPolicy(payload as never, auth.tenantId, { courseRunId: body.courseRunId })
  const previous = await listRoster(payload as never, auth.tenantId, body.courseRunId)
  const nextMark = {
    enrollmentId: String(body.enrollmentId),
    date: body.date,
    code: body.code,
    scheduledHours: Number(body.scheduledHours ?? 5),
  }

  let evaluation
  try {
    evaluation = evaluateAttendance({
      policy: resolved.policy,
      enrollmentId: String(body.enrollmentId),
      plannedHours: Number(body.plannedHours ?? 40),
      previousMarks: previous.filter((mark) => mark.enrollmentId === String(body.enrollmentId)),
      nextMark,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'invalid_attendance'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }

  const saved = await upsertRosterEntry(payload as never, auth.tenantId, {
    ...nextMark,
    courseRunId: body.courseRunId,
    recordedBy: auth.userId,
  })
  const events = await persistEvents(payload as never, auth.tenantId, evaluation.events)

  return NextResponse.json({ success: true, data: { mark: saved, events } })
}
