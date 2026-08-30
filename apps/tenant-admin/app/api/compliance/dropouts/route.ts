import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getAuthenticatedUserContext } from '@/app/api/leads/_lib/auth'
import { listEvents, loadResolvedPolicy } from '@/app/lib/compliance/store'
import { canApplyDropout, learnerCanSeeRoster, staffCanSeeRoster } from '@/src/domain/compliance-ops'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const payload = await getPayload({ config: configPromise })
  const auth = await getAuthenticatedUserContext(request, payload as never)
  if (!auth?.tenantId || !staffCanSeeRoster(auth.role) || learnerCanSeeRoster(auth.role)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    enrollmentId?: string | number
    reasonCode?: string
    effectiveDate?: string
    notes?: string
  }
  if (!body.enrollmentId || !body.reasonCode || !body.effectiveDate) {
    return NextResponse.json({ success: false, error: 'Missing dropout fields' }, { status: 400 })
  }

  const { policy } = await loadResolvedPolicy(payload as never, auth.tenantId)
  const reason = policy.dropoutReasons.find((item) => item.code === body.reasonCode)
  if (!reason) {
    return NextResponse.json({ success: false, error: 'Unknown dropout reason for active pack' }, { status: 400 })
  }

  const events = await listEvents(payload as never, auth.tenantId)
  const related = events
    .filter((event) => String(event.enrollmentId) === String(body.enrollmentId))
    .map((event) => ({
      type: event.type as 'milestone_reached' | 'consecutive_absences' | 'dropout_eligible',
      enrollmentId: String(event.enrollmentId ?? body.enrollmentId),
      value: event.value,
      atDate: event.atDate,
    }))

  if (!canApplyDropout({ reason, events: related })) {
    return NextResponse.json({ success: false, error: 'Reason requires attendance evidence' }, { status: 409 })
  }

  const created = await payload.create({
    collection: 'enrollment-dropouts',
    data: {
      tenant: auth.tenantId,
      enrollment: body.enrollmentId,
      reason_code: reason.code,
      effective_date: body.effectiveDate,
      notes: body.notes ?? '',
    },
    overrideAccess: true,
  })

  return NextResponse.json({ success: true, data: { id: created.id, reason } })
}
