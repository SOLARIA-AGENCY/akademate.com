import { NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { requireV1Auth } from '@/lib/v1Auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ============================================================================
// GET /api/v1/analytics
// Returns KPI aggregates for the authenticated tenant.
// Requires: analytics:read
// ============================================================================

export async function GET(request: Request) {
  const auth = await requireV1Auth(request, 'analytics:read')
  if (!auth.ok) return auth.response

  try {
    const payload = await getPayloadHMR({ config: configPromise })
    const tenantFilter = { tenant: { equals: Number(auth.auth.tenantId) } }

    // Fetch counts in parallel for performance
    const [studentsResult, coursesResult, enrollmentsResult] = await Promise.all([
      payload.find({
        collection: 'students',
        where: tenantFilter,
        limit: 1,
        depth: 0,
      }),
      payload.find({
        collection: 'courses',
        where: tenantFilter,
        limit: 1,
        depth: 0,
      }),
      payload.find({
        collection: 'enrollments',
        where: tenantFilter,
        limit: 1000,
        depth: 0,
      }),
    ])

    const totalStudents = studentsResult.totalDocs
    const totalCourses = coursesResult.totalDocs
    const totalEnrollments = enrollmentsResult.totalDocs

    // Derive active and completed counts from enrollments
    interface EnrollmentDoc {
      status?: string
    }
    const enrollmentDocs = enrollmentsResult.docs as unknown as EnrollmentDoc[]

    const activeEnrollments = enrollmentDocs.filter(
      (e) => e.status === 'active',
    ).length

    const completedEnrollments = enrollmentDocs.filter(
      (e) => e.status === 'completed',
    ).length

    const completionRate =
      totalEnrollments > 0
        ? Math.round((completedEnrollments / totalEnrollments) * 100)
        : 0

    return NextResponse.json(
      {
        data: {
          total_students: totalStudents,
          total_courses: totalCourses,
          total_enrollments: totalEnrollments,
          active_enrollments: activeEnrollments,
          completion_rate: completionRate,
        },
      },
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('[v1/analytics] GET error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json(
      { error: message, code: 'INTERNAL_ERROR' },
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
