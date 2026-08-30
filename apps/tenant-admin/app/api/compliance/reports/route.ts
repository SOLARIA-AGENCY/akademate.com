import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getAuthenticatedUserContext } from '@/app/api/leads/_lib/auth'
import { withTenantScope } from '@/app/lib/server/tenant-scope'
import { buildCourseAuditRow, learnerCanSeeRoster, staffCanSeeRoster } from '@/src/domain/compliance-ops'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const payload = await getPayload({ config: configPromise })
  const auth = await getAuthenticatedUserContext(request, payload as never)
  if (!auth?.tenantId || !staffCanSeeRoster(auth.role) || learnerCanSeeRoster(auth.role)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const year = Number(request.nextUrl.searchParams.get('year') ?? new Date().getFullYear())
  const runs = await payload.find({
    collection: 'course-runs',
    where: withTenantScope({}, auth.tenantId),
    limit: 100,
    depth: 1,
    overrideAccess: true,
  })

  const rows = runs.docs.map((run) => {
    const campus = typeof run.campus === 'object' && run.campus ? run.campus : null
    return buildCourseAuditRow({
      campusId: String(campus && 'id' in campus ? campus.id : 'unknown'),
      year,
      marketLine: 'synthetic',
      groupCode: String(run.codigo ?? run.id),
      title: String((typeof run.course === 'object' && run.course && 'name' in run.course ? run.course.name : run.codigo) ?? 'Course'),
      hours: Number(run.duration_hours ?? run.hours ?? 40),
      startMale: 0,
      startFemale: 0,
      endMale: 0,
      endFemale: 0,
      disabilityCount: 0,
      passed: 0,
      certified: 0,
      absenceHours: 0,
      dropoutsAttendance: 0,
      dropoutsContract: 0,
    })
  })

  return NextResponse.json({
    success: true,
    data: {
      year,
      courseAudit: rows,
      loyalty: [],
      note: 'Synthetic academy only. Real historical imports stay blocked.',
    },
  })
}
