import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { requireV1Auth } from '@/lib/v1Auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const auth = await requireV1Auth(request, 'analytics:read')
  if (!auth.ok) return auth.response

  try {
    const payload = await getPayload({ config: configPromise })
    const tenantFilter = { tenant: { equals: Number(auth.auth.tenantId) } }

    // Collections WITH tenant: courses, cycles, campuses, course_runs, leads
    // Collections WITHOUT tenant: students, enrollments, staff
    const [coursesResult, cyclesResult, campusesResult, studentsResult, enrollmentsResult, staffResult] = await Promise.all([
      payload.find({ collection: 'courses', where: tenantFilter, limit: 0, depth: 0 }),
      payload.find({ collection: 'cycles', where: tenantFilter, limit: 0, depth: 0 }),
      payload.find({ collection: 'campuses', where: tenantFilter, limit: 0, depth: 0 }),
      payload.find({ collection: 'students', limit: 0, depth: 0 }),
      payload.find({ collection: 'enrollments', limit: 1000, depth: 0 }),
      payload.find({ collection: 'staff', limit: 0, depth: 0 }),
    ])

    interface EnrollmentDoc { status?: string }
    const enrollmentDocs = enrollmentsResult.docs as unknown as EnrollmentDoc[]
    const activeEnrollments = enrollmentDocs.filter((e) => e.status === 'active').length
    const completedEnrollments = enrollmentDocs.filter((e) => e.status === 'completed').length
    const completionRate = enrollmentsResult.totalDocs > 0
      ? Math.round((completedEnrollments / enrollmentsResult.totalDocs) * 100)
      : 0

    return NextResponse.json({
      data: {
        total_courses: coursesResult.totalDocs,
        total_cycles: cyclesResult.totalDocs,
        total_campuses: campusesResult.totalDocs,
        total_students: studentsResult.totalDocs,
        total_staff: staffResult.totalDocs,
        total_enrollments: enrollmentsResult.totalDocs,
        active_enrollments: activeEnrollments,
        completion_rate: completionRate,
      },
    })
  } catch (err) {
    console.error('[v1/analytics] GET error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
